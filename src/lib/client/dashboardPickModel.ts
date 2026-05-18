import type { Model } from '$lib/types/dashboard';

/** Pick a valid dashboard model id from stored conversation model or fallbacks. */
export function pickDashboardModelId(
	models: readonly Model[],
	modelId: string | null | undefined,
	defaultModelId: string
): string {
	if (modelId && models.some((m) => m.id === modelId)) return modelId;
	if (models.some((m) => m.id === defaultModelId)) return defaultModelId;
	return models[0]?.id ?? '';
}
