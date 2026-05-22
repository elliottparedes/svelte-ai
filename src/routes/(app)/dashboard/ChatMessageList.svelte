<script lang="ts">
	import { tick } from 'svelte';
	import ChatMessageRow from './ChatMessageRow.svelte';
	import ChatMessageListExtras from './ChatMessageListExtras.svelte';
	import type { ChatMessage } from '$lib/types/dashboard';
	import { hydrateGenerateImageMessages } from '$lib/client/hydrateGenerateImageMessages';

	let { messages, isStreaming, errorMessage } = $props<{
		messages: ChatMessage[];
		isStreaming: boolean;
		errorMessage: string;
	}>();

	const displayMessages = $derived(hydrateGenerateImageMessages(messages));

	let scrollContainer: HTMLDivElement | null = $state(null);
	let messagesWrapper: HTMLDivElement | null = $state(null);
	let userScrolledUp = $state(false);

	const threadAnchorId = $derived(displayMessages[0]?.id ?? '');

	const scrollTrackKey = $derived.by(() => {
		const last = displayMessages.at(-1);
		return [
			displayMessages.length,
			last?.content.length ?? 0,
			last?.reasoningContent?.length ?? 0,
			isStreaming ? 1 : 0
		].join(':');
	});

	function handleScroll() {
		if (!scrollContainer) return;
		const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
		userScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
	}

	function scrollToBottom() {
		if (scrollContainer) {
			scrollContainer.scrollTop = scrollContainer.scrollHeight;
			userScrolledUp = false;
		}
	}

	async function scrollToBottomIfPinned() {
		await tick();
		if (!scrollContainer || userScrolledUp) return;
		scrollContainer.scrollTop = scrollContainer.scrollHeight;
	}

	$effect(() => {
		threadAnchorId;
		userScrolledUp = false;
	});

	$effect(() => {
		scrollTrackKey;
		if (displayMessages.length && scrollContainer) {
			void scrollToBottomIfPinned();
		}
	});

	$effect(() => {
		const el = messagesWrapper;
		if (!el) return;
		const ro = new ResizeObserver(() => {
			if (!userScrolledUp && scrollContainer) {
				scrollContainer.scrollTop = scrollContainer.scrollHeight;
			}
		});
		ro.observe(el);
		return () => ro.disconnect();
	});
</script>

<div class="chat-scroll" bind:this={scrollContainer} onscroll={handleScroll}>
	<div class="messages-wrapper" bind:this={messagesWrapper}>
		{#each displayMessages as msg (msg.id)}
			<ChatMessageRow {msg} messages={displayMessages} {isStreaming} />
		{/each}
		<ChatMessageListExtras messages={displayMessages} {isStreaming} {errorMessage} />
	</div>
</div>

{#if userScrolledUp}
	<button class="scroll-to-bottom" onclick={scrollToBottom} title="Scroll to bottom">
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<polyline points="6 9 12 15 18 9"></polyline>
		</svg>
	</button>
{/if}

<style>
	.chat-scroll {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		background: #181825;
		padding: 1rem 1rem 6rem;
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
	.scroll-to-bottom {
		position: fixed;
		bottom: 140px;
		right: 2rem;
		background: #313244;
		border: 1px solid #45475a;
		border-radius: 50%;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: #cdd6f4;
		z-index: 10;
		transition: background 0.15s;
	}
	.scroll-to-bottom:hover {
		background: #45475a;
	}
</style>
