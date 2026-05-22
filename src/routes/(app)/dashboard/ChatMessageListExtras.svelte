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
		if (last.role === 'assistant') {
			if (last.content.trim().length > 0) return false;
			if ((last.reasoningContent?.trim().length ?? 0) > 0) return false;
		}
		return true;
	});
</script>

{#if showTypingIndicator}
	<div class="assistant-row typing-wrap">
		<SidebarChatLoadingDots size="chat" />
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
