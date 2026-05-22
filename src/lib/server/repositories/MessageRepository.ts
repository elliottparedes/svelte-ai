import { db } from '../db';
import { messages } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import type { ChatMessage } from '../domain/ChatProvider.interface';

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
		const ordered = rows.reverse();

		return ordered.map((r) => ({
			id: r.id,
			role: r.role as 'user' | 'assistant' | 'system' | 'tool',
			content: r.content,
			reasoningContent: r.reasoningContent ?? undefined,
			createdAt: r.createdAt,
			toolCallId: r.toolCallId ?? undefined
		}));
	}

	async create(
		conversationId: string,
		role: 'user' | 'assistant' | 'system' | 'tool',
		content: string,
		toolCallId?: string,
		reasoningContent?: string
	): Promise<ChatMessage> {
		const id = crypto.randomUUID();
		await db.insert(messages).values({
			id,
			conversationId,
			role,
			content,
			reasoningContent: reasoningContent ?? null,
			toolCallId: toolCallId ?? null
		});
		return { id, role, content, reasoningContent, createdAt: new Date(), toolCallId };
	}

	async deleteByConversationId(conversationId: string): Promise<void> {
		await db.delete(messages).where(eq(messages.conversationId, conversationId));
	}
}
