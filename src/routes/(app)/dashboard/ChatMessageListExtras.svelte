<script lang="ts">
	import SidebarChatLoadingDots from './SidebarChatLoadingDots.svelte';
	import type { ChatMessage } from '$lib/types/dashboard';

	let { messages, isStreaming, errorMessage } = $props<{
		messages: ChatMessage[];
		isStreaming: boolean;
		errorMessage: string;
	}>();

	const showTypingIndicator = $derived.by(() => {
		if (!isStreaming) return false;
		const last = messages.at(-1);
		if (!last) return true;
		if (last.role === 'tool') return true;
		if (last.role === 'assistant' && last.content.trim().length > 0) return false;
		return true;
	});
</script>

{#if showTypingIndicator}
	<div class="assistant-row typing-wrap">
		<div class="typing-bubble">
			<SidebarChatLoadingDots />
		</div>
	</div>
{/if}

{#if errorMessage}
	<div class="assistant-row error-wrap">
		<div class="error-bubble">{errorMessage}</div>
	</div>
{/if}

<style>
	.assistant-row {
		width: 100%;
		color: #cdd6f4;
		animation: messageIn 0.25s ease-out;
	}
	.typing-wrap,
	.error-wrap {
		font-size: 0.95rem;
		line-height: 1.6;
	}
	.typing-bubble {
		display: inline-flex;
		align-items: center;
		padding: 0.65rem 0.9rem;
		background: #45475a;
		border-radius: 1rem;
	}
	.typing-bubble :global(.loading-dots) {
		margin-left: 0;
		gap: 5px;
	}
	.typing-bubble :global(.loading-dots span) {
		width: 6px;
		height: 6px;
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
	.error-bubble {
		background: #1e1e2e;
		border: 1px solid #f38ba8;
		color: #f38ba8;
		padding: 0.6rem 1rem;
		border-radius: 1rem;
		font-size: 0.9rem;
		display: inline-block;
	}
</style>
