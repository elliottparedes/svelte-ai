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
	.chat-card {
		display: flex;
		align-items: stretch;
		gap: 0.35rem;
		background: #1e1e2e;
		border: 1px solid #313244;
		border-radius: 12px;
		padding: 0.35rem 0.5rem;
		transition:
			border-color 0.15s,
			background 0.15s;
	}
	.chat-card:hover:not(.editing),
	.chat-card:focus-within {
		border-color: #45475a;
		background: #252537;
	}
	.chat-card.editing {
		flex-direction: column;
		padding: 0.5rem;
	}
	.card-main {
		flex: 1;
		min-width: 0;
		cursor: pointer;
		text-align: left;
		background: none;
		border: none;
		padding: 0.65rem 0.35rem 0.65rem 0.65rem;
		border-radius: 8px;
		color: inherit;
		font: inherit;
	}
	.card-main:hover {
		color: #cdd6f4;
	}
	.card-title {
		display: flex;
		align-items: center;
		color: #cdd6f4;
		font-size: 0.95rem;
		font-weight: 500;
		margin-bottom: 0.35rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.card-meta {
		color: #6c7086;
		font-size: 0.75rem;
	}
	.icon-btn {
		flex-shrink: 0;
		align-self: center;
		width: 2rem;
		height: 2rem;
		padding: 0;
		border: none;
		border-radius: 8px;
		background: transparent;
		color: #6c7086;
		font-size: 1rem;
		line-height: 1;
		cursor: pointer;
		transition:
			color 0.15s,
			background 0.15s;
	}
	.icon-btn:hover {
		color: #cdd6f4;
		background: #313244;
	}
	.icon-btn.danger:hover {
		color: #f38ba8;
		background: rgba(243, 139, 168, 0.12);
	}
</style>
