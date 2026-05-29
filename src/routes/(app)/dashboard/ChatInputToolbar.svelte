<script lang="ts">
	import ChatContextMeter from './ChatContextMeter.svelte';
	import ChatToolSelector from './ChatToolSelector.svelte';
	import ChatMicButton from './ChatMicButton.svelte';
	import ChatDeepThinkButton from './ChatDeepThinkButton.svelte';
	import ChatModelSelector from './ChatModelSelector.svelte';
	import ChatQuotaBadge from './ChatQuotaBadge.svelte';
	import type { ChatAttachmentInput, ChatMessage, Model, ModelProviderGroup } from '$lib/types/dashboard';
	import type { ChatQuotaView } from '$lib/types/dashboard';
	import {
		DEFAULT_CHAT_TOOL_IDS,
		type ChatToolId
	} from '$lib/shared/chatToolSystemPrompt';

	let {
		models,
		modelGroups = [],
		selectedModelId = $bindable(''),
		usesAutoRouting = true,
		chatQuota,
		routedModelId = '',
		deepReasoningEnabled = $bindable(false),
		isStreaming,
		showAttachButton,
		isUploading,
		onAttachClick,
		messages = [],
		attachments = [],
		summaryThroughMessageId = null,
		modelSupportsTools = true,
		enabledToolIds = $bindable<ChatToolId[]>([...DEFAULT_CHAT_TOOL_IDS]),
		onAppendDictation
	} = $props<{
		models: Model[];
		modelGroups?: ModelProviderGroup[];
		selectedModelId?: string;
		usesAutoRouting?: boolean;
		chatQuota?: ChatQuotaView;
		routedModelId?: string;
		deepReasoningEnabled?: boolean;
		isStreaming: boolean;
		showAttachButton: boolean;
		isUploading: boolean;
		onAttachClick: () => void;
		messages?: ChatMessage[];
		attachments?: ChatAttachmentInput[];
		summaryThroughMessageId?: string | null;
		modelSupportsTools?: boolean;
		enabledToolIds?: ChatToolId[];
		onAppendDictation?: (text: string) => void;
	}>();
</script>

<div class="input-footer">
	<div class="footer-left">
		{#if chatQuota}
			<ChatQuotaBadge quota={chatQuota} />
		{/if}
		{#if !usesAutoRouting}
			<ChatModelSelector {models} {modelGroups} bind:selectedModelId disabled={isStreaming} />
		{/if}
		<ChatContextMeter {messages} {summaryThroughMessageId} />
		{#if showAttachButton}
			<button
				type="button"
				class="icon-btn"
				title="Attach file or image"
				onclick={onAttachClick}
				disabled={isUploading}
			>
				<span>＋</span>
			</button>
		{/if}
		{#if modelSupportsTools}
			<ChatToolSelector bind:enabledIds={enabledToolIds} disabled={isStreaming} />
		{/if}
		{#if usesAutoRouting}
			<ChatDeepThinkButton bind:enabled={deepReasoningEnabled} disabled={isStreaming} />
		{/if}
		<div class="mic-toolbar">
			<ChatMicButton disabled={isStreaming} onAppend={(t) => onAppendDictation?.(t)} />
		</div>
	</div>
</div>

<style>
	.input-footer {
		display: flex;
		align-items: center;
		margin-top: 0.5rem;
	}
	.footer-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.icon-btn {
		background: none;
		border: none;
		color: #a6adc8;
		font-size: 1.25rem;
		cursor: pointer;
		padding: 0.25rem;
		line-height: 1;
	}
	.icon-btn:hover:not(:disabled) {
		color: #cdd6f4;
	}
</style>
