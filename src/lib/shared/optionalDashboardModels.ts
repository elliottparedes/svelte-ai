export type AltModelTier = 'must' | 'nice';

export type OptionalDashboardModelDef = {
	readonly id: string;
	readonly title: string;
	readonly description: string;
	readonly tier: AltModelTier;
	readonly group: string;
};

/** Extra models users enable on Profile → appear in dashboard picker. */
export const OPTIONAL_DASHBOARD_MODELS: readonly OptionalDashboardModelDef[] = [
	{
		id: 'google/gemini-2.5-flash-lite',
		title: 'Gemini 2.5 Flash Lite',
		description: 'Fast, cheap, vision + tools · 1M context',
		tier: 'must',
		group: 'Google'
	},
	{
		id: 'google/gemini-2.0-flash-001',
		title: 'Gemini 2.0 Flash',
		description: 'Vision-native · matches relay model',
		tier: 'must',
		group: 'Google'
	},
	{
		id: 'openai/gpt-5-nano',
		title: 'GPT-5 Nano',
		description: 'Lowest-cost OpenAI · strong tools',
		tier: 'must',
		group: 'OpenAI'
	},
	{
		id: 'openai/gpt-4o-mini',
		title: 'GPT-4o mini',
		description: 'Reliable tool loops · production staple',
		tier: 'must',
		group: 'OpenAI'
	},
	{
		id: 'z-ai/glm-4.7-flash',
		title: 'GLM 4.7 Flash',
		description: 'Ultra-cheap flash tier',
		tier: 'must',
		group: 'Z.AI'
	},
	{
		id: 'x-ai/grok-4.20',
		title: 'Grok 4 Fast',
		description: 'xAI Grok 4.20 on OpenRouter · tools + vision',
		tier: 'must',
		group: 'xAI'
	},
	{
		id: 'deepseek/deepseek-v3.2',
		title: 'DeepSeek V3.2',
		description: 'Smarter than V4 Flash · still affordable',
		tier: 'nice',
		group: 'DeepSeek'
	},
	{
		id: 'mistralai/codestral-2508',
		title: 'Codestral 2508',
		description: 'Code & config focused',
		tier: 'nice',
		group: 'Mistral'
	},
	{
		id: 'openai/gpt-oss-120b',
		title: 'GPT OSS 120B',
		description: 'Open weights · very low $/token',
		tier: 'nice',
		group: 'OpenAI'
	},
	{
		id: 'google/gemma-4-31b-it',
		title: 'Gemma 4 31B',
		description: 'Open Gemma · 262k context',
		tier: 'nice',
		group: 'Google'
	}
] as const;

const ALLOWED = new Set(OPTIONAL_DASHBOARD_MODELS.map((m) => m.id));

/** Retired OpenRouter ids still stored on user rows → current catalog id. */
const ALT_MODEL_ID_ALIASES: Record<string, string> = {
	'x-ai/grok-4-fast': 'x-ai/grok-4.20'
};

export function resolveAltModelCatalogId(id: string): string {
	return ALT_MODEL_ID_ALIASES[id] ?? id;
}

export function defaultEnabledAltModelIds(): string[] {
	return OPTIONAL_DASHBOARD_MODELS.filter((m) => m.tier === 'must').map((m) => m.id);
}

export function normalizeAltModelIds(ids: readonly string[]): string[] {
	const out: string[] = [];
	for (const raw of ids) {
		const id = resolveAltModelCatalogId(raw);
		if (!ALLOWED.has(id) || out.includes(id)) continue;
		out.push(id);
	}
	return out;
}

export function parseStoredAltModelIds(raw: string | null | undefined): string[] | null {
	if (!raw?.trim()) return null;
	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) return null;
		return normalizeAltModelIds(parsed.filter((x): x is string => typeof x === 'string'));
	} catch {
		return null;
	}
}

export function resolveUserAltModelIds(stored: string | null | undefined): string[] {
	return parseStoredAltModelIds(stored) ?? defaultEnabledAltModelIds();
}
