import type { Action } from 'svelte/action';
import { tick } from 'svelte';

/** Avoid browser caps on huge `data:` URLs in `<img src>` (e.g. Chrome ~2MB). */
export function dataUrlToObjectUrl(dataUrl: string): string {
	const comma = dataUrl.indexOf(',');
	if (comma < 0) throw new Error('Invalid data URL');
	const meta = dataUrl.slice(0, comma);
	const body = dataUrl.slice(comma + 1);
	const mimeMatch = /^data:([^;]+)/i.exec(meta);
	const mime = mimeMatch?.[1]?.trim() || 'application/octet-stream';
	const isBase64 = /;base64/i.test(meta);
	const bytes = isBase64
		? Uint8Array.from(atob(body.replace(/\s/g, '')), (c) => c.charCodeAt(0))
		: new TextEncoder().encode(decodeURIComponent(body));
	return URL.createObjectURL(new Blob([bytes], { type: mime }));
}

/** After `{@html markdown}`, swap `data:` img sources for blob URLs and revoke on teardown. */
export const markdownBlobifyDataImages: Action<HTMLElement, string> = (node) => {
	const registry: string[] = [];
	let generation = 0;

	function sweepSync() {
		for (const u of registry) URL.revokeObjectURL(u);
		registry.length = 0;
		for (const img of node.querySelectorAll<HTMLImageElement>('img[src^="data:"]')) {
			const raw = img.getAttribute('src');
			if (!raw) continue;
			try {
				const u = dataUrlToObjectUrl(raw);
				registry.push(u);
				img.src = u;
			} catch {
				// keep original data URL
			}
		}
	}

	async function scheduleSweep() {
		const id = ++generation;
		await tick();
		if (id !== generation) return;
		await new Promise<void>((r) => requestAnimationFrame(() => r()));
		if (id !== generation) return;
		sweepSync();
	}

	void scheduleSweep();

	return {
		update() {
			void scheduleSweep();
		},
		destroy() {
			generation += 1;
			for (const u of registry) URL.revokeObjectURL(u);
		}
	};
};
