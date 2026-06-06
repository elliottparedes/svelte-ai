<script lang="ts">
	import ChatConvMoreMenu from './ChatConvMoreMenu.svelte';
	import SidebarChatLoadingDots from './SidebarChatLoadingDots.svelte';
	import type { Conversation, Model, Project } from '$lib/types/dashboard';

	let {
		conv,
		projects,
		models,
		activeId,
		activeProjectId,
		streaming = false,
		menuOpen,
		onToggle,
		onRenameStart,
		onDelete,
		onMoveToProject,
		onSelect
	} = $props<{
		conv: Conversation;
		projects: Project[];
		models: Model[];
		activeId: string | null;
		activeProjectId: string | null;
		streaming?: boolean;
		menuOpen: boolean;
		onToggle: (e: MouseEvent) => void;
		onRenameStart: (c: Conversation, e: MouseEvent) => void;
		onDelete: (id: string, e: MouseEvent) => void;
		onMoveToProject: (convId: string, projectId: string | null) => Promise<void>;
		onSelect: (id: string) => void;
	}>();

	const modelLabel = $derived.by(() => {
		if (!conv.modelId) return '';
		const found = models.find((m: Model) => m.id === conv.modelId);
		if (found) return found.name;
		const slash = conv.modelId.lastIndexOf('/');
		return slash >= 0 ? conv.modelId.slice(slash + 1) : conv.modelId;
	});
</script>

<div class="conv-item" class:active={conv.id === activeId && !activeProjectId}>
	<button class="conv-btn" onclick={() => onSelect(conv.id)}>
		{#if conv.title.trim()}
			<span class="conv-title">{conv.title}</span>
		{/if}
		{#if modelLabel}
			<span class="conv-model">{modelLabel}</span>
		{/if}
		{#if streaming}
			<SidebarChatLoadingDots />
		{/if}
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
		gap: 0.25rem;
		border-radius: 8px;
		transition: background 0.15s;
	}
	.conv-item:hover,
	.conv-item.active {
		background: #313244;
	}
	.conv-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		min-width: 0;
		background: none;
		border: none;
		color: #a6adc8;
		cursor: pointer;
		font-size: 0.85rem;
		padding: 0.4rem 0.5rem;
		text-align: left;
		white-space: normal;
		overflow: hidden;
	}
	.conv-btn:hover {
		color: #cdd6f4;
	}
	.conv-title {
		display: block;
		overflow: hidden;
		overflow-wrap: anywhere;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}
	.conv-model {
		display: block;
		max-width: 100%;
		margin-top: 0.12rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: #6c7086;
		font-size: 0.7rem;
	}
</style>
