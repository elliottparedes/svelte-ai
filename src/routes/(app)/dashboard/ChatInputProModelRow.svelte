<script lang="ts">
	import ChatModelSelector from './ChatModelSelector.svelte';
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
</script>

<div class="pro-model-row">
	<span class="pro-badge">Pro</span>
	<span class="label">Model</span>
	<ChatModelSelector {models} {modelGroups} bind:selectedModelId {disabled} />
</div>

<style>
	.pro-model-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: nowrap;
		margin-bottom: 0.65rem;
		padding-bottom: 0.65rem;
		border-bottom: 1px solid #313244;
	}
	.pro-model-row :global(.picker) {
		flex: 1;
		min-width: 0;
	}
	.pro-badge {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #1e1e2e;
		background: #a6e3a1;
		padding: 0.15rem 0.4rem;
		border-radius: 4px;
	}
	.label {
		font-size: 0.8rem;
		color: #a6adc8;
		font-weight: 600;
	}
</style>
