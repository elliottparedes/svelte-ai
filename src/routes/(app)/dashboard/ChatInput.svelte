<script lang="ts">
	import ChatInputBody from './ChatInputBody.svelte';
	import ChatInputToolbar from './ChatInputToolbar.svelte';
	import ChatInputModelSend from './ChatInputModelSend.svelte';
	import ChatMicButton from './ChatMicButton.svelte';
	import ChatInputShell from './ChatInputShell.svelte';
	import ChatInputProModelRow from './ChatInputProModelRow.svelte';
	import type { ChatAttachmentInput, ChatMessage, Model } from '$lib/types/dashboard';
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
		onSend,
		models,
		modelGroups = [],
		usesAutoRouting = true,
		chatQuota,
		routedModelId = '',
		selectedModelId = $bindable(''),
		deepReasoningEnabled = $bindable(false),
		attachments = $bindable<ChatAttachmentInput[]>([]),
		messages = [],
		summaryThroughMessageId = null,
		modelSupportsTools = true,
		enabledToolIds = $bindable<ChatToolId[]>([...DEFAULT_CHAT_TOOL_IDS])
	} = $props<{
		value?: string;
		isStreaming: boolean;
		onSend: () => void;
		models: Model[];
		modelGroups?: import('$lib/types/dashboard').ModelProviderGroup[];
		usesAutoRouting?: boolean;
		chatQuota?: import('$lib/types/dashboard').ChatQuotaView;
		routedModelId?: string;
		selectedModelId?: string;
		deepReasoningEnabled?: boolean;
		attachments: ChatAttachmentInput[];
		messages?: ChatMessage[];
		summaryThroughMessageId?: string | null;
		modelSupportsTools?: boolean;
		enabledToolIds?: ChatToolId[];
	}>();

	let fileInput: HTMLInputElement | null = $state(null);
	let dragOver = $state(false);
	let isUploading = $state(false);
	let attachError = $state('');

	const activeModel = $derived(
		models.find((m: Model) => m.id === (selectedModelId || routedModelId)) ?? models[0]
	);
	const supportsVision = $derived(
		usesAutoRouting
			? models.some((m: Model) => m.supportsVision === true)
			: activeModel?.supportsVision === true
	);
	const supportsFiles = $derived(
		usesAutoRouting
			? models.some((m: Model) => m.supportsFiles === true)
			: activeModel?.supportsFiles === true
	);
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
		consumeClipboardForAttachments(e, { filePasteEnabled: showAttachButton, onFile: handleFile });
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
		{#if !usesAutoRouting}
			<ChatInputProModelRow {models} {modelGroups} bind:selectedModelId disabled={isStreaming} />
		{/if}
		<ChatInputBody
			bind:value
			bind:attachments
			{attachError}
			{isStreaming}
			{showAttachButton}
			onKeyDown={handleKeyDown}
			onPaste={handlePaste}
		>
			{#snippet trailing()}
				<div class="input-actions">
					<div class="mic-inline">
						<ChatMicButton
							placement="inline"
							disabled={isStreaming}
							onAppend={(t) => (value += (value ? ' ' : '') + t)}
						/>
					</div>
					<ChatInputModelSend
						{value}
						attachmentsLen={attachments.length}
						{isStreaming}
						{onSend}
					/>
				</div>
			{/snippet}
		</ChatInputBody>
		<ChatInputToolbar
			{models}
			{modelGroups}
			{usesAutoRouting}
			{chatQuota}
			bind:selectedModelId
			{routedModelId}
			bind:deepReasoningEnabled
			{isStreaming}
			{showAttachButton}
			{isUploading}
			onAttachClick={handleAttachClick}
			{messages}
			{summaryThroughMessageId}
			{modelSupportsTools}
			bind:enabledToolIds
			onAppendDictation={(t) => (value += (value ? ' ' : '') + t)}
		/>
	{/snippet}
</ChatInputShell>
