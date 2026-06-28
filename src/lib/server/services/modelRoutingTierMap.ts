import type { ModelRoutingTier } from '$lib/shared/modelRoutingTier';

export const ROUTING_TIER_MODELS: Record<ModelRoutingTier, string> = {
	ultra_cheap: 'qwen/qwen3.7-max',
	standard: 'qwen/qwen3.7-max',
	coding: 'qwen/qwen3.7-max',
	complex: 'qwen/qwen3.7-max',
	creative: 'qwen/qwen3.7-max',
	long_context: 'meta-llama/llama-4-scout',
	tools: 'qwen/qwen3.7-max',
	vision: 'google/gemini-2.5-flash'
};

export function modelIdForRoutingTier(tier: ModelRoutingTier): string {
	return ROUTING_TIER_MODELS[tier];
}
