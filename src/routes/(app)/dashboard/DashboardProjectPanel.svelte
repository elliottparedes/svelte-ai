<script lang="ts">
	import type { Conversation, Model, Project } from '$lib/types/dashboard';

	import DashboardProjectChatsGrid from './DashboardProjectChatsGrid.svelte';
	import DashboardProjectPanelHeader from './DashboardProjectPanelHeader.svelte';
	import DashboardProjectPromptSection from './DashboardProjectPromptSection.svelte';

	let {
		projects,
		activeProjectId,
		projectConversations,
		models,
		isMobile = false,
		editingProjectPrompt = $bindable(false),
		projectPromptValue = $bindable(''),
		onNewChatInProject,
		onSavePrompt,
		onStartEditPrompt,
		onCancelEditPrompt,
		onOpenConversation,
		onRenameChat,
		onDeleteChat,
		streamingConversationIds
	} = $props<{
		projects: Project[];
		activeProjectId: string;
		projectConversations: Conversation[];
		models: Model[];
		isMobile?: boolean;
		editingProjectPrompt?: boolean;
		projectPromptValue?: string;
		onNewChatInProject: () => void;
		onSavePrompt: () => void;
		onStartEditPrompt: () => void;
		onCancelEditPrompt: () => void;
		onOpenConversation: (id: string) => void;
		onRenameChat: (id: string, title: string) => void | Promise<void>;
		onDeleteChat: (id: string) => void | Promise<void>;
		streamingConversationIds: ReadonlySet<string>;
	}>();

	const activeProject = $derived(projects.find((p: Project) => p.id === activeProjectId));
</script>

<div class="project-view">
	<DashboardProjectPanelHeader
		projectName={activeProject?.name ?? 'Project'}
		{onNewChatInProject}
		showNewChat={!isMobile}
	/>
	<DashboardProjectPromptSection
		{activeProject}
		bind:editingProjectPrompt
		bind:projectPromptValue
		{onSavePrompt}
		{onCancelEditPrompt}
		{onStartEditPrompt}
	/>
	{#if isMobile}
		<div class="mobile-project-actions">
			<button class="mobile-new-chat-btn" onclick={onNewChatInProject}>✚ New chat in project</button>
		</div>
	{/if}
	<DashboardProjectChatsGrid
		{projectConversations}
		{models}
		{streamingConversationIds}
		{onOpenConversation}
		{onRenameChat}
		{onDeleteChat}
	/>
</div>

<style>
	.project-view {
		flex: 1;
		overflow-y: auto;
		padding: 2rem;
		scrollbar-width: thin;
		scrollbar-color: #45475a transparent;
	}
	.project-view::-webkit-scrollbar {
		width: 5px;
	}
	.project-view::-webkit-scrollbar-track {
		background: transparent;
	}
	.project-view::-webkit-scrollbar-thumb {
		background: #45475a;
		border-radius: 3px;
	}
	.mobile-project-actions {
		display: flex;
		justify-content: flex-end;
		margin: -0.5rem auto 1.75rem;
		max-width: 900px;
		width: 100%;
		padding: 0 0.5rem;
	}
	.mobile-new-chat-btn {
		background: #45475a;
		color: #cdd6f4;
		border: none;
		border-radius: 8px;
		padding: 0.55rem 0.8rem;
		font-size: 0.85rem;
		line-height: 1.2;
		cursor: pointer;
	}
</style>
