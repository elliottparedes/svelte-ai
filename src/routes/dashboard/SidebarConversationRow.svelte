<script lang="ts">
	import ChatConvMoreMenu from './ChatConvMoreMenu.svelte';
	import type { Conversation, Project } from '$lib/types/dashboard';

	let {
		conv,
		projects,
		activeId,
		activeProjectId,
		menuOpen,
		onToggle,
		onRenameStart,
		onDelete,
		onMoveToProject,
		onSelect
	} = $props<{
		conv: Conversation;
		projects: Project[];
		activeId: string | null;
		activeProjectId: string | null;
		menuOpen: boolean;
		onToggle: (e: MouseEvent) => void;
		onRenameStart: (c: Conversation, e: MouseEvent) => void;
		onDelete: (id: string, e: MouseEvent) => void;
		onMoveToProject: (convId: string, projectId: string | null) => Promise<void>;
		onSelect: (id: string) => void;
	}>();
</script>

<div class="conv-item" class:active={conv.id === activeId && !activeProjectId}>
	<button class="conv-btn" onclick={() => onSelect(conv.id)}>
		<span class="conv-title">{conv.title}</span>
	</button>
	<ChatConvMoreMenu
		{conv}
		{projects}
		isOpen={menuOpen}
		onToggle={onToggle}
		onRename={onRenameStart}
		onDelete={onDelete}
		onMoveToProject={onMoveToProject}
	/>
</div>

<style>
	.conv-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-radius: 8px;
		transition: background 0.15s;
	}
	.conv-item:hover,
	.conv-item.active {
		background: #313244;
	}
	.conv-btn {
		flex: 1;
		background: none;
		border: none;
		color: #a6adc8;
		cursor: pointer;
		font-size: 0.85rem;
		padding: 0.4rem 0.5rem;
		text-align: left;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.conv-btn:hover {
		color: #cdd6f4;
	}
	.conv-title {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
