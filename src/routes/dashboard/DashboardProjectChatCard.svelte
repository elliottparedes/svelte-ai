<script lang="ts">
	import DeleteChatConfirmModal from './DeleteChatConfirmModal.svelte';
	import SidebarChatRenameRow from './SidebarChatRenameRow.svelte';
	import SidebarChatLoadingDots from './SidebarChatLoadingDots.svelte';
	import type { Conversation } from '$lib/types/dashboard';

	let {
		conv,
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
		streaming?: boolean;
		editing: boolean;
		editValue?: string;
		onOpen: () => void;
		onStartRename: (e: MouseEvent) => void;
		onDelete: () => void | Promise<void>;
		submitRename: (e: Event) => void;
		cancelRename: (e: Event) => void;
	}>();

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
					{conv.title}
				{/if}
				{#if streaming}
					<SidebarChatLoadingDots />
				{/if}
			</div>
			<div class="card-meta">{new Date(conv.createdAt).toLocaleDateString()}</div>
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
