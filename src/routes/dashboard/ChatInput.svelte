<script lang="ts">
	import ChatInputBody from './ChatInputBody.svelte';
	import ChatInputToolbar from './ChatInputToolbar.svelte';
	import type { ChatAttachmentInput, Model } from '$lib/types/dashboard';
	import {
		consumeClipboardForAttachments,
		chatAttachmentRejectMessage,
		chatFileAllowedForModel,
		chatInputFileAcceptAttr,
		uploadChatAttachment
	} from '$lib/client/chatInputAttachments';

	let {
		value = $bindable(''),
		isStreaming,
		modelLocked = false,
		onSend,
		models,
		selectedModel = $bindable(''),
		attachments = $bindable<ChatAttachmentInput[]>([])
	} = $props<{
		value?: string;
		isStreaming: boolean;
		modelLocked?: boolean;
		onSend: () => void;
		models: Model[];
		selectedModel?: string;
		attachments: ChatAttachmentInput[];
	}>();
	let fileInput: HTMLInputElement | null = $state(null);
	let dragOver = $state(false);
	let isUploading = $state(false);
	let attachError = $state('');

	const currentModel = $derived(models.find((m: Model) => m.id === selectedModel));
	const supportsVision = $derived(currentModel?.supportsVision === true);
	const supportsFiles = $derived(currentModel?.supportsFiles === true);
	const showAttachButton = $derived(supportsVision || supportsFiles);
	const fileAcceptAttr = $derived(chatInputFileAcceptAttr(supportsVision, supportsFiles));

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			onSend();
		}
	}

	async function handleFile(file: File) {
		attachError = '';
		const caps = { supportsVision, supportsFiles };
		if (!chatFileAllowedForModel(file, caps)) {
			attachError = chatAttachmentRejectMessage(caps);
			return;
		}
		isUploading = true;
		try {
			const data = await uploadChatAttachment(file);
			attachments = [...attachments, data];
		} catch (e) {
			attachError = e instanceof Error ? e.message : 'Upload failed';
		} finally {
			isUploading = false;
		}
	}

	function handleAttachClick() {
		fileInput?.click();
	}

	function handleFileSelect(e: Event) {
		const files = (e.target as HTMLInputElement).files;
		if (!files) return;
		for (const file of files) handleFile(file);
		if (fileInput) fileInput.value = '';
	}

	function handlePaste(e: ClipboardEvent) {
		consumeClipboardForAttachments(e, { enabled: showAttachButton, onFile: handleFile });
	}

	function handleDrop(e: DragEvent) {
		if (!showAttachButton) return;
		e.preventDefault();
		dragOver = false;
		const caps = { supportsVision, supportsFiles };
		for (const file of e.dataTransfer?.files ?? []) {
			if (chatFileAllowedForModel(file, caps)) handleFile(file);
		}
	}
</script>

<input bind:this={fileInput} type="file" multiple accept={fileAcceptAttr} style="display: none;" onchange={handleFileSelect} />

<div
	class="input-wrapper"
	class:drag-over={dragOver}
	class:sending={isStreaming}
	role="region"
	aria-label="Chat input"
	ondragover={(e) => {
		if (!showAttachButton) return;
		e.preventDefault();
		dragOver = true;
	}}
	ondragleave={() => {
		dragOver = false;
	}}
	ondrop={handleDrop}
>
	<ChatInputBody
		bind:value
		bind:attachments
		{attachError}
		{isStreaming}
		{showAttachButton}
		onKeyDown={handleKeyDown}
		onPaste={handlePaste}
	/>
	<ChatInputToolbar {models} bind:selectedModel {modelLocked} {value} attachmentsLen={attachments.length} {isStreaming} {showAttachButton} {isUploading} onAttachClick={handleAttachClick} {onSend} />
</div>

<style>
	.input-wrapper {
		margin: 0 auto 2.5rem;
		max-width: 900px;
		width: 100%;
		background: #1e1e2e;
		border: 1px solid #313244;
		border-radius: 24px;
		padding: 1rem 1.25rem 0.75rem;
		transition: border-color 0.2s;
	}
	.input-wrapper.drag-over,
	.input-wrapper.sending {
		border-color: #89b4fa;
	}
	.input-wrapper.sending {
		box-shadow: 0 0 0 1px #89b4fa33;
	}
</style>
