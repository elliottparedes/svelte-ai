<script lang="ts">
	import type { ChatMessage } from '$lib/types/dashboard';
	import { sumAssistantCostUsd } from '$lib/client/chatThreadCost.util';
	import ChatThreadCostBadge from './ChatThreadCostBadge.svelte';

	let {
		messages = [],
		streamingTurnCostUsd = 0,
		isStreaming = false
	} = $props<{
		messages?: ChatMessage[];
		streamingTurnCostUsd?: number;
		isStreaming?: boolean;
	}>();

	const show = $derived(
		sumAssistantCostUsd(messages) + (isStreaming ? streamingTurnCostUsd : 0) > 0
	);
</script>

{#if show}
	<div class="cost-header-row">
		<ChatThreadCostBadge {messages} {streamingTurnCostUsd} {isStreaming} />
	</div>
{/if}

<style>
	.cost-header-row {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		margin-bottom: 0.65rem;
		padding-bottom: 0.65rem;
		border-bottom: 1px solid #313244;
	}
</style>
