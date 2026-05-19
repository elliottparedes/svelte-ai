<script lang="ts">
	import ChatInputBody from './ChatInputBody.svelte';
	import ChatInputToolbar from './ChatInputToolbar.svelte';
	import ChatInputShell from './ChatInputShell.svelte';
	import type { ChatAttachmentInput, ChatMessage, Model, ModelProviderGroup } from '$lib/types/dashboard';
	import type { ChatToolId } from '$lib/shared/chatToolSystemPrompt';
	import { DEFAULT_CHAT_TOOL_IDS } from '$lib/shared/chatToolSystemPrompt';
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
		modelGroups,
		selectedModel = $bindable(''),
		attachments = $bindable<ChatAttachmentInput[]>([]),
		messages = [],
		extraSystemTokens = 0,
		modelSupportsTools = true,
		enabledToolIds = $bindable<ChatToolId[]>([...DEFAULT_CHAT_TOOL_IDS]),
} = $props<{
		value?: string;
		isStreaming: boolean;
		modelLocked?: boolean;
		onSend: () => void;
		models: Model[];
		modelGroups: ModelProviderGroup[];
		selectedModel?: string;
		attachments: ChatAttachmentInput[];
		messages?: ChatMessage[];
		extraSystemTokens?: number;
		modelSupportsTools?: boolean;
		enabledToolIds?: ChatToolId[];
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

<ChatInputShell
	bind:fileInput
	{fileAcceptAttr}
	{dragOver}
	{isStreaming}
	onDragOver={(e) => {
		if (!showAttachButton) return;
		e.preventDefault();
		dragOver = true;
	}}
	onDragLeave={() => {
		dragOver = false;
	}}
	onDrop={handleDrop}
	onFileSelect={handleFileSelect}
>
	{#snippet children()}
		<ChatInputBody
			bind:value
			bind:attachments
			{attachError}
			{isStreaming}
			{showAttachButton}
			onKeyDown={handleKeyDown}
			onPaste={handlePaste}
		/>
		<ChatInputToolbar
			{models}
			{modelGroups}
			bind:selectedModel
			{modelLocked}
			{value}
			attachmentsLen={attachments.length}
			{isStreaming}
			{showAttachButton}
			{isUploading}
			onAttachClick={handleAttachClick}
			{onSend}
			{messages}
			{attachments}
			{extraSystemTokens}
			{modelSupportsTools}
			bind:enabledToolIds
			onAppendDictation={(t) => (value += (value ? ' ' : '') + t)}
		/>
	{/snippet}
</ChatInputShell>
