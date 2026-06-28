import type { ChatModel } from '../domain/ChatProvider.interface';
import type { Model } from '$lib/types/dashboard';

/** Models the auto-router may select (dashboard context meter + capabilities). */
export const ROUTING_POOL_MODEL_IDS: readonly string[] = [
	'qwen/qwen3.7-max',
	'google/gemini-2.5-flash',
	'meta-llama/llama-4-scout',
	'moonshotai/kimi-k2-thinking',
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
