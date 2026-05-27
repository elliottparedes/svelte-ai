import type { ChatModel } from '../domain/ChatProvider.interface';
import type { Model } from '$lib/types/dashboard';

/** Models the auto-router may select (dashboard context meter + capabilities). */
export const ROUTING_POOL_MODEL_IDS: readonly string[] = [
	'z-ai/glm-4.7-flash',
	'google/gemini-2.0-flash-lite-001',
	'qwen/qwen3.5-flash-02-23',
	'minimax/minimax-m2.5',
	'google/gemini-2.5-flash',
	'x-ai/grok-4.3',
	'meta-llama/llama-4-scout',
	'deepseek/deepseek-r1-0528',
	'openai/gpt-4o-mini'
];

export function pickRoutingPoolModels(catalog: readonly ChatModel[]): Model[] {
	const byId = new Map(catalog.map((m) => [m.id, m]));
	const out: Model[] = [];
	for (const id of ROUTING_POOL_MODEL_IDS) {
		const m = byId.get(id);
		if (m) out.push(m);
	}
	return out;
}
