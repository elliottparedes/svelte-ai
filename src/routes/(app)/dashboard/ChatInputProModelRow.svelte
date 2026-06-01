<script lang="ts">
	import ChatModelSelector from './ChatModelSelector.svelte';
	import ChatThreadCostBadge from './ChatThreadCostBadge.svelte';
	import type { ChatMessage, Model, ModelProviderGroup } from '$lib/types/dashboard';

	let {
		models,
		modelGroups,
		selectedModelId = $bindable(''),
		favoriteModelIds = [],
		onToggleFavorite,
		disabled = false,
		messages = [],
		streamingTurnCostUsd = 0,
		isStreaming = false
	} = $props<{
		models: Model[];
		modelGroups: ModelProviderGroup[];
		selectedModelId?: string;
		favoriteModelIds?: string[];
		onToggleFavorite?: (modelId: string) => void;
		disabled?: boolean;
		messages?: ChatMessage[];
		streamingTurnCostUsd?: number;
		isStreaming?: boolean;
	}>();
</script>

<div class="pro-model-row">
	<div class="model-left">
		<span class="pro-badge">Pro</span>
		<span class="label">Model</span>
		<ChatModelSelector
			{models}
			{modelGroups}
			bind:selectedModelId
			{favoriteModelIds}
			{onToggleFavorite}
			{disabled}
		/>
	</div>
	<ChatThreadCostBadge {messages} {streamingTurnCostUsd} {isStreaming} />
</div>

<style>
	.pro-model-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: nowrap;
		margin-bottom: 0.65rem;
		padding-bottom: 0.65rem;
		border-bottom: 1px solid #313244;
	}
	.model-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		min-width: 0;
	}
	.model-left :global(.picker) {
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
		flex-shrink: 0;
	}
	.label {
		font-size: 0.8rem;
		color: #a6adc8;
		font-weight: 600;
		flex-shrink: 0;
	}
</style>
