import type { ModelRoutingTier } from '$lib/shared/modelRoutingTier';
import { OPENROUTER_DEFAULT_MODEL } from '../db/config';

export const ROUTING_TIER_MODELS: Record<ModelRoutingTier, string> = {
	ultra_cheap: 'z-ai/glm-4.7-flash',
	standard: OPENROUTER_DEFAULT_MODEL,
	complex: 'qwen/qwen3-max',
	tools: 'qwen/qwen3.5-flash-02-23',
	vision: 'google/gemini-2.5-flash-lite'
};

export function modelIdForRoutingTier(tier: ModelRoutingTier): string {
	return ROUTING_TIER_MODELS[tier];
}
