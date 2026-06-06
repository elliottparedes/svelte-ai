<script lang="ts">
	import DeleteChatConfirmModal from './DeleteChatConfirmModal.svelte';
	import SidebarChatRenameRow from './SidebarChatRenameRow.svelte';
	import SidebarChatLoadingDots from './SidebarChatLoadingDots.svelte';
	import type { Conversation, Model } from '$lib/types/dashboard';

	let {
		conv,
		models,
		streaming = false,
		editing,
		editValue = $bindable(''),
		onOpen,
		onStartRename,
		onDelete,
		submitRename,
		cancelRename
	} = $props<{
		conv: Conversation;
		models: Model[];
		streaming?: boolean;
		editing: boolean;
		editValue?: string;
		onOpen: () => void;
		onStartRename: (e: MouseEvent) => void;
		onDelete: () => void | Promise<void>;
		submitRename: (e: Event) => void;
		cancelRename: (e: Event) => void;
	}>();

	const modelLabel = $derived.by(() => {
		if (!conv.modelId) return 'Model not recorded';
		const found = models.find((m: Model) => m.id === conv.modelId);
		if (found) return found.name;
		const slash = conv.modelId.lastIndexOf('/');
		return slash >= 0 ? conv.modelId.slice(slash + 1) : conv.modelId;
	});

	let deleteModalOpen = $state(false);

	function openDeleteModal(e: MouseEvent) {
		e.stopPropagation();
		deleteModalOpen = true;
	}

	function closeDeleteModal() {
		deleteModalOpen = false;
	}

	async function confirmDelete() {
		deleteModalOpen = false;
		await onDelete();
	}
</script>

<div class="chat-card" class:editing>
	{#if editing}
		<SidebarChatRenameRow bind:value={editValue} {submitRename} {cancelRename} />
	{:else}
		<button type="button" class="card-main" onclick={onOpen}>
			<div class="card-title">
				{#if conv.title.trim()}
					<span>{conv.title}</span>
				{/if}
				{#if streaming}
					<SidebarChatLoadingDots />
				{/if}
			</div>
			<div class="card-meta">
				<span>{new Date(conv.createdAt).toLocaleDateString()}</span>
				<span class="model-meta" title={conv.modelId ?? modelLabel}>Model: {modelLabel}</span>
			</div>
		</button>
		<button type="button" class="icon-btn" title="Rename chat" onclick={onStartRename}>✎</button>
		<button
			type="button"
			class="icon-btn danger"
			title="Delete chat"
			aria-label="Delete chat"
			onclick={openDeleteModal}
		>
			✕
		</button>
	{/if}
</div>

<DeleteChatConfirmModal
	open={deleteModalOpen}
	chatTitle={conv.title}
	onCancel={closeDeleteModal}
	onConfirm={confirmDelete}
/>

<style>
	@import './DashboardProjectChatCard.css';
</style>
