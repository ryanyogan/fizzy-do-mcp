/**
 * API endpoint modules for the Fizzy client.
 *
 * @module @fizzy-mcp/client/endpoints
 */

export { BaseEndpoint, GlobalEndpoint, type EndpointContext } from './base.js';
export { IdentityEndpoint, AccountEndpoint } from './identity.js';
export { BoardsEndpoint } from './boards.js';
export { ColumnsEndpoint } from './columns.js';
export { CardsEndpoint } from './cards.js';
export { CommentsEndpoint } from './comments.js';
export { TagsEndpoint } from './tags.js';
export { UsersEndpoint } from './users.js';
export { PinsEndpoint } from './pins.js';
