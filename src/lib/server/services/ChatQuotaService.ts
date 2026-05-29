import { DomainError } from '../domain/DomainError';
import type { User } from '../domain/User.types';
import {
	chatLimitForTier,
	parseSubscriptionTier,
	type SubscriptionTier
} from '$lib/shared/subscriptionTier';
import { ChatQuotaRepository } from '../repositories/ChatQuotaRepository';

function startOfUtcMonth(): Date {
	const now = new Date();
	return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export type ChatQuotaSnapshot = {
	tier: SubscriptionTier;
	used: number;
	limit: number | null;
	resetsMonthly: boolean;
};

export class ChatQuotaService {
	constructor(private readonly repo = new ChatQuotaRepository()) {}

	async snapshot(user: User): Promise<ChatQuotaSnapshot> {
		const tier = parseSubscriptionTier(user.subscriptionTier);
		const limit = chatLimitForTier(tier);
		const since = tier === 'standard' ? startOfUtcMonth() : undefined;
		const used = await this.repo.countUserChatTurns(user.id, since);
		return { tier, used, limit, resetsMonthly: tier === 'standard' };
	}

	async assertCanSend(user: User): Promise<void> {
		const { tier, used, limit } = await this.snapshot(user);
		if (limit === null) return;
		if (used >= limit) {
			const hint =
				tier === 'free'
					? 'Free tier allows 20 chats. Upgrade to Standard or Pro for more.'
					: 'Standard tier allows 500 chats per month. Upgrade to Pro for unlimited access.';
			throw new DomainError(hint, 429);
		}
	}
}
