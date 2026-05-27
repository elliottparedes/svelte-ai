import { tick } from 'svelte';

const NEAR_BOTTOM_PX = 80;

/** Auto-follow new content until the user scrolls away (works while streaming). */
export function useChatMessageScroll(scrollKey: () => string, conversationKey: () => string | undefined) {
	let scrollEl = $state<HTMLDivElement | null>(null);
	let listEl = $state<HTMLDivElement | null>(null);
	let stickToBottom = $state(true);
	let autoScrolling = false;
	let touchLastY = 0;

	function distFromBottom(el: HTMLDivElement) {
		return el.scrollHeight - el.scrollTop - el.clientHeight;
	}

	function scrollToBottom() {
		const el = scrollEl;
		if (!el) return;
		autoScrolling = true;
		el.scrollTop = el.scrollHeight;
		requestAnimationFrame(() => {
			autoScrolling = false;
		});
	}

	function detachFromBottom() {
		stickToBottom = false;
	}

	function onScroll() {
		const el = scrollEl;
		if (!el || autoScrolling) return;
		stickToBottom = distFromBottom(el) <= NEAR_BOTTOM_PX;
	}

	function onWheel(e: WheelEvent) {
		if (e.deltaY < 0) detachFromBottom();
	}

	function onTouchStart(e: TouchEvent) {
		touchLastY = e.touches[0]?.clientY ?? 0;
	}

	function onTouchMove(e: TouchEvent) {
		const y = e.touches[0]?.clientY ?? touchLastY;
		if (y > touchLastY + 2) detachFromBottom();
		touchLastY = y;
	}

	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'Home') detachFromBottom();
	}

	function jumpToBottom() {
		stickToBottom = true;
		scrollToBottom();
	}

	async function followIfStuck() {
		await tick();
		if (stickToBottom) scrollToBottom();
	}

	$effect(() => {
		conversationKey();
		stickToBottom = true;
		void followIfStuck();
	});

	$effect(() => {
		scrollKey();
		void followIfStuck();
	});

	$effect(() => {
		const el = listEl;
		if (!el) return;
		const ro = new ResizeObserver(() => {
			if (stickToBottom) scrollToBottom();
		});
		ro.observe(el);
		return () => ro.disconnect();
	});

	$effect(() => {
		const el = scrollEl;
		if (!el) return;
		el.addEventListener('scroll', onScroll, { passive: true });
		el.addEventListener('wheel', onWheel, { passive: true });
		el.addEventListener('touchstart', onTouchStart, { passive: true });
		el.addEventListener('touchmove', onTouchMove, { passive: true });
		el.addEventListener('keydown', onKeyDown);
		return () => {
			el.removeEventListener('scroll', onScroll);
			el.removeEventListener('wheel', onWheel);
			el.removeEventListener('touchstart', onTouchStart);
			el.removeEventListener('touchmove', onTouchMove);
			el.removeEventListener('keydown', onKeyDown);
		};
	});

	return {
		get scrollEl() {
			return scrollEl;
		},
		set scrollEl(v: HTMLDivElement | null) {
			scrollEl = v;
		},
		get listEl() {
			return listEl;
		},
		set listEl(v: HTMLDivElement | null) {
			listEl = v;
		},
		get stickToBottom() {
			return stickToBottom;
		},
		jumpToBottom
	};
}
