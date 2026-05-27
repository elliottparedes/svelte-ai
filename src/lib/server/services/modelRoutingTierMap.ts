import type { ModelRoutingTier } from '$lib/shared/modelRoutingTier';
import { OPENROUTER_DEFAULT_MODEL } from '../db/config';

export const ROUTING_TIER_MODELS: Record<ModelRoutingTier, string> = {
	ultra_cheap: 'z-ai/glm-4.7-flash',
	standard: OPENROUTER_DEFAULT_MODEL,
	coding: 'minimax/minimax-m2.5',
	complex: 'google/gemini-2.5-flash',
	creative: 'x-ai/grok-4.3',
	long_context: 'meta-llama/llama-4-scout',
	tools: 'qwen/qwen3.5-flash-02-23',
	vision: 'google/gemini-2.5-flash'
};

export function modelIdForRoutingTier(tier: ModelRoutingTier): string {
	return ROUTING_TIER_MODELS[tier];
}
