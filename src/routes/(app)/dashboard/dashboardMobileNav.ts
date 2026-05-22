import type { createDashboardPageModel } from './dashboardPageModel.svelte.js';

type DashboardModel = ReturnType<typeof createDashboardPageModel>;

export function createDashboardMobileNav(
	viewport: { isMobile: boolean },
	model: DashboardModel
) {
	function closeMobileSidebar() {
		if (viewport.isMobile) model.sidebarCollapsed = true;
	}

	function openMobileSidebar() {
		model.sidebarCollapsed = false;
	}

	return {
		closeMobileSidebar,
		openMobileSidebar,
		onSelectConversation: (id: string) => {
			void model.loadMessages(id);
			closeMobileSidebar();
		},
		onSelectProject: (id: string) => {
			void model.loadProject(id);
			closeMobileSidebar();
		},
		onNewChat: () => {
			model.startNewChat();
			closeMobileSidebar();
		},
		onProjectBack: (id: string) => {
			void model.loadProject(id);
			closeMobileSidebar();
		},
		onOpenProjectConversation: (id: string) => {
			void model.loadMessages(id);
			closeMobileSidebar();
		}
	};
}
