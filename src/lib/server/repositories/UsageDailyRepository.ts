import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db';
import type { UsageDaily, UsageDelta } from '../domain/UsageDaily.types';
import { usageDaily } from '../db/schema';

function nz(value: number | undefined): number {
	return value ?? 0;
}

export class UsageDailyRepository {
	async findByKey(userId: string, botId: string, modelId: string, usageDate: string): Promise<UsageDaily | null> {
		const rows = await db
			.select()
			.from(usageDaily)
			.where(
				and(
					eq(usageDaily.userId, userId),
					eq(usageDaily.botId, botId),
					eq(usageDaily.modelId, modelId),
					eq(usageDaily.usageDate, usageDate)
				)
			)
			.limit(1);
		return rows[0] ?? null;
	}

	async increment(input: UsageDelta): Promise<void> {
		const id = crypto.randomUUID();
		const now = new Date();
		const botId = input.botId ?? null;
		const messagesIn = nz(input.messagesIn);
		const messagesOut = nz(input.messagesOut);
		const toolCalls = nz(input.toolCalls);
		const inputChars = nz(input.inputChars);
		const outputChars = nz(input.outputChars);
		await db
			.insert(usageDaily)
			.values({
				id,
				userId: input.userId,
				botId,
				modelId: input.modelId,
				usageDate: input.usageDate,
				messagesIn,
				messagesOut,
				toolCalls,
				inputChars,
				outputChars,
				createdAt: now,
				updatedAt: now
			})
			.onDuplicateKeyUpdate({
				set: {
					messagesIn: sql`${usageDaily.messagesIn} + ${messagesIn}`,
					messagesOut: sql`${usageDaily.messagesOut} + ${messagesOut}`,
					toolCalls: sql`${usageDaily.toolCalls} + ${toolCalls}`,
					inputChars: sql`${usageDaily.inputChars} + ${inputChars}`,
					outputChars: sql`${usageDaily.outputChars} + ${outputChars}`,
					updatedAt: now
				}
			});
	}

	async getBotDailyMessages(userId: string, botId: string, usageDate: string): Promise<number> {
		const rows = await db
			.select({
				total: sql<number>`coalesce(sum(${usageDaily.messagesIn} + ${usageDaily.messagesOut}), 0)`
			})
			.from(usageDaily)
			.where(
				and(
					eq(usageDaily.userId, userId),
					eq(usageDaily.botId, botId),
					eq(usageDaily.usageDate, usageDate)
				)
			)
			.limit(1);
		return Number(rows[0]?.total ?? 0);
	}
}
