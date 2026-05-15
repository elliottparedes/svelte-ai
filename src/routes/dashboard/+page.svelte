<script lang="ts">
	import { page } from '$app/stores';
	import ConversationSidebar from './ConversationSidebar.svelte';
	import ChatMessageList from './ChatMessageList.svelte';
	import ChatInput from './ChatInput.svelte';
	import WelcomeScreen from './WelcomeScreen.svelte';
	import DashboardProjectPanel from './DashboardProjectPanel.svelte';
	import ProjectChatBackButton from './ProjectChatBackButton.svelte';
	import { createDashboardPageModel } from './dashboardPageModel.svelte.js';
	import type { DashboardPageLoadData, DashboardUser } from '$lib/types/dashboard';

	let { data } = $props<{ data: DashboardPageLoadData }>();

	const user = $derived(($page.data.user as DashboardUser | null) ?? null);
	// Model + chat UI state stay client-side for this navigation; load `data` is only initial snapshot.
	// svelte-ignore state_referenced_locally
	const model = createDashboardPageModel(data);

	const chatBackProjectId = $derived.by(() => {
		if (model.projectComposeMode && model.activeProjectId) return model.activeProjectId;
		const cid = model.activeConversationId;
		if (!cid) return null;
		const fromProject = model.projectConversations.find((c) => c.id === cid);
		if (fromProject?.projectId) return fromProject.projectId;
		return model.conversations.find((c) => c.id === cid)?.projectId ?? null;
	});

	const showProjectChatBack = $derived(
		chatBackProjectId !== null && !(model.activeProjectId !== null && !model.projectComposeMode)
	);

	const chatContextExtraTokens = $derived.by(() => {
		if (model.projectComposeMode && model.activeProjectId) {
			const sp = model.projects.find((p) => p.id === model.activeProjectId)?.systemPrompt ?? '';
			return Math.ceil(sp.length / 4);
		}
		const cid = model.activeConversationId;
		if (!cid) return 0;
		const conv =
			model.projectConversations.find((c) => c.id === cid) ??
			model.conversations.find((c) => c.id === cid);
		const pid = conv?.projectId;
		if (!pid) return 0;
		const sp = model.projects.find((p) => p.id === pid)?.systemPrompt ?? '';
		return Math.ceil(sp.length / 4);
	});
</script>

<div class="app-layout">
	<ConversationSidebar
		conversations={model.conversations}
		projects={model.projects}
		activeId={model.activeConversationId}
		activeProjectId={model.activeProjectId}
		onSelect={model.loadMessages}
		onSelectProject={model.loadProject}
		onNewChat={model.startNewChat}
		onDelete={model.deleteConversation}
		onRename={model.renameConversation}
		{user}
		onLogout={model.logout}
		bind:collapsed={model.sidebarCollapsed}
	/>

	<main class="chat-main">
		{#if showProjectChatBack && chatBackProjectId}
			<ProjectChatBackButton projectId={chatBackProjectId} onBack={model.loadProject} />
		{/if}
		{#if model.activeProjectId && !model.projectComposeMode}
			<DashboardProjectPanel
				projects={model.projects}
				activeProjectId={model.activeProjectId}
				projectConversations={model.projectConversations}
				bind:editingProjectPrompt={model.editingProjectPrompt}
				bind:projectPromptValue={model.projectPromptValue}
				onNewChatInProject={() => {
					model.projectComposeMode = true;
				}}
				onSavePrompt={model.saveProjectPrompt}
				onStartEditPrompt={model.startEditingPrompt}
				onCancelEditPrompt={() => {
					model.editingProjectPrompt = false;
				}}
				onOpenConversation={model.loadMessages}
				onRenameChat={model.renameConversation}
				onDeleteChat={model.deleteConversation}
			/>
		{:else if model.messages.length === 0 && !model.projectComposeMode}
			<WelcomeScreen />
		{:else}
			<ChatMessageList messages={model.messages} isStreaming={model.isStreaming} errorMessage={model.errorMessage} />
		{/if}
		{#if !model.activeProjectId || model.projectComposeMode}
			<div class="chat-input-area">
				<ChatInput
					bind:value={model.inputValue}
					isStreaming={model.isStreaming}
					modelLocked={model.messages.length > 0}
					onSend={model.sendMessage}
					models={model.models}
					modelGroups={model.modelGroups}
					bind:selectedModel={model.selectedModel}
					bind:attachments={model.attachments}
					messages={model.messages}
					extraSystemTokens={chatContextExtraTokens}
				/>
			</div>
		{/if}
	</main>
</div>

<style>
	.app-layout {
		display: flex;
		flex: 1;
		min-height: 0;
		width: 100%;
		max-width: 100%;
		overflow: hidden;
	}
	.chat-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		background: #181825;
		min-width: 0;
		min-height: 0;
		position: relative;
		/* Below sidebar so conversation ⋮ menus can overlap this pane */
		z-index: 1;
	}
	.chat-input-area {
		position: sticky;
		bottom: 0;
		padding: 0 1rem 2rem;
		background: linear-gradient(transparent, #181825 30%);
	}
</style>
