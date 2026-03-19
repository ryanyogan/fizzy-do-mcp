/**
 * Vibe Mode WebSocket client.
 *
 * Connects to the Cloudflare Worker to receive work assignments and report progress.
 * Handles connection management, authentication, and message passing.
 *
 * @module vibe/client
 */

import { EventEmitter } from 'node:events';
import {
  parseServerMessage,
  clientMessage,
  serializeMessage,
  type ServerMessage,
  type CardWorkItem,
  type VibeConfig,
} from '@fizzy-do-mcp/shared';

/** Default WebSocket endpoint for vibe mode */
const DEFAULT_ENDPOINT = 'wss://mcp.fizzy.yogan.dev/vibe/ws';

/** Maximum reconnection delay in milliseconds */
const MAX_RECONNECT_DELAY_MS = 30_000;

/** Initial reconnection delay in milliseconds */
const INITIAL_RECONNECT_DELAY_MS = 1_000;

/**
 * Options for creating a VibeClient instance.
 */
export interface VibeClientOptions {
  /** WebSocket endpoint URL */
  endpoint?: string;
  /** Board ID to receive work for */
  boardId: string;
  /** Fizzy API token for authentication */
  fizzyToken: string;
  /** Local path to the git repository */
  repoPath: string;
  /** Callback when work is assigned */
  onWork?: (card: CardWorkItem, mode: 'ai-code' | 'ai-plan', config: VibeConfig) => void;
}

/**
 * Event types emitted by VibeClient.
 */
export interface VibeClientEvents {
  /** Emitted when connected and authenticated */
  connected: [sessionId: string];
  /** Emitted when disconnected (with optional error) */
  disconnected: [error?: Error];
  /** Emitted when work is assigned */
  work: [card: CardWorkItem, mode: 'ai-code' | 'ai-plan', config: VibeConfig];
  /** Emitted when work is cancelled */
  cancelled: [cardNumber: number, reason: string];
  /** Emitted when queue status is updated */
  queue: [cardsWaiting: number, position?: number];
  /** Emitted on server error */
  error: [code: string, message: string];
}

/**
 * WebSocket client for Vibe Mode.
 *
 * Connects to the Cloudflare Worker, authenticates, and receives work assignments.
 * Automatically reconnects on connection loss with exponential backoff.
 *
 * @example
 * ```ts
 * const client = new VibeClient({
 *   boardId: 'board-123',
 *   fizzyToken: 'token',
 *   repoPath: '/path/to/repo',
 * });
 *
 * client.on('connected', (sessionId) => {
 *   console.log('Connected with session:', sessionId);
 *   client.sendReady();
 * });
 *
 * client.on('work', (card, mode, config) => {
 *   console.log('Received work:', card.title);
 *   client.sendWorkStarted(card.number);
 * });
 *
 * await client.connect();
 * ```
 */
export class VibeClient extends EventEmitter {
  private readonly endpoint: string;
  private readonly boardId: string;
  private readonly fizzyToken: string;
  private readonly repoPath: string;
  private readonly onWork?: VibeClientOptions['onWork'];

  private ws: WebSocket | null = null;
  private _sessionId: string | null = null;
  private _isConnected = false;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;
  private connectPromise: Promise<void> | null = null;
  private connectResolve: (() => void) | null = null;
  private connectReject: ((error: Error) => void) | null = null;

  /**
   * Creates a new VibeClient instance.
   *
   * @param options - Client configuration options
   */
  constructor(options: VibeClientOptions) {
    super();
    this.endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
    this.boardId = options.boardId;
    this.fizzyToken = options.fizzyToken;
    this.repoPath = options.repoPath;
    this.onWork = options.onWork;
  }

  /**
   * Whether the client is currently connected.
   */
  get isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * The current session ID (null if not connected).
   */
  get sessionId(): string | null {
    return this._sessionId;
  }

  /**
   * Connects to the WebSocket server.
   *
   * @returns Promise that resolves when connected and authenticated
   * @throws Error if connection fails or authentication is rejected
   */
  connect(): Promise<void> {
    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.shouldReconnect = true;
    this.connectPromise = new Promise<void>((resolve, reject) => {
      this.connectResolve = resolve;
      this.connectReject = reject;
      this.doConnect();
    });

    return this.connectPromise;
  }

  /**
   * Disconnects from the WebSocket server.
   * Prevents automatic reconnection.
   */
  disconnect(): void {
    this.shouldReconnect = false;
    this.clearReconnectTimer();
    this.cleanup();
  }

  /**
   * Sends a 'ready' message indicating the client is ready for work.
   */
  sendReady(): void {
    this.send(clientMessage({ type: 'ready' }));
  }

  /**
   * Sends a 'work_started' message when beginning work on a card.
   *
   * @param cardNumber - The card number being worked on
   * @param branch - Optional git branch created for the work
   */
  sendWorkStarted(cardNumber: number, branch?: string): void {
    this.send(
      clientMessage({
        type: 'work_started',
        card_number: cardNumber,
        ...(branch ? { branch } : {}),
      }),
    );
  }

  /**
   * Sends a 'work_progress' message to report progress on a card.
   *
   * @param cardNumber - The card number being worked on
   * @param status - Short status description (e.g., 'analyzing', 'implementing')
   * @param details - Optional detailed progress information
   */
  sendWorkProgress(cardNumber: number, status: string, details?: string): void {
    this.send(
      clientMessage({
        type: 'work_progress',
        card_number: cardNumber,
        status,
        ...(details ? { details } : {}),
      }),
    );
  }

  /**
   * Sends a 'work_completed' message when work is successfully finished.
   *
   * @param cardNumber - The card number that was completed
   * @param summary - Summary of what was accomplished
   * @param prUrl - Optional URL of the created PR (for ai-code mode)
   */
  sendWorkCompleted(cardNumber: number, summary: string, prUrl?: string): void {
    this.send(
      clientMessage({
        type: 'work_completed',
        card_number: cardNumber,
        summary,
        ...(prUrl ? { pr_url: prUrl } : {}),
      }),
    );
  }

  /**
   * Sends a 'work_failed' message when work cannot be completed.
   *
   * @param cardNumber - The card number that failed
   * @param error - Error message describing the failure
   * @param details - Optional detailed error information
   */
  sendWorkFailed(cardNumber: number, error: string, details?: string): void {
    this.send(
      clientMessage({
        type: 'work_failed',
        card_number: cardNumber,
        error,
        ...(details ? { details } : {}),
      }),
    );
  }

  // Type-safe event emitter methods
  override on<K extends keyof VibeClientEvents>(
    event: K,
    listener: (...args: VibeClientEvents[K]) => void,
  ): this {
    return super.on(event, listener as (...args: unknown[]) => void);
  }

  override once<K extends keyof VibeClientEvents>(
    event: K,
    listener: (...args: VibeClientEvents[K]) => void,
  ): this {
    return super.once(event, listener as (...args: unknown[]) => void);
  }

  override emit<K extends keyof VibeClientEvents>(event: K, ...args: VibeClientEvents[K]): boolean {
    return super.emit(event, ...args);
  }

  override off<K extends keyof VibeClientEvents>(
    event: K,
    listener: (...args: VibeClientEvents[K]) => void,
  ): this {
    return super.off(event, listener as (...args: unknown[]) => void);
  }

  /**
   * Internal: Performs the actual WebSocket connection.
   */
  private doConnect(): void {
    try {
      // Build URL with query parameters for pre-upgrade authentication
      const url = new URL(this.endpoint);
      url.searchParams.set('token', this.fizzyToken);
      url.searchParams.set('board_id', this.boardId);
      url.searchParams.set('repo_path', this.repoPath);

      this.ws = new WebSocket(url.toString());

      this.ws.onopen = () => {
        this.reconnectAttempt = 0;
        this.sendRegister();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data as string);
      };

      this.ws.onerror = (event) => {
        const error = new Error(`WebSocket error: ${(event as ErrorEvent).message ?? 'Unknown'}`);
        this.handleError(error);
      };

      this.ws.onclose = (event) => {
        const wasConnected = this._isConnected;
        this._isConnected = false;
        this._sessionId = null;

        if (wasConnected) {
          this.emit('disconnected', event.reason ? new Error(event.reason) : undefined);
        }

        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Internal: Sends the registration message.
   */
  private sendRegister(): void {
    this.send(
      clientMessage({
        type: 'register',
        board_id: this.boardId,
        fizzy_token: this.fizzyToken,
        repo_path: this.repoPath,
      }),
    );
  }

  /**
   * Internal: Sends a message over the WebSocket.
   */
  private send(msg: ReturnType<typeof clientMessage>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(serializeMessage(msg));
    }
  }

  /**
   * Internal: Handles incoming WebSocket messages.
   */
  private handleMessage(data: string): void {
    const msg = parseServerMessage(data);
    if (!msg) {
      return;
    }

    switch (msg.type) {
      case 'connected':
        this.handleConnected(msg);
        break;
      case 'work_assigned':
        this.handleWorkAssigned(msg);
        break;
      case 'work_cancelled':
        this.emit('cancelled', msg.card_number, msg.reason);
        break;
      case 'queue_status':
        this.emit('queue', msg.cards_waiting, msg.position);
        break;
      case 'error':
        this.handleErrorMessage(msg);
        break;
      case 'ping':
        this.handlePing();
        break;
    }
  }

  /**
   * Internal: Handles the 'connected' message.
   */
  private handleConnected(msg: Extract<ServerMessage, { type: 'connected' }>): void {
    this._sessionId = msg.session_id;
    this._isConnected = true;

    // Resolve the connect promise
    if (this.connectResolve) {
      this.connectResolve();
      this.connectResolve = null;
      this.connectReject = null;
      this.connectPromise = null;
    }

    this.emit('connected', msg.session_id);
  }

  /**
   * Internal: Handles the 'work_assigned' message.
   */
  private handleWorkAssigned(msg: Extract<ServerMessage, { type: 'work_assigned' }>): void {
    this.emit('work', msg.card, msg.mode, msg.config);
    this.onWork?.(msg.card, msg.mode, msg.config);
  }

  /**
   * Internal: Handles the 'error' message.
   */
  private handleErrorMessage(msg: Extract<ServerMessage, { type: 'error' }>): void {
    this.emit('error', msg.code, msg.message);

    // Reject connect promise if still pending
    if (this.connectReject) {
      this.connectReject(new Error(`Server error [${msg.code}]: ${msg.message}`));
      this.connectResolve = null;
      this.connectReject = null;
      this.connectPromise = null;
    }
  }

  /**
   * Internal: Handles ping messages by sending pong.
   */
  private handlePing(): void {
    this.send(clientMessage({ type: 'pong' }));
  }

  /**
   * Internal: Handles connection errors.
   */
  private handleError(error: Error): void {
    if (this.connectReject) {
      this.connectReject(error);
      this.connectResolve = null;
      this.connectReject = null;
      this.connectPromise = null;
    }

    if (this._isConnected) {
      this.emit('disconnected', error);
    }
  }

  /**
   * Internal: Schedules a reconnection attempt with exponential backoff.
   */
  private scheduleReconnect(): void {
    if (!this.shouldReconnect) {
      return;
    }

    const delay = Math.min(
      INITIAL_RECONNECT_DELAY_MS * 2 ** this.reconnectAttempt,
      MAX_RECONNECT_DELAY_MS,
    );

    this.reconnectAttempt++;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;

      // Create new connect promise for reconnection
      if (!this.connectPromise) {
        this.connectPromise = new Promise<void>((resolve, reject) => {
          this.connectResolve = resolve;
          this.connectReject = reject;
        });
      }

      this.doConnect();
    }, delay);
  }

  /**
   * Internal: Clears the reconnection timer.
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Internal: Cleans up the WebSocket connection.
   */
  private cleanup(): void {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;

      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }

      this.ws = null;
    }

    this._isConnected = false;
    this._sessionId = null;
  }
}
