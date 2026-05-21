import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { DomainError } from '../domain/DomainError';
import type {
	CreateTelegramChatBindingInput,
	TelegramChatBinding,
	UpdateTelegramChatBindingInput
} from '../domain/TelegramChatBinding.types';
import { telegramChatBindings } from '../db/schema';

export class TelegramChatBindingRepository {
	async findByBotAndChatId(botId: string, telegramChatId: string): Promise<TelegramChatBinding | null> {
		const rows = await db
			.select()
			.from(telegramChatBindings)
			.where(
				and(
					eq(telegramChatBindings.botId, botId),
					eq(telegramChatBindings.telegramChatId, telegramChatId)
				)
			)
			.limit(1);
		return rows[0] ?? null;
	}

	async create(input: CreateTelegramChatBindingInput): Promise<TelegramChatBinding> {
		const id = crypto.randomUUID();
		const now = new Date();
		await db.insert(telegramChatBindings).values({
			id,
			botId: input.botId,
			telegramChatId: input.telegramChatId,
			conversationId: input.conversationId,
			lastUpdateId: input.lastUpdateId ?? null,
			createdAt: now,
			updatedAt: now
		});
		const binding = await this.findByBotAndChatId(input.botId, input.telegramChatId);
		if (!binding) throw new DomainError('Failed to create Telegram chat binding', 500);
		return binding;
	}

	async updateByBotAndChatId(
		botId: string,
		telegramChatId: string,
		input: UpdateTelegramChatBindingInput
	): Promise<TelegramChatBinding> {
		await db
			.update(telegramChatBindings)
			.set({ ...input, updatedAt: new Date() })
			.where(
				and(
					eq(telegramChatBindings.botId, botId),
					eq(telegramChatBindings.telegramChatId, telegramChatId)
				)
			);
		const binding = await this.findByBotAndChatId(botId, telegramChatId);
		if (!binding) throw new DomainError('Telegram chat binding not found', 404);
		return binding;
	}
}
