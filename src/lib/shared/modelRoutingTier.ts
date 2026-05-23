/** Tier chosen by the router LLM or heuristic fallback. */
export type ModelRoutingTier = 'ultra_cheap' | 'standard' | 'complex' | 'tools' | 'vision';

export const MODEL_ROUTING_TIERS: readonly ModelRoutingTier[] = [
	'ultra_cheap',
	'standard',
	'complex',
	'tools',
	'vision'
];

export function isModelRoutingTier(v: string): v is ModelRoutingTier {
	return (MODEL_ROUTING_TIERS as readonly string[]).includes(v);
}
