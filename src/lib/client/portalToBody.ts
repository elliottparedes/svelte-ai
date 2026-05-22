import type { Action } from 'svelte/action';

/** Move an element to document.body so `position: fixed` is relative to the viewport. */
export const portalToBody: Action<HTMLElement> = (node) => {
	document.body.appendChild(node);
	return {
		destroy() {
			node.remove();
		}
	};
};
