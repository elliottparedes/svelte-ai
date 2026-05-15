<script lang="ts">
	import DeleteChatConfirmModal from './DeleteChatConfirmModal.svelte';
	import ChatConvMoreMenu from './ChatConvMoreMenu.svelte';
	import SidebarChatRenameRow from './SidebarChatRenameRow.svelte';
	import SidebarConversationRow from './SidebarConversationRow.svelte';
	import type { Conversation, Project } from '$lib/types/dashboard';

	let {
		conversations,
		projects,
		activeId,
		activeProjectId,
		onSelect,
		onDelete,
		onRename
	} = $props<{
		conversations: Conversation[];
		projects: Project[];
		activeId: string | null;
		activeProjectId: string | null;
		onSelect: (id: string) => void;
		onDelete: (id: string) => void;
		onRename: (id: string, title: string) => void;
	}>();

	let editingId = $state<string | null>(null);
	let editingValue = $state('');
	let openMenuId = $state<string | null>(null);

	$effect(() => {
		if (!openMenuId) return;
		function onDocClick(e: MouseEvent) {
			const t = e.target as HTMLElement;
			if (t.closest('[data-chat-menu-open]')) return;
			openMenuId = null;
		}
		document.addEventListener('click', onDocClick);
		return () => document.removeEventListener('click', onDocClick);
	});

	function toggleMenu(id: string, e: Event) {
		e.stopPropagation();
		openMenuId = openMenuId === id ? null : id;
	}

	function startRename(conv: Conversation, e: MouseEvent) {
		e.stopPropagation();
		openMenuId = null;
		editingId = conv.id;
		editingValue = conv.title;
	}

	function submitRename(e: Event) {
		e.stopPropagation();
		const id = editingId;
		const val = editingValue.trim();
		editingId = null;
		if (id && val) onRename(id, val);
	}

	function cancelRename(e: Event) {
		e.stopPropagation();
		editingId = null;
	}

	let pendingDelete = $state<{ id: string; title: string } | null>(null);

	function handleDelete(id: string, e: MouseEvent) {
		e.stopPropagation();
		openMenuId = null;
		const title = conversations.find((c) => c.id === id)?.title ?? 'Chat';
		pendingDelete = { id, title };
	}

	function cancelPendingDelete() {
		pendingDelete = null;
	}

	function confirmPendingDelete() {
		const p = pendingDelete;
		pendingDelete = null;
		if (p) void onDelete(p.id);
	}

	async function moveToProject(convId: string, projectId: string | null) {
		openMenuId = null;
		const res = await fetch(`/api/v1/conversations/${convId}/move`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ projectId })
		});
		if (res.ok) window.location.reload();
	}
</script>

<div class="section-label">Chats</div>
<div class="conv-list">
	{#each conversations as conv}
		{#if editingId === conv.id}
			<SidebarChatRenameRow bind:value={editingValue} {submitRename} {cancelRename} />
		{:else}
			<SidebarConversationRow
				{conv}
				{projects}
				{activeId}
				{activeProjectId}
				menuOpen={openMenuId === conv.id}
				onToggle={(e: MouseEvent) => toggleMenu(conv.id, e)}
				onRenameStart={startRename}
				onDelete={handleDelete}
				onMoveToProject={moveToProject}
				onSelect={onSelect}
			/>
		{/if}
	{/each}
	{#if conversations.length === 0}
		<p class="empty">No conversations yet.</p>
	{/if}
</div>

<DeleteChatConfirmModal
	open={pendingDelete !== null}
	chatTitle={pendingDelete?.title ?? ''}
	onCancel={cancelPendingDelete}
	onConfirm={confirmPendingDelete}
/>

<style>
	.section-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #6c7086;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0 0.25rem;
		margin-bottom: 0.5rem;
	}
	.conv-list {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		margin-bottom: 1rem;
	}
	.empty {
		color: #6c7086;
		font-size: 0.85rem;
		padding: 0.5rem;
	}
</style>
