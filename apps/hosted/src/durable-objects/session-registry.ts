/**
 * Session Registry Durable Object
 *
 * Tracks connected vibe sessions per account. One instance per account,
 * keyed by account slug.
 *
 * Responsibilities:
 * - Track which boards have active sessions
 * - Route messages to the correct session
 * - Handle session lifecycle (connect/disconnect)
 */

import { DurableObject } from 'cloudflare:workers';
import type { Env } from '../types';
import {
  parseClientMessage,
  serializeMessage,
  serverMessage,
  ERROR_CODES,
  type ServerMessage,
} from '@fizzy-do-mcp/shared';

/**
 * Session information stored in the registry
 */
interface SessionInfo {
  /** Session ID */
  sessionId: string;
  /** Board ID this session is connected to */
  boardId: string;
  /** Local repository path */
  repoPath: string;
  /** User ID */
  userId: string;
  /** WebSocket connection */
  ws: WebSocket;
  /** When the session was created */
  connectedAt: number;
  /** Last ping time */
  lastPing: number;
}

/**
 * Session Registry Durable Object
 *
 * Manages active vibe coding sessions for an account.
 */
export class SessionRegistry extends DurableObject<Env> {
  /** Active sessions by board ID */
  private sessions: Map<string, SessionInfo> = new Map();

  /** Active sessions by session ID (for quick lookup) */
  private sessionsBySessionId: Map<string, SessionInfo> = new Map();

  /** Ping interval ID */
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    // Start ping interval
    this.startPingInterval();
  }

  /**
   * Start the ping interval to keep connections alive
   */
  private startPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.pingInterval = setInterval(() => {
      this.pingAllSessions();
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Ping all connected sessions
   */
  private pingAllSessions(): void {
    const now = Date.now();
    const pingMessage = serializeMessage(serverMessage({ type: 'ping' }));

    for (const [boardId, session] of this.sessions) {
      // Check if session is stale (no pong in 60 seconds)
      if (now - session.lastPing > 60000) {
        console.log(`Session ${session.sessionId} for board ${boardId} is stale, disconnecting`);
        this.removeSession(boardId, session.sessionId);
        continue;
      }

      try {
        session.ws.send(pingMessage);
      } catch (error) {
        console.error(`Failed to ping session ${session.sessionId}:`, error);
        this.removeSession(boardId, session.sessionId);
      }
    }
  }

  /**
   * Handle incoming fetch requests
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Handle WebSocket upgrades for /connect (case-insensitive per HTTP spec)
    if (request.headers.get('Upgrade')?.toLowerCase() === 'websocket' && url.pathname === '/connect') {
      return this.handleWebSocketConnect(request);
    }

    // Handle HTTP requests
    switch (url.pathname) {
      case '/register':
        return this.handleRegister(request);
      case '/sessions':
        return this.handleGetSessions();
      case '/broadcast':
        return this.handleBroadcast(request);
      default:
        return new Response('Not found', { status: 404 });
    }
  }

  /**
   * Handle WebSocket connection with pre-authenticated session info
   */
  private handleWebSocketConnect(request: Request): Response {
    // Get session info from headers (set by the handler after validation)
    const sessionId = request.headers.get('X-Session-Id');
    const boardId = request.headers.get('X-Board-Id');
    const repoPath = request.headers.get('X-Repo-Path');
    const userId = request.headers.get('X-User-Id');

    if (!sessionId || !boardId || !repoPath || !userId) {
      return new Response('Missing session headers', { status: 400 });
    }

    // Check if there's already a session for this board
    if (this.sessions.has(boardId)) {
      return new Response(
        JSON.stringify({
          error: ERROR_CODES.ALREADY_CONNECTED,
          message: `Board ${boardId} already has an active session`,
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Create WebSocket pair
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];

    // Accept the server side
    server.accept();

    // Register the session
    const session: SessionInfo = {
      sessionId,
      boardId,
      repoPath,
      userId,
      ws: server,
      connectedAt: Date.now(),
      lastPing: Date.now(),
    };

    this.sessions.set(boardId, session);
    this.sessionsBySessionId.set(sessionId, session);

    console.log(`Session ${sessionId} connected for board ${boardId}`);

    // Send connected message
    server.send(
      serializeMessage(
        serverMessage({
          type: 'connected',
          session_id: sessionId,
        }),
      ),
    );

    // Set up message handling
    server.addEventListener('message', (event) => {
      this.handleWebSocketMessage(server, event);
    });

    server.addEventListener('close', () => {
      this.handleWebSocketClose(server);
    });

    server.addEventListener('error', (event) => {
      console.error(`WebSocket error for session ${sessionId}:`, event);
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  /**
   * Handle WebSocket messages
   */
  private handleWebSocketMessage(ws: WebSocket, event: MessageEvent): void {
    const data =
      typeof event.data === 'string'
        ? event.data
        : new TextDecoder().decode(event.data as ArrayBuffer);
    const message = parseClientMessage(data);

    if (!message) {
      ws.send(
        serializeMessage(
          serverMessage({
            type: 'error',
            code: ERROR_CODES.INVALID_MESSAGE,
            message: 'Invalid message format',
          }),
        ),
      );
      return;
    }

    // Handle pong messages
    if (message.type === 'pong') {
      const session = this.findSessionByWebSocket(ws);
      if (session) {
        session.lastPing = Date.now();
      }
      return;
    }

    // Handle ready messages
    if (message.type === 'ready') {
      const session = this.findSessionByWebSocket(ws);
      if (session) {
        void this.handleReady(session);
      }
      return;
    }

    // Handle work progress/completion messages
    if (
      message.type === 'work_started' ||
      message.type === 'work_progress' ||
      message.type === 'work_completed' ||
      message.type === 'work_failed'
    ) {
      const session = this.findSessionByWebSocket(ws);
      if (session) {
        void this.handleWorkUpdate(session, message);
      }
      return;
    }
  }

  /**
   * Find a session by its WebSocket
   */
  private findSessionByWebSocket(ws: WebSocket): SessionInfo | undefined {
    for (const session of this.sessions.values()) {
      if (session.ws === ws) {
        return session;
      }
    }
    return undefined;
  }

  /**
   * Handle WebSocket close events
   */
  private handleWebSocketClose(ws: WebSocket): void {
    const session = this.findSessionByWebSocket(ws);
    if (session) {
      this.removeSession(session.boardId, session.sessionId);
    }
  }

  /**
   * Handle session registration
   */
  private async handleRegister(request: Request): Promise<Response> {
    try {
      const body = (await request.json()) as {
        sessionId: string;
        boardId: string;
        repoPath: string;
        userId: string;
        accountSlug: string;
      };

      const { sessionId, boardId, repoPath, userId } = body;

      // Check if there's already a session for this board
      const existingSession = this.sessions.get(boardId);
      if (existingSession) {
        return new Response(
          JSON.stringify({
            error: ERROR_CODES.ALREADY_CONNECTED,
            message: `Board ${boardId} already has an active session`,
          }),
          { status: 409, headers: { 'Content-Type': 'application/json' } },
        );
      }

      // Registration successful - the actual WebSocket will be set up
      // when the client sends a WebSocket upgrade request
      return new Response(
        JSON.stringify({
          sessionId,
          boardId,
          repoPath,
          userId,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: ERROR_CODES.INTERNAL_ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  /**
   * Handle getting all sessions
   */
  private handleGetSessions(): Response {
    const sessions = Array.from(this.sessions.values()).map((s) => ({
      sessionId: s.sessionId,
      boardId: s.boardId,
      repoPath: s.repoPath,
      userId: s.userId,
      connectedAt: s.connectedAt,
    }));

    return new Response(JSON.stringify({ sessions }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Handle broadcast requests
   */
  private async handleBroadcast(request: Request): Promise<Response> {
    try {
      const body = (await request.json()) as {
        boardId?: string;
        message: ServerMessage;
      };

      if (body.boardId) {
        this.broadcastToBoard(body.boardId, body.message);
      } else {
        this.broadcastToAll(body.message);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: ERROR_CODES.INTERNAL_ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  /**
   * Register a new session
   */
  registerSession(
    boardId: string,
    ws: WebSocket,
    sessionId: string,
    repoPath: string,
    userId: string,
  ): boolean {
    // Check if there's already a session for this board
    if (this.sessions.has(boardId)) {
      return false;
    }

    const session: SessionInfo = {
      sessionId,
      boardId,
      repoPath,
      userId,
      ws,
      connectedAt: Date.now(),
      lastPing: Date.now(),
    };

    this.sessions.set(boardId, session);
    this.sessionsBySessionId.set(sessionId, session);

    console.log(`Session ${sessionId} registered for board ${boardId}`);
    return true;
  }

  /**
   * Remove a session
   */
  private removeSession(boardId: string, sessionId: string): void {
    const session = this.sessions.get(boardId);
    if (session && session.sessionId === sessionId) {
      try {
        session.ws.close(1000, 'Session ended');
      } catch {
        // WebSocket might already be closed
      }
      this.sessions.delete(boardId);
      this.sessionsBySessionId.delete(sessionId);
      console.log(`Session ${sessionId} removed from board ${boardId}`);
    }
  }

  /**
   * Unregister a session
   */
  unregisterSession(boardId: string): void {
    const session = this.sessions.get(boardId);
    if (session) {
      this.removeSession(boardId, session.sessionId);
    }
  }

  /**
   * Get session for a board
   */
  getSession(boardId: string): SessionInfo | undefined {
    return this.sessions.get(boardId);
  }

  /**
   * Broadcast message to a specific board's session
   */
  broadcastToBoard(boardId: string, message: ServerMessage): void {
    const session = this.sessions.get(boardId);
    if (session) {
      try {
        session.ws.send(serializeMessage(message));
      } catch (error) {
        console.error(`Failed to send message to session ${session.sessionId}:`, error);
        this.removeSession(boardId, session.sessionId);
      }
    }
  }

  /**
   * Broadcast message to all sessions
   */
  private broadcastToAll(message: ServerMessage): void {
    const serialized = serializeMessage(message);
    for (const [boardId, session] of this.sessions) {
      try {
        session.ws.send(serialized);
      } catch (error) {
        console.error(`Failed to send message to session ${session.sessionId}:`, error);
        this.removeSession(boardId, session.sessionId);
      }
    }
  }

  /**
   * Handle ready message from client
   */
  private async handleReady(session: SessionInfo): Promise<void> {
    // Get the work queue for this board
    const queueId = this.env.WORK_QUEUE.idFromName(session.boardId);
    const queue = this.env.WORK_QUEUE.get(queueId);

    // Try to dequeue work
    const response = await queue.fetch('https://internal/dequeue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const data = (await response.json()) as {
        card: {
          number: number;
          title: string;
          description: string | null;
          tags: string[];
          board_id: string;
          board_name: string;
          steps: Array<{ id: string; content: string; completed: boolean }>;
        } | null;
        mode: 'ai-code' | 'ai-plan';
        config: {
          repository: string;
          default_branch?: string;
          branch_pattern?: string;
          pr_template?: string;
          auto_assign_pr?: boolean;
        };
        depth: number;
      };

      if (data.card) {
        // Acquire lock on the card
        const lockId = this.env.CARD_LOCK.idFromName('global');
        const lock = this.env.CARD_LOCK.get(lockId);

        const lockResponse = await lock.fetch('https://internal/acquire', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cardNumber: data.card.number,
            sessionId: session.sessionId,
          }),
        });

        if (!lockResponse.ok) {
          // Failed to acquire lock, re-enqueue and notify
          await queue.fetch('https://internal/enqueue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              card: data.card,
              mode: data.mode,
              config: data.config,
              priority: 50, // Higher priority for re-enqueued items
            }),
          });

          session.ws.send(
            serializeMessage(
              serverMessage({
                type: 'queue_status',
                cards_waiting: data.depth + 1,
              }),
            ),
          );
          return;
        }

        // Send work assignment to the session
        session.ws.send(
          serializeMessage(
            serverMessage({
              type: 'work_assigned',
              card: data.card,
              mode: data.mode,
              config: data.config,
            }),
          ),
        );

        // Also send queue status for remaining items
        session.ws.send(
          serializeMessage(
            serverMessage({
              type: 'queue_status',
              cards_waiting: data.depth,
            }),
          ),
        );
      } else {
        // No work available
        session.ws.send(
          serializeMessage(
            serverMessage({
              type: 'queue_status',
              cards_waiting: 0,
            }),
          ),
        );
      }
    }
  }

  /**
   * Handle work update messages from client
   */
  private async handleWorkUpdate(
    session: SessionInfo,
    message: { type: string; card_number?: number; [key: string]: unknown },
  ): Promise<void> {
    // Release the card lock if work is completed or failed
    if (
      (message.type === 'work_completed' || message.type === 'work_failed') &&
      typeof message.card_number === 'number'
    ) {
      const lockId = this.env.CARD_LOCK.idFromName('global');
      const lock = this.env.CARD_LOCK.get(lockId);

      await lock.fetch('https://internal/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardNumber: message.card_number,
          sessionId: session.sessionId,
        }),
      });
    }

    // Log the update
    console.log(`Work update from session ${session.sessionId}: ${message.type}`);
  }
}
