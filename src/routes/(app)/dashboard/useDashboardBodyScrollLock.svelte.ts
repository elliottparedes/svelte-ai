import { browser } from '$app/environment';

/** Prevent background scroll when the mobile drawer is open */
export function useDashboardBodyScrollLock(locked: () => boolean) {
	$effect(() => {
		if (!browser) return;
		document.body.style.overflow = locked() ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	});
}
