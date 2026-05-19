import { mysqlTable, varchar, text, longtext, timestamp, index } from 'drizzle-orm/mysql-core';

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
	toolCallId: varchar('tool_call_id', { length: 64 }),
	createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => [
	index('msg_conversation_id_idx').on(table.conversationId)
]);
