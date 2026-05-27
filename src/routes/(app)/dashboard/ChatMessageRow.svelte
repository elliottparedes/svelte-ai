<script lang="ts">
	import ChatUserBlock from './ChatUserBlock.svelte';
	import ChatToolBlock from './ChatToolBlock.svelte';
	import ChatAssistantBlock from './ChatAssistantBlock.svelte';
	import type { ChatMessage } from '$lib/types/dashboard';
	import { parseMessageAttachments } from '$lib/client/chatMessageList.utils';

	let {
		msg,
		messages,
		isStreaming,
		modelLabel = ''
	} = $props<{
		msg: ChatMessage;
		messages: ChatMessage[];
		isStreaming: boolean;
		modelLabel?: string;
	}>();

	const streamingThis = $derived(
		isStreaming && messages.length > 0 && messages[messages.length - 1].id === msg.id
	);

	const parsed = $derived(parseMessageAttachments(msg.content));
</script>

{#if msg.role === 'user'}
	<ChatUserBlock msg={msg} imageNames={parsed.imageNames} fileNames={parsed.fileNames} text={parsed.text} />
{:else if msg.role === 'tool'}
	<ChatToolBlock {msg} />
{:else}
	<ChatAssistantBlock {msg} showCopy={!streamingThis} streaming={streamingThis} {modelLabel} />
{/if}
