import type { Model, ModelProviderGroup } from '$lib/types/dashboard';

const FAVORITES_LABEL = 'Favorites';

function flattenGroups(groups: readonly ModelProviderGroup[]): Model[] {
	const out: Model[] = [];
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

export function applyFavoriteModelOrder(
	modelGroups: readonly ModelProviderGroup[],
	flatModels: readonly Model[],
	favoriteIds: readonly string[]
): { models: Model[]; modelGroups: ModelProviderGroup[] } {
	const byId = new Map<string, Model>();
	for (const m of flatModels) byId.set(m.id, m);

	const favoriteSet = new Set(favoriteIds);
	const favoriteModels: Model[] = [];
	for (const id of favoriteIds) {
		const m = byId.get(id);
		if (m) favoriteModels.push(m);
	}

	const baseGroups =
		modelGroups.length > 0 ? modelGroups : [{ label: 'Models', models: [...flatModels] }];

	const stripped: ModelProviderGroup[] = [];
	for (const g of baseGroups) {
		const models = g.models.filter((m) => !favoriteSet.has(m.id));
		if (models.length > 0) stripped.push({ label: g.label, models });
	}

	const modelGroupsOut: ModelProviderGroup[] =
		favoriteModels.length > 0
			? [{ label: FAVORITES_LABEL, models: favoriteModels }, ...stripped]
			: stripped;

	return {
		models: flattenGroups(modelGroupsOut),
		modelGroups: modelGroupsOut
	};
}
