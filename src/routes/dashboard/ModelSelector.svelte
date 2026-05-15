<script lang="ts">
	import type { Model, ModelProviderGroup } from '$lib/types/dashboard';

	let { modelGroups, selected = $bindable(''), onChange } = $props<{
		modelGroups: ModelProviderGroup[];
		selected?: string;
		onChange?: (id: string) => void;
	}>();

	let filter = $state('');

	const filteredGroups = $derived.by(() => {
		const q = filter.trim().toLowerCase();
		if (!q) return modelGroups;
		return modelGroups
			.map((g: ModelProviderGroup) => ({
				label: g.label,
				models: g.models.filter(
					(m: Model) =>
						m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)
				)
			}))
			.filter((g: ModelProviderGroup) => g.models.length > 0);
	});

	function handleSelect(id: string) {
		selected = id;
		onChange?.(id);
	}
</script>

<div class="model-picker">
	<input
		class="filter-input"
		type="search"
		placeholder="Filter models…"
		bind:value={filter}
		autocomplete="off"
	/>
	<div class="model-list">
		{#each filteredGroups as group (group.label)}
			<div class="provider-label">{group.label}</div>
			{#each group.models as model (model.id)}
				<button
					type="button"
					class="model-item"
					class:active={model.id === selected}
					title={model.supportsVision === false
						? 'No native vision — images are summarized first'
						: undefined}
					onclick={() => handleSelect(model.id)}
				>
					{model.name}
				</button>
			{/each}
		{:else}
			<div class="empty-hint">No models match.</div>
		{/each}
	</div>
</div>

<style>
	.model-picker {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		min-width: 0;
		width: 100%;
		color: #cdd6f4;
	}
	.filter-input {
		width: 100%;
		box-sizing: border-box;
		background: #181825;
		border: 1px solid #313244;
		border-radius: 8px;
		color: #cdd6f4;
		font-size: 0.8rem;
		padding: 0.35rem 0.5rem;
	}
	.filter-input::placeholder {
		color: #6c7086;
	}
	.model-list {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		max-height: min(50vh, 320px);
		overflow-y: auto;
		overflow-x: hidden;
		min-height: 0;
		scrollbar-width: thin;
		scrollbar-color: #45475a transparent;
	}
	.model-list::-webkit-scrollbar {
		width: 6px;
	}
	.model-list::-webkit-scrollbar-thumb {
		background: #45475a;
		border-radius: 4px;
	}
	.provider-label {
		font-size: 0.68rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #6c7086;
		padding: 0.35rem 0.5rem 0.15rem;
		margin-top: 0.15rem;
	}
	.provider-label:first-child {
		margin-top: 0;
		padding-top: 0.2rem;
	}
	.model-item {
		display: block;
		width: 100%;
		max-width: 100%;
		box-sizing: border-box;
		background: none;
		border: none;
		color: #cdd6f4;
		text-align: left;
		padding: 0.45rem 0.5rem 0.45rem 0.65rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
		line-height: 1.45;
		white-space: normal;
		overflow-wrap: anywhere;
		word-break: break-word;
	}
	.model-item:hover {
		background: #313244;
	}
	.model-item.active {
		background: #45475a;
	}
	.empty-hint {
		font-size: 0.8rem;
		color: #6c7086;
		padding: 0.5rem;
	}
</style>
