<script lang="ts">
	import ChatUserBlock from './ChatUserBlock.svelte';
	import ChatToolBlock from './ChatToolBlock.svelte';
	import ChatAssistantTurnRow from './ChatAssistantTurnRow.svelte';
	import type { ChatMessage } from '$lib/types/dashboard';
	import { parseMessageAttachments } from '$lib/client/chatMessageList.utils';

	let {
		msg,
		toolMessages = [],
		isStreaming,
		modelLabel = ''
	} = $props<{
		msg: ChatMessage;
		toolMessages?: ChatMessage[];
		isStreaming: boolean;
		modelLabel?: string;
	}>();

	const parsed = $derived(parseMessageAttachments(msg.content));
</script>

{#if msg.role === 'user'}
	<ChatUserBlock msg={msg} imageNames={parsed.imageNames} fileNames={parsed.fileNames} text={parsed.text} />
{:else if msg.role === 'tool'}
	<ChatToolBlock {msg} />
{:else}
	<ChatAssistantTurnRow
		{msg}
		{toolMessages}
		showCopy={!isStreaming}
		streaming={isStreaming}
		{modelLabel}
	/>
{/if}
