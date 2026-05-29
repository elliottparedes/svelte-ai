<script lang="ts">
	import type { Model, ModelProviderGroup } from '$lib/types/dashboard';

	let {
		models,
		modelGroups,
		selectedModelId = $bindable(''),
		disabled = false
	} = $props<{
		models: Model[];
		modelGroups: ModelProviderGroup[];
		selectedModelId?: string;
		disabled?: boolean;
	}>();

	const grouped = $derived(
		modelGroups.length > 0
			? modelGroups
			: [{ label: 'Models', models }]
	);

	function onChange(e: Event) {
		selectedModelId = (e.currentTarget as HTMLSelectElement).value;
	}
</script>

<label class="model-select-wrap">
	<span class="sr-only">Model</span>
	<select
		class="model-select"
		value={selectedModelId}
		onchange={onChange}
		{disabled}
		title="OpenRouter model"
	>
		{#each grouped as group}
			<optgroup label={group.label}>
				{#each group.models as m}
					<option value={m.id}>{m.name}</option>
				{/each}
			</optgroup>
		{/each}
	</select>
</label>

<style>
	.model-select-wrap {
		display: inline-flex;
		align-items: center;
	}
	.model-select {
		max-width: 14rem;
		background: #252537;
		color: #cdd6f4;
		border: 1px solid #313244;
		border-radius: 6px;
		padding: 0.25rem 0.5rem;
		font-size: 0.8rem;
	}
	.model-select:disabled {
		opacity: 0.6;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		border: 0;
	}
</style>
