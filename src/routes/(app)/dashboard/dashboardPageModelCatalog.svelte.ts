import type { DashboardPageLoadData, Model, ModelProviderGroup } from '$lib/types/dashboard';
import { applyFavoriteModelOrder } from '$lib/client/applyFavoriteModelOrder';
import {
	loadFavoriteModelIds,
	pickFirstAvailableFavoriteModelId,
	pruneFavoriteModelIds,
	toggleFavoriteModelId as toggleStoredFavoriteModelId
} from '$lib/client/dashboardFavoriteModels';

export function createDashboardModelCatalogState(initial: DashboardPageLoadData) {
	let catalogModels = $state<Model[]>([...initial.models]);
	let catalogModelGroups = $state<ModelProviderGroup[]>([...initial.modelGroups]);
	let favoriteModelIds = $state<string[]>(loadFavoriteModelIds());
	let models = $state<Model[]>([...initial.models]);
	let modelGroups = $state<ModelProviderGroup[]>([...initial.modelGroups]);

	function reapplyFavoriteModelDisplay() {
		const availableIds = new Set(catalogModels.map((m) => m.id));
		favoriteModelIds = pruneFavoriteModelIds(favoriteModelIds, availableIds);
		const ordered = applyFavoriteModelOrder(catalogModelGroups, catalogModels, favoriteModelIds);
		models = ordered.models;
		modelGroups = ordered.modelGroups;
	}

	function setCatalogFromLoad(next: DashboardPageLoadData) {
		catalogModels = [...next.models];
		catalogModelGroups = [...next.modelGroups];
		reapplyFavoriteModelDisplay();
	}

	setCatalogFromLoad(initial);

	function toggleFavoriteModelId(id: string) {
		favoriteModelIds = toggleStoredFavoriteModelId(id);
		reapplyFavoriteModelDisplay();
	}

	return {
		getModels: () => models,
		getModelGroups: () => modelGroups,
		getFavoriteModelIds: () => favoriteModelIds,
		setCatalogFromLoad,
		toggleFavoriteModelId,
		resolveDefaultModelId(fallback: string) {
			const availableIds = new Set(catalogModels.map((m) => m.id));
			const favorite = pickFirstAvailableFavoriteModelId(favoriteModelIds, availableIds);
			if (favorite) return favorite;
			if (fallback && availableIds.has(fallback)) return fallback;
			return models[0]?.id ?? fallback;
		},
		hasModel(id: string) {
			return models.some((m) => m.id === id);
		}
	};
}

export type DashboardModelCatalogState = ReturnType<typeof createDashboardModelCatalogState>;
