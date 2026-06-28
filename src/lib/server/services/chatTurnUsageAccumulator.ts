import type { OpenRouterUsage } from '../domain/OpenRouterUsage.types';
import type { ExternalToolUsage, ExternalToolUsageSummary } from '../domain/ExternalToolUsage.types';
import { mergeOpenRouterUsage } from '../infrastructure/openRouterUsage.util';

export class ChatTurnUsageAccumulator {
	private total: OpenRouterUsage = { costUsd: 0, promptTokens: 0, completionTokens: 0 };
	private external: ExternalToolUsage[] = [];

	hydrate(
		total: OpenRouterUsage,
		externalItems: readonly ExternalToolUsage[] = []
	): void {
		this.total = { ...total };
		this.external = externalItems.map((item) => ({ ...item }));
	}

	add(usage: OpenRouterUsage | null | undefined): void {
		if (!usage) return;
		this.total = mergeOpenRouterUsage(this.total, usage);
	}

	addExternal(usage: ExternalToolUsage | null | undefined): void {
		if (!usage || usage.costUsd <= 0) return;
		this.external.push({ ...usage });
	}

	snapshot(): OpenRouterUsage {
		return { ...this.total };
	}

	snapshotExternal(): ExternalToolUsageSummary {
		return {
			costUsd: this.external.reduce((sum, item) => sum + item.costUsd, 0),
			items: this.external.map((item) => ({ ...item }))
		};
	}

	get costUsd(): number {
		return this.total.costUsd;
	}

	get toolCostUsd(): number {
		return this.snapshotExternal().costUsd;
	}

	get totalCostUsd(): number {
		return this.costUsd + this.toolCostUsd;
	}
}
