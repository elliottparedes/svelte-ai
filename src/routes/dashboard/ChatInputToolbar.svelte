<script lang="ts">
	import ChatInputModelSend from './ChatInputModelSend.svelte';
	import ChatContextMeter from './ChatContextMeter.svelte';
	import type { ChatAttachmentInput, ChatMessage, Model, ModelProviderGroup } from '$lib/types/dashboard';

	let {
		models,
		modelGroups,
		selectedModel = $bindable(''),
		modelLocked = false,
		value,
		attachmentsLen,
		isStreaming,
		showAttachButton,
		isUploading,
		onAttachClick,
		onSend,
		messages = [],
		attachments = [],
		extraSystemTokens = 0
	} = $props<{
		models: Model[];
		modelGroups: ModelProviderGroup[];
		selectedModel?: string;
		modelLocked?: boolean;
		value: string;
		attachmentsLen: number;
		isStreaming: boolean;
		showAttachButton: boolean;
		isUploading: boolean;
		onAttachClick: () => void;
		onSend: () => void;
		messages?: ChatMessage[];
		attachments?: ChatAttachmentInput[];
		extraSystemTokens?: number;
	}>();
</script>

<ChatContextMeter
	{messages}
	draftText={value}
	{attachments}
	{models}
	selectedModel={selectedModel ?? ''}
	{extraSystemTokens}
/>
<div class="input-footer">
	<div class="footer-left">
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
	</div>
	<ChatInputModelSend {models} {modelGroups} bind:selectedModel {modelLocked} {value} {attachmentsLen} {isStreaming} {onSend} />
</div>

<style>
	.input-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 0.5rem;
	}
	.footer-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
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
