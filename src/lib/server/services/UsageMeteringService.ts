import { DomainError } from '../domain/DomainError';
import type { TelegramBot } from '../domain/TelegramBot.types';
import { UsageDailyRepository } from '../repositories/UsageDailyRepository';

function todayIso(): string {
	return new Date().toISOString().slice(0, 10);
}

export class UsageMeteringService {
	constructor(private readonly usageRepo: UsageDailyRepository) {}

	async assertBotWithinDailyLimit(userId: string, bot: TelegramBot): Promise<void> {
		const date = todayIso();
		const total = await this.usageRepo.getBotDailyMessages(userId, bot.id, date);
		if (total >= bot.dailyMessageLimit) {
			throw new DomainError('Daily message limit reached for this bot', 429);
		}
	}

	async recordInbound(userId: string, botId: string, modelId: string, prompt: string): Promise<void> {
		await this.usageRepo.increment({
			userId,
			botId,
			modelId,
			usageDate: todayIso(),
			messagesIn: 1,
			inputChars: prompt.length
		});
	}

	async recordOutbound(
		userId: string,
		botId: string,
		modelId: string,
		output: string,
		toolCalls: number
	): Promise<void> {
		await this.usageRepo.increment({
			userId,
			botId,
			modelId,
			usageDate: todayIso(),
			messagesOut: 1,
			toolCalls,
			outputChars: output.length
		});
	}
}
