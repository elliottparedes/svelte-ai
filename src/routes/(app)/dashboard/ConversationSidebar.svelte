<script lang="ts">
	import SidebarNarrowBar from './SidebarNarrowBar.svelte';
	import SidebarProjectsSection from './SidebarProjectsSection.svelte';
	import SidebarChatsSection from './SidebarChatsSection.svelte';
	import SidebarUserFooter from './SidebarUserFooter.svelte';
	import type { Conversation, DashboardUser, Project } from '$lib/types/dashboard';

	let {
		conversations,
		projects,
		activeId,
		activeProjectId,
		onSelect,
		onSelectProject,
		onNewChat,
		onDelete,
		onRename,
		streamingConversationIds,
		user,
		onLogout,
		collapsed = $bindable(false)
	} = $props<{
		conversations: Conversation[];
		projects: Project[];
		activeId: string | null;
		activeProjectId: string | null;
		onSelect: (id: string) => void;
		onSelectProject: (id: string) => void;
		onNewChat: () => void;
		onDelete: (id: string) => void;
		onRename: (id: string, title: string) => void;
		streamingConversationIds: ReadonlySet<string>;
		user: DashboardUser | null;
		onLogout: () => void;
		collapsed?: boolean;
	}>();
</script>

<aside class="sidebar" class:collapsed>
	{#if collapsed}
		<SidebarNarrowBar {onNewChat} onExpand={() => (collapsed = false)} />
	{:else}
		<div class="sidebar-inner">
			<div class="header">
				<div class="brand">
					<img src="/logo.svg" alt="" class="logo-mark" width="28" height="28" />
					<span class="logo">AI Studio</span>
				</div>
				<button class="menu-btn" onclick={() => (collapsed = true)} title="Close menu">☰</button>
			</div>
			<button class="new-chat" onclick={() => onNewChat()}>
				<span>✚</span>
				<span>New chat</span>
			</button>
			<SidebarProjectsSection {projects} {activeProjectId} onSelectProject={onSelectProject} />
			<SidebarChatsSection
				{conversations}
				{projects}
				{activeId}
				{activeProjectId}
				{streamingConversationIds}
				{onSelect}
				{onDelete}
				{onRename}
			/>
			{#if user}
				<SidebarUserFooter {user} onLogout={onLogout} />
			{/if}
		</div>
	{/if}
</aside>

<style>
	.sidebar {
		position: relative;
		z-index: 5;
		background: #1e1e2e;
		color: #cdd6f4;
		transition: width 0.35s cubic-bezier(0.25, 0.1, 0.25, 1);
		width: 260px;
		min-width: 260px;
		height: 100%;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	.sidebar.collapsed {
		width: 48px;
		min-width: 48px;
	}
	.sidebar-inner {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 0.75rem;
	}
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		margin-bottom: 1rem;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
	}
	.logo-mark {
		flex-shrink: 0;
		display: block;
	}
	.logo {
		font-weight: 700;
		font-size: 1.1rem;
		color: #cdd6f4;
	}
	.menu-btn {
		background: none;
		border: none;
		color: #a6adc8;
		cursor: pointer;
		font-size: 1.1rem;
		padding: 0.25rem;
		border-radius: 6px;
		transition:
			background 0.15s,
			color 0.15s;
	}
	.menu-btn:hover {
		background: #313244;
		color: #cdd6f4;
	}
	.new-chat {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: #313244;
		color: #cdd6f4;
		border: 1px solid #45475a;
		border-radius: 10px;
		padding: 0.6rem 0.75rem;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background 0.15s;
		margin-bottom: 1rem;
	}
	.new-chat:hover {
		background: #45475a;
	}
</style>
