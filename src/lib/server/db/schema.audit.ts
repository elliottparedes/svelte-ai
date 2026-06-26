import { decimal, index, int, longtext, mysqlTable, text, timestamp, varchar } from 'drizzle-orm/mysql-core';

export const conversationTurns = mysqlTable('conversation_turns', {
	id: varchar('id', { length: 36 }).primaryKey(),
	conversationId: varchar('conversation_id', { length: 36 }).notNull(),
	userId: varchar('user_id', { length: 36 }).notNull(),
	userMessageId: varchar('user_message_id', { length: 36 }).notNull(),
	assistantMessageId: varchar('assistant_message_id', { length: 36 }),
	modelId: varchar('model_id', { length: 128 }).notNull(),
	routeSource: varchar('route_source', { length: 32 }),
	routeTier: varchar('route_tier', { length: 32 }),
	deepReasoning: int('deep_reasoning').notNull().default(0),
	enabledToolNamesJson: text('enabled_tool_names_json'),
	attachmentsJson: longtext('attachments_json'),
	requestMetaJson: longtext('request_meta_json'),
	toolCallsJson: longtext('tool_calls_json'),
	promptChars: int('prompt_chars').notNull().default(0),
	responseChars: int('response_chars').notNull().default(0),
	llmCostUsd: decimal('llm_cost_usd', { precision: 10, scale: 6 }),
	toolCostUsd: decimal('tool_cost_usd', { precision: 10, scale: 6 }),
	totalCostUsd: decimal('total_cost_usd', { precision: 10, scale: 6 }),
	promptTokens: int('prompt_tokens'),
	completionTokens: int('completion_tokens'),
	status: varchar('status', { length: 16 }).notNull().default('completed'),
	errorMessage: text('error_message'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => [
	index('turn_conversation_id_idx').on(table.conversationId),
	index('turn_user_id_idx').on(table.userId),
	index('turn_created_at_idx').on(table.createdAt)
]);

export const conversationIssueReports = mysqlTable('conversation_issue_reports', {
	id: varchar('id', { length: 36 }).primaryKey(),
	conversationId: varchar('conversation_id', { length: 36 }).notNull(),
	turnId: varchar('turn_id', { length: 36 }).notNull(),
	reportedByUserId: varchar('reported_by_user_id', { length: 36 }).notNull(),
	latestMessageId: varchar('latest_message_id', { length: 36 }),
	clientContextJson: longtext('client_context_json'),
	status: varchar('status', { length: 16 }).notNull().default('open'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => [
	index('issue_conversation_id_idx').on(table.conversationId),
	index('issue_turn_id_idx').on(table.turnId),
	index('issue_user_id_idx').on(table.reportedByUserId)
]);
