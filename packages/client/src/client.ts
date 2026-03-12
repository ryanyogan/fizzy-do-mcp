import { DEFAULT_CONFIG } from '@fizzy-mcp/shared';
import { FetchHttpClient, type HttpClient, type RetryConfig } from './http/index.js';
import {
  IdentityEndpoint,
  AccountEndpoint,
  BoardsEndpoint,
  ColumnsEndpoint,
  CardsEndpoint,
  CommentsEndpoint,
  TagsEndpoint,
  UsersEndpoint,
  PinsEndpoint,
} from './endpoints/index.js';

/**
 * Configuration options for the Fizzy client.
 */
export interface FizzyClientConfig {
  /**
   * Personal access token for authenticating with the Fizzy API.
   * Generate one at: https://app.fizzy.do → Profile → API → Personal Access Tokens
   */
  accessToken: string;

  /**
   * Fizzy account slug (e.g., "/897362094").
   * Found in any Fizzy URL after logging in.
   *
   * If not provided, you can still use the identity endpoint to discover accounts.
   */
  accountSlug?: string;

  /**
   * Base URL for the Fizzy API.
   * Defaults to "https://app.fizzy.do".
   */
  baseUrl?: string;

  /**
   * Custom HTTP client implementation.
   * Useful for testing or for different runtime environments.
   */
  httpClient?: HttpClient;

  /**
   * Retry configuration for transient errors.
   */
  retryConfig?: Partial<RetryConfig>;
}

/**
 * Type-safe client for the Fizzy API.
 *
 * Provides access to all Fizzy API endpoints with automatic retry,
 * error handling, and response validation.
 *
 * @example
 * ```typescript
 * const client = new FizzyClient({
 *   accessToken: process.env.FIZZY_ACCESS_TOKEN,
 *   accountSlug: '/897362094',
 * });
 *
 * // List all boards
 * const boards = await client.boards.list();
 * if (boards.ok) {
 *   for (const board of boards.value) {
 *     console.log(board.name);
 *   }
 * }
 *
 * // Create a card
 * const card = await client.cards.create('board-id', {
 *   title: 'New task',
 *   description: '<p>Task description</p>',
 * });
 * ```
 */
export class FizzyClient {
  /**
   * Identity endpoint for discovering user accounts.
   * Does not require account slug.
   */
  readonly identity: IdentityEndpoint;

  /**
   * Account endpoint for account settings.
   */
  readonly account: AccountEndpoint;

  /**
   * Boards endpoint for managing boards.
   */
  readonly boards: BoardsEndpoint;

  /**
   * Columns endpoint for managing board columns.
   */
  readonly columns: ColumnsEndpoint;

  /**
   * Cards endpoint for managing cards.
   */
  readonly cards: CardsEndpoint;

  /**
   * Comments endpoint for managing card comments.
   */
  readonly comments: CommentsEndpoint;

  /**
   * Tags endpoint for listing tags.
   */
  readonly tags: TagsEndpoint;

  /**
   * Users endpoint for listing users.
   */
  readonly users: UsersEndpoint;

  /**
   * Pins endpoint for managing pinned cards.
   */
  readonly pins: PinsEndpoint;

  /**
   * The account slug used by this client.
   */
  readonly accountSlug: string;

  /**
   * The base URL used by this client.
   */
  readonly baseUrl: string;

  constructor(config: FizzyClientConfig) {
    this.baseUrl = config.baseUrl ?? DEFAULT_CONFIG.baseUrl;
    this.accountSlug = config.accountSlug ?? '';

    // Create HTTP client
    const http =
      config.httpClient ??
      new FetchHttpClient(
        {
          baseUrl: this.baseUrl,
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
        config.retryConfig,
      );

    // Create endpoint context
    const context = { http, accountSlug: this.accountSlug };

    // Initialize endpoints
    this.identity = new IdentityEndpoint(http);
    this.account = new AccountEndpoint(context);
    this.boards = new BoardsEndpoint(context);
    this.columns = new ColumnsEndpoint(context);
    this.cards = new CardsEndpoint(context);
    this.comments = new CommentsEndpoint(context);
    this.tags = new TagsEndpoint(context);
    this.users = new UsersEndpoint(context);
    this.pins = new PinsEndpoint(http);
  }

  /**
   * Creates a new client with a different account slug.
   *
   * Useful when working with multiple accounts.
   *
   * @param accountSlug - The new account slug
   * @returns A new FizzyClient configured for the specified account
   */
  withAccount(accountSlug: string): FizzyClient {
    return new FizzyClient({
      accessToken: '', // Will be ignored since we're passing the HTTP client
      accountSlug,
      baseUrl: this.baseUrl,
      httpClient: this.getHttpClient(),
    });
  }

  /**
   * Gets the underlying HTTP client.
   * Primarily used internally for creating new client instances.
   */
  private getHttpClient(): HttpClient {
    // Access the HTTP client from one of the endpoints
    // This is a bit of a hack, but it avoids storing the client twice
    return (this.boards as unknown as { http: HttpClient }).http;
  }
}
