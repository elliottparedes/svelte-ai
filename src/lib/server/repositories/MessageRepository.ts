import { db } from '../db';
import { messages } from '../db/schema';
import { asc, desc, eq, sql } from 'drizzle-orm';
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
		turnId: r.turnId ?? undefined,
		turnSequence: r.turnSequence ?? undefined,
		toolCallId: r.toolCallId ?? undefined,
		toolName: r.toolName ?? undefined,
		toolArgumentsJson: r.toolArgumentsJson ?? undefined,
		costUsd: parseMessageCostUsd(r.costUsd),
		toolCostUsd: parseMessageCostUsd(r.toolCostUsd),
		toolUsageJson: r.toolUsageJson ?? undefined,
		promptTokens: r.promptTokens ?? undefined,
		completionTokens: r.completionTokens ?? undefined
	};
}

export class MessageRepository {
	async findByConversationId(conversationId: string, limit?: number): Promise<ChatMessage[]> {
		if (!limit) {
			return (
				await db
					.select()
					.from(messages)
					.where(eq(messages.conversationId, conversationId))
					.orderBy(asc(messages.createdAt), asc(messages.turnSequence), asc(messages.id))
			).map(rowToChatMessage);
		}
		let query = db
			.select()
			.from(messages)
			.where(eq(messages.conversationId, conversationId))
			.orderBy(desc(messages.createdAt), desc(messages.turnSequence), desc(messages.id));
		// @ts-expect-error drizzle type issue with limit in some versions
		query = query.limit(limit);
		return (await query).reverse().map(rowToChatMessage);
	}

	async create(
		conversationId: string,
		role: 'user' | 'assistant' | 'system' | 'tool',
		content: string,
		meta: {
			turnId?: string;
			turnSequence?: number;
			toolCallId?: string;
			toolName?: string;
			toolArgumentsJson?: string;
			reasoningContent?: string;
			usage?: OpenRouterUsage | null;
			toolUsage?: ExternalToolUsageSummary | null;
		} = {}
	): Promise<ChatMessage> {
		const id = crypto.randomUUID();
		const usageFields = usageFieldsForMessage(meta.usage ?? null);
		const toolFields = toolUsageFieldsForMessage(meta.toolUsage ?? null);
		await db.insert(messages).values({
			id,
			conversationId,
			turnId: meta.turnId ?? null,
			turnSequence: meta.turnSequence ?? null,
			role,
			content,
			reasoningContent: meta.reasoningContent ?? null,
			toolCallId: meta.toolCallId ?? null,
			toolName: meta.toolName ?? null,
			toolArgumentsJson: meta.toolArgumentsJson ?? null,
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
			reasoningContent: meta.reasoningContent,
			createdAt: new Date(),
			turnId: meta.turnId,
			turnSequence: meta.turnSequence,
			toolCallId: meta.toolCallId,
			toolName: meta.toolName,
			toolArgumentsJson: meta.toolArgumentsJson,
			costUsd: meta.usage?.costUsd,
			toolCostUsd: meta.toolUsage?.costUsd,
			toolUsageJson: toolFields.toolUsageJson ?? undefined,
			promptTokens: meta.usage?.promptTokens,
			completionTokens: meta.usage?.completionTokens
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
