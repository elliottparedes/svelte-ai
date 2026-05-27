<script lang="ts">
	import ChatMessageRow from './ChatMessageRow.svelte';
	import ChatMessageListExtras from './ChatMessageListExtras.svelte';
	import type { ChatMessage, Model } from '$lib/types/dashboard';
	import { hydrateGenerateImageMessages } from '$lib/client/hydrateGenerateImageMessages';
	import { useChatMessageScroll } from './useChatMessageScroll.svelte';

	let { messages, isStreaming, isCompacting = false, errorMessage, routedModelId = '', models = [] } = $props<{
		messages: ChatMessage[];
		isStreaming: boolean;
		isCompacting?: boolean;
		errorMessage: string;
		routedModelId?: string;
		models?: Model[];
	}>();

	function resolveModelLabel(modelId: string): string {
		if (!modelId) return '';
		const found = models.find((m: Model) => m.id === modelId);
		if (found) return found.name;
		const slash = modelId.lastIndexOf('/');
		return slash >= 0 ? modelId.slice(slash + 1) : modelId;
	}

	const lastAssistantId = $derived.by(() => {
		for (let i = displayMessages.length - 1; i >= 0; i--) {
			if (displayMessages[i].role === 'assistant') return displayMessages[i].id;
		}
		return null;
	});

	const displayMessages = $derived(hydrateGenerateImageMessages(messages));

	const scrollKey = $derived.by(() => {
		const last = displayMessages.at(-1);
		return [
			displayMessages.length,
			last?.content.length ?? 0,
			last?.reasoningContent?.length ?? 0,
			isStreaming ? 1 : 0
		].join(':');
	});

	const conversationKey = $derived(displayMessages[0]?.id);

	const scroll = useChatMessageScroll(
		() => scrollKey,
		() => conversationKey
	);
</script>

<div class="chat-messages-pane">
	{#if !scroll.stickToBottom}
		<button
			type="button"
			class="jump-bottom"
			onclick={scroll.jumpToBottom}
			aria-label="Scroll to latest messages"
		>
			↓ Latest
		</button>
	{/if}
	<div
		class="chat-scroll"
		role="log"
		aria-label="Messages"
		bind:this={scroll.scrollEl}
		tabindex="-1"
	>
		<div class="messages-wrapper" bind:this={scroll.listEl}>
			{#each displayMessages as msg (msg.id)}
				<ChatMessageRow
					{msg}
					messages={displayMessages}
					{isStreaming}
					modelLabel={msg.id === lastAssistantId ? resolveModelLabel(routedModelId) : ''}
				/>
			{/each}
			<ChatMessageListExtras messages={displayMessages} {isStreaming} {isCompacting} {errorMessage} />
		</div>
	</div>
</div>

<style>
	.chat-messages-pane {
		flex: 1;
		min-height: 0;
		position: relative;
		display: flex;
		flex-direction: column;
	}
	.jump-bottom {
		position: absolute;
		left: 50%;
		bottom: 1rem;
		transform: translateX(-50%);
		z-index: 2;
		padding: 0.4rem 0.85rem;
		border-radius: 999px;
		border: 1px solid #45475a;
		background: #313244;
		color: #cdd6f4;
		font-size: 0.85rem;
		cursor: pointer;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
	}
	.jump-bottom:hover {
		background: #45475a;
	}
	.chat-scroll {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		background: #181825;
		padding: 1rem 1rem 2.5rem;
		scrollbar-width: thin;
		scrollbar-color: #45475a transparent;
	}
	.chat-scroll::-webkit-scrollbar {
		width: 5px;
	}
	.chat-scroll::-webkit-scrollbar-track {
		background: transparent;
	}
	.chat-scroll::-webkit-scrollbar-thumb {
		background: #45475a;
		border-radius: 3px;
	}
	.messages-wrapper {
		max-width: 850px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}
</style>
