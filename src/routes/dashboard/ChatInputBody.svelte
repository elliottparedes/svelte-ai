<script lang="ts">
	import AttachmentPill from './AttachmentPill.svelte';
	import type { ChatAttachmentInput } from '$lib/types/dashboard';

	let {
		value = $bindable(''),
		attachments = $bindable<ChatAttachmentInput[]>([]),
		attachError,
		isStreaming,
		showAttachButton,
		onKeyDown,
		onPaste
	} = $props<{
		value?: string;
		attachments: ChatAttachmentInput[];
		attachError: string;
		isStreaming: boolean;
		showAttachButton: boolean;
		onKeyDown: (e: KeyboardEvent) => void;
		onPaste: (e: ClipboardEvent) => void;
	}>();

	function removeAttachment(index: number) {
		attachments = attachments.filter((_a: ChatAttachmentInput, i: number) => i !== index);
	}
</script>

{#if attachments.length > 0}
	<div class="attachment-row">
		{#each attachments as att, i (att.name + i)}
			<AttachmentPill name={att.name} type={att.type} dataUrl={att.dataUrl} onRemove={() => removeAttachment(i)} />
		{/each}
	</div>
{/if}
{#if attachError}
	<p class="attach-err">{attachError}</p>
{/if}
<textarea
	class="chat-textarea"
	placeholder={showAttachButton ? 'Ask the model or paste a file' : 'Ask the model'}
	bind:value
	onkeydown={onKeyDown}
	onpaste={onPaste}
	rows={1}
	disabled={isStreaming}
></textarea>

<style>
	.attachment-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-bottom: 0.5rem;
	}
	.attach-err {
		margin: 0 0 0.5rem;
		font-size: 0.85rem;
		color: #f38ba8;
	}
	.chat-textarea {
		width: 100%;
		background: transparent;
		border: none;
		color: #cdd6f4;
		font-size: 1rem;
		resize: none;
		outline: none;
		min-height: 2rem;
		max-height: 200px;
		font-family: inherit;
		scrollbar-width: thin;
		scrollbar-color: #45475a transparent;
	}
	.chat-textarea::-webkit-scrollbar {
		width: 5px;
	}
	.chat-textarea::-webkit-scrollbar-track {
		background: transparent;
	}
	.chat-textarea::-webkit-scrollbar-thumb {
		background: #45475a;
		border-radius: 3px;
	}
	.chat-textarea::-webkit-scrollbar-thumb:hover {
		background: #585b70;
	}
	.chat-textarea::placeholder {
		color: #6c7086;
	}
</style>
