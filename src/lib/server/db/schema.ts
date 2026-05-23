import {
	index,
	int,
	longtext,
	mysqlTable,
	text,
	timestamp,
	uniqueIndex,
	varchar
} from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
	id: varchar('id', { length: 36 }).primaryKey(),
	email: varchar('email', { length: 255 }).notNull().unique(),
	name: varchar('name', { length: 255 }),
	passwordHash: varchar('password_hash', { length: 255 }),
	apiKey: varchar('api_key', { length: 255 }),
	/** ElevenLabs voice_id for dashboard TTS; null = server default. */
	ttsVoiceId: varchar('tts_voice_id', { length: 64 }),
	/** JSON string[] of enabled optional OpenRouter model ids; null = tier defaults. */
	altModelIds: text('alt_model_ids'),
	createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => [
	index('email_idx').on(table.email),
	index('api_key_idx').on(table.apiKey)
]);

export const projects = mysqlTable('projects', {
	id: varchar('id', { length: 36 }).primaryKey(),
	userId: varchar('user_id', { length: 36 }).notNull(),
	name: varchar('name', { length: 255 }).notNull(),
	systemPrompt: text('system_prompt'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => [
	index('project_user_id_idx').on(table.userId)
]);

export const conversations = mysqlTable('conversations', {
	id: varchar('id', { length: 36 }).primaryKey(),
	userId: varchar('user_id', { length: 36 }).notNull(),
	projectId: varchar('project_id', { length: 36 }),
	title: varchar('title', { length: 255 }).notNull(),
	/** OpenRouter model id used for this thread (set on first message). */
	modelId: varchar('model_id', { length: 128 }),
	/** Incremental LLM context summary of older turns (not shown in UI). */
	rollingSummary: text('rolling_summary'),
	/** Last message id included in rollingSummary. */
	summaryThroughMessageId: varchar('summary_through_message_id', { length: 36 }),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => [
	index('conv_user_id_idx').on(table.userId),
	index('conv_project_id_idx').on(table.projectId)
]);

export const messages = mysqlTable('messages', {
	id: varchar('id', { length: 36 }).primaryKey(),
	conversationId: varchar('conversation_id', { length: 36 }).notNull(),
	role: varchar('role', { length: 20 }).notNull(),
	content: longtext('content').notNull(),
	/** Chain-of-thought / reasoning tokens from reasoning models (optional). */
	reasoningContent: longtext('reasoning_content'),
	toolCallId: varchar('tool_call_id', { length: 64 }),
	createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => [
	index('msg_conversation_id_idx').on(table.conversationId)
]);

export const telegramBots = mysqlTable('telegram_bots', {
	id: varchar('id', { length: 36 }).primaryKey(),
	userId: varchar('user_id', { length: 36 }).notNull(),
	projectId: varchar('project_id', { length: 36 }),
	name: varchar('name', { length: 120 }).notNull(),
	botUsername: varchar('bot_username', { length: 64 }),
	tokenCiphertext: text('token_ciphertext').notNull(),
	tokenHint: varchar('token_hint', { length: 16 }).notNull(),
	webhookSecret: varchar('webhook_secret', { length: 64 }).notNull(),
	status: varchar('status', { length: 20 }).notNull().default('active'),
	defaultModelId: varchar('default_model_id', { length: 128 }),
	enabledToolNames: text('enabled_tool_names'),
	dailyMessageLimit: int('daily_message_limit').notNull().default(200),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => [
	index('tg_bot_user_id_idx').on(table.userId),
	index('tg_bot_project_id_idx').on(table.projectId)
]);

export const telegramChatBindings = mysqlTable('telegram_chat_bindings', {
	id: varchar('id', { length: 36 }).primaryKey(),
	botId: varchar('bot_id', { length: 36 }).notNull(),
	telegramChatId: varchar('telegram_chat_id', { length: 64 }).notNull(),
	conversationId: varchar('conversation_id', { length: 36 }).notNull(),
	lastUpdateId: varchar('last_update_id', { length: 32 }),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => [
	uniqueIndex('tg_binding_bot_chat_uq').on(table.botId, table.telegramChatId),
	index('tg_binding_conversation_id_idx').on(table.conversationId)
]);

export const usageDaily = mysqlTable('usage_daily', {
	id: varchar('id', { length: 36 }).primaryKey(),
	userId: varchar('user_id', { length: 36 }).notNull(),
	botId: varchar('bot_id', { length: 36 }),
	modelId: varchar('model_id', { length: 128 }).notNull(),
	usageDate: varchar('usage_date', { length: 10 }).notNull(),
	messagesIn: int('messages_in').notNull().default(0),
	messagesOut: int('messages_out').notNull().default(0),
	toolCalls: int('tool_calls').notNull().default(0),
	inputChars: int('input_chars').notNull().default(0),
	outputChars: int('output_chars').notNull().default(0),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => [
	uniqueIndex('usage_daily_unique').on(table.userId, table.botId, table.modelId, table.usageDate),
	index('usage_daily_user_date_idx').on(table.userId, table.usageDate),
	index('usage_daily_bot_date_idx').on(table.botId, table.usageDate)
]);
