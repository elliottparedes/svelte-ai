import type { Model, ModelProviderGroup } from '$lib/types/dashboard';

export function filterModelPickerGroups(
	groups: readonly ModelProviderGroup[],
	query: string
): ModelProviderGroup[] {
	const q = query.trim().toLowerCase();
	if (!q) return groups.map((g) => ({ label: g.label, models: [...g.models] }));

	const out: ModelProviderGroup[] = [];
	for (const g of groups) {
		const labelHit = g.label.toLowerCase().includes(q);
		const models = g.models.filter(
			(m) =>
				labelHit ||
				m.name.toLowerCase().includes(q) ||
				m.id.toLowerCase().includes(q)
		);
		if (models.length > 0) out.push({ label: g.label, models });
	}
	return out;
}

export function selectedModelLabel(
	models: readonly Model[],
	groups: readonly ModelProviderGroup[],
	selectedId: string
): string {
	if (!selectedId) return 'Select model';
	const fromFlat = models.find((m) => m.id === selectedId);
	if (fromFlat) return fromFlat.name;
	for (const g of groups) {
		const m = g.models.find((x) => x.id === selectedId);
		if (m) return m.name;
	}
	const slash = selectedId.lastIndexOf('/');
	return slash >= 0 ? selectedId.slice(slash + 1) : selectedId;
}
