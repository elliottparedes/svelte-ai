import type { ChatModel } from '../domain/ChatProvider.interface';
import { logger } from '../logger';
import { OPTIONAL_DASHBOARD_MODELS } from '$lib/shared/optionalDashboardModels';
import type { CuratedModelGroup } from './curatedDashboardModels';

export function mergeOptionalDashboardModels(
	core: { models: ChatModel[]; groups: CuratedModelGroup[] },
	enabledAltIds: readonly string[],
	catalog: readonly ChatModel[]
): { models: ChatModel[]; groups: CuratedModelGroup[] } {
	const byId = new Map(catalog.map((m) => [m.id, m]));
	const seen = new Set(core.models.map((m) => m.id));
	const byGroup = new Map<string, ChatModel[]>();

	for (const def of OPTIONAL_DASHBOARD_MODELS) {
		if (!enabledAltIds.includes(def.id)) continue;
		const m = byId.get(def.id);
		if (!m) {
			logger.warn('Optional dashboard model missing from OpenRouter catalog', { modelId: def.id });
			continue;
		}
		if (seen.has(m.id)) continue;
		seen.add(m.id);
		const list = byGroup.get(def.group) ?? [];
		list.push(m);
		byGroup.set(def.group, list);
	}

	const groups: CuratedModelGroup[] = core.groups.map((g) => ({
		label: g.label,
		models: [...g.models]
	}));
	for (const [label, models] of byGroup) {
		const g = groups.find((x) => x.label === label);
		if (g) {
			for (const m of models) {
				if (!g.models.some((x) => x.id === m.id)) g.models.push(m);
			}
		} else groups.push({ label, models: [...models] });
	}

	const flat = [...core.models];
	for (const models of byGroup.values()) {
		for (const m of models) {
			if (!flat.some((x) => x.id === m.id)) flat.push(m);
		}
	}
	return { models: flat, groups };
}
