import { browser } from '$app/environment';
import { dashboardMobileMediaQuery } from '$lib/client/dashboardViewport';

export function useDashboardViewport() {
	let isMobile = $state(false);

	$effect(() => {
		if (!browser) return;
		const mq = window.matchMedia(dashboardMobileMediaQuery());
		const sync = () => {
			isMobile = mq.matches;
		};
		sync();
		mq.addEventListener('change', sync);
		return () => mq.removeEventListener('change', sync);
	});

	return {
		get isMobile() {
			return isMobile;
		}
	};
}
