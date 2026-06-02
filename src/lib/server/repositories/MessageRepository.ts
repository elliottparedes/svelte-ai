import { db } from '../db';
import { messages } from '../db/schema';
import { eq, sql, desc } from 'drizzle-orm';
import type { ChatMessage } from '../domain/ChatProvider.interface';
import type { OpenRouterUsage } from '../domain/OpenRouterUsage.types';
import type { ExternalToolUsageSummary } from '../domain/ExternalToolUsage.types';
import {
	parseMessageCostUsd,
	toolUsageFieldsForMessage,
	usageFieldsForMessage
} from '../services/conversationTurnUsage.util';

function rowToChatMessage(r: typeof messages.$inferSelect): ChatMessage {
	return {
		id: r.id,
		role: r.role as 'user' | 'assistant' | 'system' | 'tool',
		content: r.content,
		reasoningContent: r.reasoningContent ?? undefined,
		createdAt: r.createdAt,
		toolCallId: r.toolCallId ?? undefined,
		costUsd: parseMessageCostUsd(r.costUsd),
		toolCostUsd: parseMessageCostUsd(r.toolCostUsd),
		toolUsageJson: r.toolUsageJson ?? undefined,
		promptTokens: r.promptTokens ?? undefined,
		completionTokens: r.completionTokens ?? undefined
	};
}

export class MessageRepository {
	async findByConversationId(conversationId: string, limit?: number): Promise<ChatMessage[]> {
		let query = db
			.select()
			.from(messages)
			.where(eq(messages.conversationId, conversationId))
			.orderBy(desc(messages.createdAt));

		if (limit) {
			// @ts-expect-error drizzle type issue with limit in some versions
			query = query.limit(limit);
		}

		const rows = await query;
		return rows.reverse().map(rowToChatMessage);
	}

	async create(
		conversationId: string,
		role: 'user' | 'assistant' | 'system' | 'tool',
		content: string,
		toolCallId?: string,
		reasoningContent?: string,
		usage?: OpenRouterUsage | null,
		toolUsage?: ExternalToolUsageSummary | null
	): Promise<ChatMessage> {
		const id = crypto.randomUUID();
		const usageFields = usageFieldsForMessage(usage ?? null);
		const toolFields = toolUsageFieldsForMessage(toolUsage ?? null);
		await db.insert(messages).values({
			id,
			conversationId,
			role,
			content,
			reasoningContent: reasoningContent ?? null,
			toolCallId: toolCallId ?? null,
			costUsd: usageFields.costUsd,
			toolCostUsd: toolFields.toolCostUsd,
			toolUsageJson: toolFields.toolUsageJson,
			promptTokens: usageFields.promptTokens,
			completionTokens: usageFields.completionTokens
		});
		return {
			id,
			role,
			content,
			reasoningContent,
			createdAt: new Date(),
			toolCallId,
			costUsd: usage?.costUsd,
			toolCostUsd: toolUsage?.costUsd,
			toolUsageJson: toolFields.toolUsageJson ?? undefined,
			promptTokens: usage?.promptTokens,
			completionTokens: usage?.completionTokens
		};
	}

	async addUsage(messageId: string, delta: OpenRouterUsage): Promise<void> {
		if (delta.costUsd === 0 && delta.promptTokens === 0 && delta.completionTokens === 0) return;
		const fields = usageFieldsForMessage(delta);
		await db
			.update(messages)
			.set({
				costUsd: sql`coalesce(${messages.costUsd}, 0) + ${fields.costUsd ?? '0'}`,
				promptTokens: sql`coalesce(${messages.promptTokens}, 0) + ${delta.promptTokens}`,
				completionTokens: sql`coalesce(${messages.completionTokens}, 0) + ${delta.completionTokens}`
			})
			.where(eq(messages.id, messageId));
	}

	async deleteByConversationId(conversationId: string): Promise<void> {
		await db.delete(messages).where(eq(messages.conversationId, conversationId));
	}
}
