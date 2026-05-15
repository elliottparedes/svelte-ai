<script lang="ts">
	import type { Conversation, Project } from '$lib/types/dashboard';

	import DashboardProjectChatsGrid from './DashboardProjectChatsGrid.svelte';
	import DashboardProjectPanelHeader from './DashboardProjectPanelHeader.svelte';
	import DashboardProjectPromptSection from './DashboardProjectPromptSection.svelte';

	let {
		projects,
		activeProjectId,
		projectConversations,
		editingProjectPrompt = $bindable(false),
		projectPromptValue = $bindable(''),
		onNewChatInProject,
		onSavePrompt,
		onStartEditPrompt,
		onCancelEditPrompt,
		onOpenConversation,
		onRenameChat
	} = $props<{
		projects: Project[];
		activeProjectId: string;
		projectConversations: Conversation[];
		editingProjectPrompt?: boolean;
		projectPromptValue?: string;
		onNewChatInProject: () => void;
		onSavePrompt: () => void;
		onStartEditPrompt: () => void;
		onCancelEditPrompt: () => void;
		onOpenConversation: (id: string) => void;
		onRenameChat: (id: string, title: string) => void | Promise<void>;
	}>();

	const activeProject = $derived(projects.find((p: Project) => p.id === activeProjectId));
</script>

<div class="project-view">
	<DashboardProjectPanelHeader
		projectName={activeProject?.name ?? 'Project'}
		{onNewChatInProject}
	/>
	<DashboardProjectPromptSection
		{activeProject}
		bind:editingProjectPrompt
		bind:projectPromptValue
		{onSavePrompt}
		{onCancelEditPrompt}
		{onStartEditPrompt}
	/>
	<DashboardProjectChatsGrid {projectConversations} {onOpenConversation} {onRenameChat} />
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
</style>
