import type { OpenRouterUsage } from '../domain/OpenRouterUsage.types';
import { mergeOpenRouterUsage } from '../infrastructure/openRouterUsage.util';

export class ChatTurnUsageAccumulator {
	private total: OpenRouterUsage = { costUsd: 0, promptTokens: 0, completionTokens: 0 };

	add(usage: OpenRouterUsage | null | undefined): void {
		if (!usage) return;
		this.total = mergeOpenRouterUsage(this.total, usage);
	}

	snapshot(): OpenRouterUsage {
		return { ...this.total };
	}

	get costUsd(): number {
		return this.total.costUsd;
	}
}
