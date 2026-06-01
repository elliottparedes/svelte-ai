<script lang="ts">
	import type { ChatMessage } from '$lib/types/dashboard';
	import { formatThreadCostUsd, sumAssistantCostUsd } from '$lib/client/chatThreadCost.util';

	let {
		messages = [],
		streamingTurnCostUsd = 0,
		isStreaming = false
	} = $props<{
		messages?: ChatMessage[];
		streamingTurnCostUsd?: number;
		isStreaming?: boolean;
	}>();

	const persistedUsd = $derived(sumAssistantCostUsd(messages));
	const threadTotalUsd = $derived(
		persistedUsd + (isStreaming ? streamingTurnCostUsd : 0)
	);
	const label = $derived(formatThreadCostUsd(threadTotalUsd));
	const show = $derived(threadTotalUsd > 0);
</script>

{#if show}
	<span class="thread-cost" title="OpenRouter inference total for this chat (USD)">{label}</span>
{/if}

<style>
	.thread-cost {
		font-size: 0.75rem;
		color: #6c7086;
		white-space: nowrap;
		user-select: none;
	}
</style>
