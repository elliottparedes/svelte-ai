<script lang="ts">
	import ToolCallCollapsible from './ToolCallCollapsible.svelte';
	import type { ChatMessage } from '$lib/types/dashboard';

	let { msg } = $props<{ msg: ChatMessage }>();
</script>

<div class="tool-row">
	{#if msg.toolCall}
		<div class="tool-inline">
			<ToolCallCollapsible
				name={msg.toolCall.name}
				args={msg.toolCall.arguments}
				result={msg.toolCall.result}
			/>
		</div>
	{:else}
		<div class="tool-bubble-legacy">{msg.content}</div>
	{/if}
</div>

<style>
	.tool-row {
		display: flex;
		justify-content: flex-start;
		width: 100%;
		animation: messageIn 0.25s ease-out;
	}
	.tool-inline {
		flex: 0 0 auto;
		max-width: 100%;
	}
	.tool-bubble-legacy {
		background: #1e1e2e;
		border: 1px solid #313244;
		border-radius: 12px;
		padding: 0.4rem 0.9rem;
		color: #a6adc8;
		font-size: 0.85rem;
		font-family: 'Fira Code', 'Consolas', monospace;
	}
	@keyframes messageIn {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
