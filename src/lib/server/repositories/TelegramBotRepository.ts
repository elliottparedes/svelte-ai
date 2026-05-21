import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { DomainError } from '../domain/DomainError';
import type {
	CreateTelegramBotInput,
	TelegramBot,
	UpdateTelegramBotInput
} from '../domain/TelegramBot.types';
import { telegramBots } from '../db/schema';

export class TelegramBotRepository {
	async findById(id: string): Promise<TelegramBot | null> {
		const rows = await db.select().from(telegramBots).where(eq(telegramBots.id, id)).limit(1);
		return rows[0] ?? null;
	}

	async findByUserId(userId: string): Promise<TelegramBot[]> {
		return db
			.select()
			.from(telegramBots)
			.where(eq(telegramBots.userId, userId))
			.orderBy(desc(telegramBots.updatedAt));
	}

	async create(input: CreateTelegramBotInput): Promise<TelegramBot> {
		const id = crypto.randomUUID();
		const now = new Date();
		await db.insert(telegramBots).values({
			id,
			userId: input.userId,
			projectId: input.projectId ?? null,
			name: input.name,
			tokenCiphertext: input.tokenCiphertext,
			tokenHint: input.tokenHint,
			webhookSecret: input.webhookSecret,
			defaultModelId: input.defaultModelId ?? null,
			enabledToolNames: input.enabledToolNames ?? null,
			dailyMessageLimit: input.dailyMessageLimit ?? 200,
			createdAt: now,
			updatedAt: now
		});
		const bot = await this.findById(id);
		if (!bot) throw new DomainError('Failed to create Telegram bot', 500);
		return bot;
	}

	async update(id: string, input: UpdateTelegramBotInput): Promise<TelegramBot> {
		await db
			.update(telegramBots)
			.set({ ...input, updatedAt: new Date() })
			.where(eq(telegramBots.id, id));
		const bot = await this.findById(id);
		if (!bot) throw new DomainError('Telegram bot not found', 404);
		return bot;
	}

	async deleteByUserId(id: string, userId: string): Promise<void> {
		await db.delete(telegramBots).where(and(eq(telegramBots.id, id), eq(telegramBots.userId, userId)));
	}
}
