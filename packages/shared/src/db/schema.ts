import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

// ============ Better Auth Tables ============

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  name: text('name'),
  image: text('image'),
  role: text('role').notNull().default('user'), // 'user' | 'admin'
  banned: integer('banned', { mode: 'boolean' }).default(false),
  banReason: text('ban_reason'),
  banExpires: integer('ban_expires', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    impersonatedBy: text('impersonated_by'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_sessions_user_id').on(table.userId),
    tokenIdx: index('idx_sessions_token').on(table.token),
  }),
);

export const accounts = sqliteTable(
  'accounts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(), // 'google' | 'github'
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
    scope: text('scope'),
    idToken: text('id_token'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_accounts_user_id').on(table.userId),
    providerIdx: index('idx_accounts_provider').on(table.providerId, table.accountId),
  }),
);

export const verifications = sqliteTable(
  'verifications',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }),
    updatedAt: integer('updated_at', { mode: 'timestamp' }),
  },
  (table) => ({
    identifierIdx: index('idx_verifications_identifier').on(table.identifier),
  }),
);

// ============ API Keys ============

export const apiKeys = sqliteTable(
  'api_keys',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    keyHash: text('key_hash').notNull(), // SHA-256 hash
    keyPrefix: text('key_prefix').notNull(), // 'fmcp_abc...' for display
    lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
    expiresAt: integer('expires_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    revokedAt: integer('revoked_at', { mode: 'timestamp' }),
  },
  (table) => ({
    userIdIdx: index('idx_api_keys_user_id').on(table.userId),
    keyPrefixIdx: index('idx_api_keys_prefix').on(table.keyPrefix),
  }),
);

// ============ Application Settings ============
// Configurable settings (managed via admin API)

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(), // JSON stringified value
  description: text('description'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  updatedBy: text('updated_by'), // user ID who last updated
});

// ============ Usage Events (for analytics) ============
// Detailed log of all tool invocations

export const usageEvents = sqliteTable(
  'usage_events',
  {
    id: text('id').primaryKey(),
    userId: text('user_id'), // null for anonymous users
    apiKeyId: text('api_key_id'), // which API key was used (if any)
    sessionId: text('session_id').notNull(),
    fizzyAccountSlug: text('fizzy_account_slug'),
    toolName: text('tool_name').notNull(),
    isWriteOperation: integer('is_write_operation', { mode: 'boolean' }).notNull(),
    success: integer('success', { mode: 'boolean' }).notNull(),
    errorCode: text('error_code'),
    durationMs: integer('duration_ms'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_usage_user_id').on(table.userId),
    apiKeyIdIdx: index('idx_usage_api_key_id').on(table.apiKeyId),
    createdAtIdx: index('idx_usage_created_at').on(table.createdAt),
    toolNameIdx: index('idx_usage_tool_name').on(table.toolName),
    sessionIdIdx: index('idx_usage_session_id').on(table.sessionId),
  }),
);

// ============ Daily Usage Counters ============
// Aggregated daily counters for fast limit checking

export const dailyUsage = sqliteTable(
  'daily_usage',
  {
    id: text('id').primaryKey(), // format: {userId|sessionId}:{YYYY-MM-DD}
    userId: text('user_id'), // null for anonymous
    sessionId: text('session_id').notNull(),
    date: text('date').notNull(), // YYYY-MM-DD format
    readCount: integer('read_count').notNull().default(0),
    writeCount: integer('write_count').notNull().default(0),
    lastUpdated: integer('last_updated', { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    lookupIdx: index('idx_daily_usage_lookup').on(table.sessionId, table.date),
    userDateIdx: index('idx_daily_usage_user_date').on(table.userId, table.date),
  }),
);

// ============ Type Exports ============

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;

export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;

export type UsageEvent = typeof usageEvents.$inferSelect;
export type NewUsageEvent = typeof usageEvents.$inferInsert;

export type DailyUsage = typeof dailyUsage.$inferSelect;
export type NewDailyUsage = typeof dailyUsage.$inferInsert;
