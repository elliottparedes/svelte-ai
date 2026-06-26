<script lang="ts">
	import type { ChatMessage, Model } from '$lib/types/dashboard';
	import ChatMessageList from './ChatMessageList.svelte';

	let { messages, isStreaming, isCompacting = false, errorMessage, routedModelId = '', models = [] } = $props<{
		messages: ChatMessage[];
		isStreaming: boolean;
		isCompacting?: boolean;
		errorMessage: string;
		routedModelId?: string;
		models?: Model[];
	}>();
</script>

<ChatMessageList {messages} {isStreaming} {isCompacting} {errorMessage} {routedModelId} {models} />
