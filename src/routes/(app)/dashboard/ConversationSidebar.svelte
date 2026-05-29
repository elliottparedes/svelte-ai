<script lang="ts">
	import SidebarNarrowBar from './SidebarNarrowBar.svelte';
	import SidebarProjectsSection from './SidebarProjectsSection.svelte';
	import SidebarChatsSection from './SidebarChatsSection.svelte';
	import SidebarUserFooter from './SidebarUserFooter.svelte';
	import type { Conversation, DashboardUser, Project } from '$lib/types/dashboard';
	import type { ChatQuotaView } from '$lib/types/app';

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
		chatQuota = null,
		onLogout,
		collapsed = $bindable(false),
		isMobile = false
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
		chatQuota?: ChatQuotaView | null;
		onLogout: () => void;
		collapsed?: boolean;
		isMobile?: boolean;
	}>();
</script>

<aside class="sidebar" class:collapsed class:mobile={isMobile}>
	{#if collapsed}
		{#if !isMobile}
			<SidebarNarrowBar {onNewChat} onExpand={() => (collapsed = false)} />
		{/if}
	{:else}
		<div class="sidebar-inner">
			<div class="header">
				<div class="brand">
					<img src="/logo.svg" alt="" class="logo-mark" width="28" height="28" />
					<span class="logo">Inkstream</span>
				</div>
				<button
					class="menu-btn"
					onclick={() => (collapsed = true)}
					title={isMobile ? 'Close menu' : 'Collapse menu'}
					aria-label={isMobile ? 'Close menu' : 'Collapse menu'}
				>
					{isMobile ? '✕' : '☰'}
				</button>
			</div>
			<button class="new-chat" onclick={() => onNewChat()}>
				<span>✚</span>
				<span>New chat</span>
			</button>
			<div class="sidebar-scroll">
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
			</div>
			{#if user}
				<SidebarUserFooter {user} {chatQuota} onLogout={onLogout} />
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
		min-height: 0;
		overflow: hidden;
		padding: 0.75rem;
	}
	.sidebar-scroll {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		overflow-x: hidden;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: thin;
		scrollbar-color: #45475a transparent;
	}
	.sidebar-scroll::-webkit-scrollbar {
		width: 4px;
	}
	.sidebar-scroll::-webkit-scrollbar-track {
		background: transparent;
	}
	.sidebar-scroll::-webkit-scrollbar-thumb {
		background: #313244;
		border-radius: 999px;
	}
	.sidebar-scroll::-webkit-scrollbar-thumb:hover {
		background: #45475a;
	}
	.header,
	.new-chat {
		flex-shrink: 0;
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
