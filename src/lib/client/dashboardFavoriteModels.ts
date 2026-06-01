export const DASHBOARD_FAVORITE_MODELS_KEY = 'dashboardFavoriteModelIds';

const MAX_FAVORITES = 30;

function storage(): Storage | null {
	if (typeof localStorage === 'undefined') return null;
	return localStorage;
}

export function loadFavoriteModelIds(): string[] {
	const raw = storage()?.getItem(DASHBOARD_FAVORITE_MODELS_KEY);
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0);
	} catch {
		return [];
	}
}

export function saveFavoriteModelIds(ids: readonly string[]): void {
	storage()?.setItem(DASHBOARD_FAVORITE_MODELS_KEY, JSON.stringify([...ids]));
}

export function toggleFavoriteModelId(id: string): string[] {
	const trimmed = id.trim();
	if (!trimmed) return loadFavoriteModelIds();
	const current = loadFavoriteModelIds();
	const i = current.indexOf(trimmed);
	const next =
		i >= 0 ? [...current.slice(0, i), ...current.slice(i + 1)] : [...current, trimmed].slice(-MAX_FAVORITES);
	saveFavoriteModelIds(next);
	return next;
}

export function pruneFavoriteModelIds(
	stored: readonly string[],
	availableIds: ReadonlySet<string>
): string[] {
	const pruned = stored.filter((id) => availableIds.has(id));
	if (pruned.length !== stored.length) saveFavoriteModelIds(pruned);
	return pruned;
}

export function pickFirstAvailableFavoriteModelId(
	favoriteIds: readonly string[],
	availableIds: ReadonlySet<string>
): string | null {
	for (const id of favoriteIds) {
		if (availableIds.has(id)) return id;
	}
	return null;
}
