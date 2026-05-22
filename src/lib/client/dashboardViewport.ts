import { browser } from '$app/environment';

/** Breakpoint for dashboard drawer / compact chrome */
export const DASHBOARD_MOBILE_MAX_WIDTH = 768;

export function dashboardMobileMediaQuery(): string {
	return `(max-width: ${DASHBOARD_MOBILE_MAX_WIDTH}px)`;
}

export function getDashboardIsMobile(): boolean {
	if (!browser) return false;
	return window.matchMedia(dashboardMobileMediaQuery()).matches;
}
