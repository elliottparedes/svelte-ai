import type { ChatModel } from '../domain/ChatProvider.interface';
import { promptInputTokenBudget } from '$lib/shared/contextWindowBudget';

const BASE = 'https://openrouter.ai/api/v1/models';
const CACHE_TTL_MS = 30 * 60 * 1000;

type RawModel = {
	id: string;
	name: string;
	context_length?: number | null;
	top_provider?: {
		context_length?: number | null;
		max_completion_tokens?: number | null;
	} | null;
	per_request_limits?: { completion_tokens?: number; prompt_tokens?: number } | null;
	architecture?: { input_modalities?: string[]; output_modalities?: string[] };
	supported_parameters?: string[];
};

let cache: { key: string; at: number; models: readonly ChatModel[] } | null = null;

function resolveContextLength(m: RawModel): number | undefined {
	const root = m.context_length;
	if (typeof root === 'number' && root > 0) return root;
	const tp = m.top_provider?.context_length;
	if (typeof tp === 'number' && tp > 0) return tp;
	return undefined;
}

function resolveMaxCompletion(m: RawModel): number | undefined {
	const tp = m.top_provider?.max_completion_tokens;
	if (typeof tp === 'number' && tp > 0) return tp;
	const pr = m.per_request_limits?.completion_tokens;
	if (typeof pr === 'number' && pr > 0) return pr;
	return undefined;
}

function rawToChatModel(m: RawModel): ChatModel {
	const mods = m.architecture?.input_modalities ?? [];
	const out = m.architecture?.output_modalities ?? [];
	const params = m.supported_parameters;
	const supportsTools = !Array.isArray(params) || params.includes('tools');
	const supportsReasoning = Array.isArray(params) && params.includes('reasoning');
	const openRouterModalities = out.includes('image')
		? out.includes('text')
			? (['image', 'text'] as const)
			: (['image'] as const)
		: undefined;
	const ctx = resolveContextLength(m);
	const maxComp = resolveMaxCompletion(m);
	return {
		id: m.id,
		name: m.name || m.id,
		supportsVision: mods.includes('image'),
		supportsFiles: mods.includes('file'),
		supportsTools,
		supportsReasoning,
		...(openRouterModalities ? { openRouterModalities } : {}),
		...(ctx !== undefined ? { contextLength: ctx } : {}),
		...(maxComp !== undefined ? { maxCompletionTokens: maxComp } : {})
	};
}

export function promptInputBudgetForModel(
	models: readonly ChatModel[],
	modelId: string
): number | null {
	const m = models.find((x) => x.id === modelId);
	if (!m) return null;
	const ctx = m.contextLength;
	if (typeof ctx !== 'number' || ctx < 2048) return null;
	return promptInputTokenBudget(ctx, m.maxCompletionTokens);
}

export async function fetchOpenRouterChatModelsCached(
	cacheKey: string,
	headers: Record<string, string>
): Promise<readonly ChatModel[]> {
	if (cache && cache.key === cacheKey && Date.now() - cache.at < CACHE_TTL_MS) {
		return cache.models;
	}
	const res = await fetch(BASE, { headers });
	if (!res.ok) {
		const detail = (await res.text().catch(() => '')).slice(0, 800);
		throw new Error(`OpenRouter models error: ${res.status}${detail ? ` — ${detail}` : ''}`);
	}
	const json = (await res.json()) as { data: RawModel[] };
	const models = json.data.map(rawToChatModel);
	cache = { key: cacheKey, at: Date.now(), models };
	return models;
}
