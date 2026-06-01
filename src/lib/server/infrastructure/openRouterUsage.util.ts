import type { OpenRouterUsage } from '../domain/OpenRouterUsage.types';

export function parseOpenRouterUsage(raw: unknown): OpenRouterUsage | null {
	if (!raw || typeof raw !== 'object') return null;
	const u = raw as Record<string, unknown>;
	const costRaw = u.cost;
	const cost =
		typeof costRaw === 'number' && costRaw >= 0
			? costRaw
			: typeof costRaw === 'string' && costRaw !== ''
				? Number(costRaw)
				: 0;
	const promptTokens =
		typeof u.prompt_tokens === 'number' && u.prompt_tokens >= 0 ? u.prompt_tokens : 0;
	const completionTokens =
		typeof u.completion_tokens === 'number' && u.completion_tokens >= 0
			? u.completion_tokens
			: 0;
	if (!Number.isFinite(cost) || (cost === 0 && promptTokens === 0 && completionTokens === 0)) {
		return null;
	}
	return { costUsd: cost, promptTokens, completionTokens };
}

export function mergeOpenRouterUsage(a: OpenRouterUsage, b: OpenRouterUsage): OpenRouterUsage {
	return {
		costUsd: a.costUsd + b.costUsd,
		promptTokens: a.promptTokens + b.promptTokens,
		completionTokens: a.completionTokens + b.completionTokens
	};
}
