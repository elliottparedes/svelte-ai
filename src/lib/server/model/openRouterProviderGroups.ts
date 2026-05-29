import type { ChatModel } from '../domain/ChatProvider.interface';
import type { ModelProviderGroup } from '$lib/types/dashboard';

/** Provider slug order (OpenRouter id prefix) — most popular first. */
const PROVIDER_ORDER: readonly string[] = [
	'openai',
	'google',
	'anthropic',
	'meta-llama',
	'deepseek',
	'x-ai',
	'mistralai',
	'qwen',
	'moonshotai',
	'z-ai',
	'minimax',
	'cohere',
	'perplexity',
	'nousresearch',
	'amazon',
	'microsoft'
];

const PROVIDER_LABELS: Record<string, string> = {
	openai: 'OpenAI',
	google: 'Google',
	anthropic: 'Anthropic',
	'meta-llama': 'Meta',
	deepseek: 'DeepSeek',
	'x-ai': 'xAI',
	mistralai: 'Mistral',
	qwen: 'Qwen',
	moonshotai: 'Moonshot AI',
	'z-ai': 'Z.AI',
	minimax: 'MiniMax',
	cohere: 'Cohere',
	perplexity: 'Perplexity',
	nousresearch: 'Nous',
	amazon: 'Amazon',
	microsoft: 'Microsoft'
};

function providerSlug(modelId: string): string {
	const slash = modelId.indexOf('/');
	return slash > 0 ? modelId.slice(0, slash) : modelId;
}

function providerLabel(slug: string): string {
	return PROVIDER_LABELS[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function providerRank(slug: string): number {
	const i = PROVIDER_ORDER.indexOf(slug);
	return i >= 0 ? i : PROVIDER_ORDER.length + slug.charCodeAt(0);
}

export function groupOpenRouterModelsByProvider(catalog: readonly ChatModel[]): ModelProviderGroup[] {
	const byProvider = new Map<string, ChatModel[]>();
	for (const m of catalog) {
		const slug = providerSlug(m.id);
		const list = byProvider.get(slug) ?? [];
		list.push(m);
		byProvider.set(slug, list);
	}
	const slugs = [...byProvider.keys()].sort((a, b) => {
		const d = providerRank(a) - providerRank(b);
		return d !== 0 ? d : a.localeCompare(b);
	});
	return slugs.map((slug) => ({
		label: providerLabel(slug),
		models: [...(byProvider.get(slug) ?? [])].sort((a, b) => a.name.localeCompare(b.name))
	}));
}

export function flattenProviderGroups(groups: readonly ModelProviderGroup[]): ChatModel[] {
	const out: ChatModel[] = [];
	const seen = new Set<string>();
	for (const g of groups) {
		for (const m of g.models) {
			if (seen.has(m.id)) continue;
			seen.add(m.id);
			out.push(m);
		}
	}
	return out;
}
