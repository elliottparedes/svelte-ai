/** Hide markdown images that fail to load (hotlink blocks, expired CDN URLs). */
export function markdownHideBrokenImages(node: HTMLElement) {
	function onError(e: Event) {
		const img = e.target;
		if (!(img instanceof HTMLImageElement)) return;
		const link = img.closest('a');
		const hide = link ?? img;
		hide.style.display = 'none';
	}

	node.addEventListener('error', onError, true);
	return {
		destroy() {
			node.removeEventListener('error', onError, true);
		}
	};
}
