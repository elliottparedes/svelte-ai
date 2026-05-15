import type { ChatModel } from '../domain/ChatProvider.interface';

type GroupDef = { readonly label: string; readonly ids: readonly string[] };

/** Dashboard picker: curated OpenRouter ids, grouped by provider. */
export const CURATED_DASHBOARD_MODEL_GROUPS: readonly GroupDef[] = [
	{
		label: 'Anthropic',
		ids: ['anthropic/claude-opus-4', 'anthropic/claude-sonnet-4', 'anthropic/claude-3.5-haiku']
	},
	{
		label: 'OpenAI',
		ids: ['openai/gpt-4.1', 'openai/o3', 'openai/gpt-4o-mini', 'openai/gpt-4.1-mini']
	},
	{
		label: 'Google',
		ids: [
			'google/gemini-2.5-pro-preview',
			'google/gemini-2.5-flash',
			'google/gemini-2.5-flash-lite',
			'google/gemini-2.0-flash-001'
		]
	},
	{ label: 'xAI', ids: ['x-ai/grok-4.3'] },
	{ label: 'DeepSeek', ids: ['deepseek/deepseek-r1-0528', 'deepseek/deepseek-chat'] },
	{
		label: 'Qwen',
		ids: ['qwen/qwen3.5-flash-02-23', 'qwen/qwen3.5-397b-a17b', 'qwen/qwen3-max']
	}
];

export type CuratedModelGroup = { label: string; models: ChatModel[] };

export function pickCuratedDashboardModels(catalog: readonly ChatModel[]): {
	models: ChatModel[];
	groups: CuratedModelGroup[];
} {
	const byId = new Map(catalog.map((m) => [m.id, m]));
	const seen = new Set<string>();
	const flat: ChatModel[] = [];
	const groups: CuratedModelGroup[] = [];
	for (const g of CURATED_DASHBOARD_MODEL_GROUPS) {
		const models: ChatModel[] = [];
		for (const id of g.ids) {
			if (seen.has(id)) continue;
			const m = byId.get(id);
			if (!m) continue;
			seen.add(id);
			models.push(m);
			flat.push(m);
		}
		if (models.length > 0) groups.push({ label: g.label, models });
	}
	return { models: flat, groups };
}
