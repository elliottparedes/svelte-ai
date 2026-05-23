<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import ConversationSidebar from './ConversationSidebar.svelte';
	import ChatMessageList from './ChatMessageList.svelte';
	import ChatInput from './ChatInput.svelte';
	import WelcomeScreen from './WelcomeScreen.svelte';
	import DashboardProjectPanel from './DashboardProjectPanel.svelte';
	import ProjectChatBackButton from './ProjectChatBackButton.svelte';
	import ImmersiveVoiceOverlay from './ImmersiveVoiceOverlay.svelte';
	import { createDashboardPageModel } from './dashboardPageModel.svelte.js';
	import type { DashboardPageLoadData, DashboardUser } from '$lib/types/dashboard';
	import { useDashboardViewport } from './useDashboardViewport.svelte';
	import { useDashboardBodyScrollLock } from './useDashboardBodyScrollLock.svelte';
	import DashboardMobileChrome from './DashboardMobileChrome.svelte';
	import { createDashboardMobileNav } from './dashboardMobileNav';
	import './dashboardPageLayout.css';
	import './dashboardMobile.css';
	import { activeConversationSummaryMeta } from '$lib/client/dashboardConversationSummary';

	let { data } = $props<{ data: DashboardPageLoadData }>();

	const user = $derived(($page.data.user as DashboardUser | null) ?? null);
	// svelte-ignore state_referenced_locally
	const model = createDashboardPageModel(data);

	// Sync optional models after Profile save + invalidateAll (not in a reactive $effect — that looped).
	afterNavigate(() => {
		model.syncPageLoadData(data);
	});

	const viewport = useDashboardViewport();
	const mobileNav = createDashboardMobileNav(viewport, model);
	useDashboardBodyScrollLock(() => viewport.isMobile && !model.sidebarCollapsed);

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

	const modelSupportsTools = $derived(model.models.some((m) => m.supportsTools !== false));

	const chatSummaryMeta = $derived.by(() =>
		activeConversationSummaryMeta(
			model.conversations,
			model.projectConversations,
			model.activeConversationId
		)
	);
</script>

<div class="app-layout">
	<ConversationSidebar
		conversations={model.conversations}
		projects={model.projects}
		activeId={model.activeConversationId}
		activeProjectId={model.activeProjectId}
		onSelect={mobileNav.onSelectConversation}
		onSelectProject={mobileNav.onSelectProject}
		onNewChat={mobileNav.onNewChat}
		onDelete={model.deleteConversation}
		onRename={model.renameConversation}
		streamingConversationIds={model.streamingConversationIds}
		{user}
		onLogout={model.logout}
		bind:collapsed={model.sidebarCollapsed}
		isMobile={viewport.isMobile}
	/>

	<main
		class="chat-main"
		class:has-back-btn={showProjectChatBack && !!chatBackProjectId}
	>
		<DashboardMobileChrome
			sidebarOpen={viewport.isMobile && !model.sidebarCollapsed}
			showMenuButton={viewport.isMobile && model.sidebarCollapsed}
			onOpenSidebar={mobileNav.openMobileSidebar}
			onCloseSidebar={mobileNav.closeMobileSidebar}
		/>
		{#if showProjectChatBack && chatBackProjectId}
			<ProjectChatBackButton projectId={chatBackProjectId} onBack={mobileNav.onProjectBack} />
		{/if}
		{#if model.activeProjectId && !model.projectComposeMode}
			<DashboardProjectPanel
				projects={model.projects}
				activeProjectId={model.activeProjectId}
				projectConversations={model.projectConversations}
				bind:editingProjectPrompt={model.editingProjectPrompt}
				bind:projectPromptValue={model.projectPromptValue}
				onNewChatInProject={model.startProjectCompose}
				onSavePrompt={model.saveProjectPrompt}
				onStartEditPrompt={model.startEditingPrompt}
				onCancelEditPrompt={() => {
					model.editingProjectPrompt = false;
				}}
				onOpenConversation={mobileNav.onOpenProjectConversation}
				onRenameChat={model.renameConversation}
				onDeleteChat={model.deleteConversation}
				streamingConversationIds={model.streamingConversationIds}
			/>
		{:else}
			{#if model.messages.length === 0 && !model.projectComposeMode}
				<WelcomeScreen />
			{:else}
				<ChatMessageList
					messages={model.messages}
					isStreaming={model.isStreaming}
					isCompacting={model.isCompacting}
					errorMessage={model.errorMessage}
				/>
			{/if}
		{/if}
		{#if !model.activeProjectId || model.projectComposeMode}
			<div class="chat-input-area">
				{#key model.activeConversationId ?? (model.projectComposeMode ? `compose-${model.activeProjectId}` : 'new')}
					<ChatInput
					bind:value={model.inputValue}
					isStreaming={model.isStreaming}
					onSend={model.sendMessage}
					models={model.models}
					routedModelId={model.lastRoutedModelId}
					bind:deepReasoningEnabled={model.deepReasoningEnabled}
					bind:attachments={model.attachments}
					messages={model.messages}
					summaryThroughMessageId={chatSummaryMeta.summaryThroughMessageId}
					{modelSupportsTools}
					bind:enabledToolIds={model.enabledToolIds}
				/>
				{/key}
			</div>
		{/if}
	</main>
</div>
