import type { ChatModel } from '../domain/ChatProvider.interface';

type GroupDef = { readonly label: string; readonly ids: readonly string[] };

/** Dashboard picker: best value picks — one clear role each, minimal overlap. */
export const CURATED_DASHBOARD_MODEL_GROUPS: readonly GroupDef[] = [
	{ label: 'Qwen', ids: ['qwen/qwen3.5-flash-02-23', 'qwen/qwen3-max'] },
	{ label: 'Meta', ids: ['meta-llama/llama-4-scout'] },
	{ label: 'DeepSeek', ids: ['deepseek/deepseek-v4-flash', 'deepseek/deepseek-r1-0528'] },
	{ label: 'MoonshotAI', ids: ['moonshotai/kimi-k2.5'] }
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
