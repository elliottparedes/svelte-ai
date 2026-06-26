import { db } from '../db';
import { conversationTurns } from '../db/schema';
import { and, desc, eq, gte, lt, sql } from 'drizzle-orm';
import type {
	CreateConversationTurnInput,
	FinalizeConversationTurnInput
} from '../domain/ConversationTurn.types';

function fixed(raw: number | undefined): string | null {
	return typeof raw === 'number' && raw > 0 ? raw.toFixed(6) : null;
}

export class ConversationTurnRepository {
	async create(input: CreateConversationTurnInput): Promise<string> {
		const id = crypto.randomUUID();
		const now = new Date();
		await db.insert(conversationTurns).values({
			id,
			conversationId: input.conversationId,
			userId: input.userId,
			userMessageId: input.userMessageId,
			modelId: input.modelId,
			routeSource: input.routeSource ?? null,
			routeTier: input.routeTier ?? null,
			deepReasoning: input.deepReasoning ? 1 : 0,
			enabledToolNamesJson: input.enabledToolNames?.length ? JSON.stringify(input.enabledToolNames) : null,
			attachmentsJson: input.attachmentsJson ?? null,
			requestMetaJson: input.requestMetaJson ?? null,
			promptChars: input.promptChars,
			createdAt: now,
			updatedAt: now
		});
		return id;
	}

	async finalize(id: string, input: FinalizeConversationTurnInput): Promise<void> {
		await db
			.update(conversationTurns)
			.set({
				assistantMessageId: input.assistantMessageId ?? null,
				responseChars: input.responseChars,
				llmCostUsd: fixed(input.llmCostUsd),
				toolCostUsd: fixed(input.toolCostUsd),
				totalCostUsd: fixed(input.totalCostUsd),
				promptTokens: input.promptTokens ?? null,
				completionTokens: input.completionTokens ?? null,
				toolCallsJson: input.toolCallsJson ?? null,
				status: input.status,
				errorMessage: input.errorMessage ?? null,
				updatedAt: new Date()
			})
			.where(eq(conversationTurns.id, id));
	}

	async findLatestByConversationId(conversationId: string) {
		const rows = await db
			.select()
			.from(conversationTurns)
			.where(eq(conversationTurns.conversationId, conversationId))
			.orderBy(desc(conversationTurns.createdAt))
			.limit(1);
		return rows[0] ?? null;
	}

	async sumUserSpendBetween(userId: string, start: Date, endExclusive: Date): Promise<number> {
		const rows = await db
			.select({
				total: sql<string>`coalesce(sum(${conversationTurns.totalCostUsd}), 0)`
			})
			.from(conversationTurns)
			.where(
				and(
					eq(conversationTurns.userId, userId),
					gte(conversationTurns.createdAt, start),
					lt(conversationTurns.createdAt, endExclusive)
				)
			);
		return Number(rows[0]?.total ?? 0);
	}
}
