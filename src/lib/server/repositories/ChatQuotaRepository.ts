import { db } from '../db';
import { conversations, messages } from '../db/schema';
import { and, eq, gte, sql } from 'drizzle-orm';

/** Counts user turns (role=user) across the user's conversations. */
export class ChatQuotaRepository {
	async countUserChatTurns(userId: string, since?: Date): Promise<number> {
		const conditions = [eq(conversations.userId, userId), eq(messages.role, 'user')];
		if (since) {
			conditions.push(gte(messages.createdAt, since));
		}
		const rows = await db
			.select({ total: sql<number>`count(*)` })
			.from(messages)
			.innerJoin(conversations, eq(messages.conversationId, conversations.id))
			.where(and(...conditions));
		return Number(rows[0]?.total ?? 0);
	}
}
