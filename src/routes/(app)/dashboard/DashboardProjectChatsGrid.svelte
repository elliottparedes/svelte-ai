<script lang="ts">
	import DashboardProjectChatCard from './DashboardProjectChatCard.svelte';
	import type { Conversation } from '$lib/types/dashboard';

	let {
		projectConversations,
		onOpenConversation,
		onRenameChat,
		onDeleteChat,
		streamingConversationIds
	} = $props<{
		projectConversations: Conversation[];
		onOpenConversation: (id: string) => void;
		onRenameChat: (id: string, title: string) => void | Promise<void>;
		onDeleteChat: (id: string) => void | Promise<void>;
		streamingConversationIds: ReadonlySet<string>;
	}>();

	let editingId = $state<string | null>(null);
	let editingValue = $state('');

	function startRename(conv: Conversation, e: MouseEvent) {
		e.stopPropagation();
		editingId = conv.id;
		editingValue = conv.title;
	}

	async function submitRename(e: Event) {
		e.stopPropagation();
		const id = editingId;
		const val = editingValue.trim();
		editingId = null;
		if (id && val) await onRenameChat(id, val);
	}

	function cancelRename(e: Event) {
		e.stopPropagation();
		editingId = null;
	}
</script>

{#if projectConversations.length === 0}
	<div class="empty-project">
		<p>No chats in this project yet.</p>
		<p>Start a new chat to get going.</p>
	</div>
{:else}
	<div class="chat-cards">
		{#each projectConversations as conv}
			<DashboardProjectChatCard
				{conv}
				streaming={streamingConversationIds.has(conv.id)}
				editing={editingId === conv.id}
				bind:editValue={editingValue}
				onOpen={() => onOpenConversation(conv.id)}
				onStartRename={(e) => startRename(conv, e)}
				onDelete={() => onDeleteChat(conv.id)}
				{submitRename}
				{cancelRename}
			/>
		{/each}
	</div>
{/if}

<style>
	.empty-project {
		color: #6c7086;
		text-align: center;
		margin-top: 4rem;
		font-size: 1rem;
	}
	.chat-cards {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-inline: auto;
		max-width: 900px;
		width: 100%;
	}
</style>
