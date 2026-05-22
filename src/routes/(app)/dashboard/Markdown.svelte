<script lang="ts">
	import { marked } from 'marked';
	import hljs from 'highlight.js';
	import 'highlight.js/styles/github-dark.css';
	import './markdownBody.css';
	import { markdownBlobifyDataImages } from '$lib/client/markdownBlobifyDataImages';
	import ImageLightbox from './ImageLightbox.svelte';
	import { portalToBody } from '$lib/client/portalToBody';

	let { content } = $props<{ content: string }>();

	const html = $derived(marked.parse(content ?? '') as string);

	type LightboxState = { src: string; alt: string; sourceUrl?: string } | null;
	let lightbox = $state<LightboxState>(null);

	function interceptImageClicks(node: HTMLElement) {
		function onClick(e: MouseEvent) {
			const target = e.target as HTMLElement;
			const img = target.closest('a')?.querySelector('img') ?? (target.tagName === 'IMG' ? target as HTMLImageElement : null);
			if (!img) return;
			const anchor = img.closest('a') as HTMLAnchorElement | null;
			e.preventDefault();
			lightbox = {
				src: img.src,
				alt: img.alt || '',
				sourceUrl: anchor?.href ?? undefined
			};
		}
		node.addEventListener('click', onClick);
		return { destroy() { node.removeEventListener('click', onClick); } };
	}

	function enhanceCodeBlocks(node: HTMLElement) {
		function addButtonsAndHighlight() {
			node.querySelectorAll('pre code').forEach((code) => {
				hljs.highlightElement(code as HTMLElement);
			});

			node.querySelectorAll('pre').forEach((pre) => {
				if (pre.querySelector('.code-copy-btn')) return;
				const code = pre.querySelector('code');
				if (!code) return;

				const text = code.textContent ?? '';
				pre.style.position = 'relative';

				const btn = document.createElement('button');
				btn.type = 'button';
				btn.className = 'code-copy-btn';
				btn.title = 'Copy';
				btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

				btn.addEventListener('click', async () => {
					try {
						await navigator.clipboard.writeText(text);
						btn.classList.add('copied');
						btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
						setTimeout(() => {
							btn.classList.remove('copied');
							btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
						}, 1500);
					} catch {
						// ignore
					}
				});

				pre.appendChild(btn);
			});
		}

		addButtonsAndHighlight();

		const observer = new MutationObserver(addButtonsAndHighlight);
		observer.observe(node, { childList: true, subtree: true });

		return {
			destroy() {
				observer.disconnect();
			}
		};
	}
</script>

<style>
	.lightbox-portal {
		display: contents;
	}
</style>

<div class="inkstream-markdown" use:enhanceCodeBlocks use:markdownBlobifyDataImages={html} use:interceptImageClicks>{@html html}</div>

{#if lightbox}
	<div class="lightbox-portal" use:portalToBody>
		<ImageLightbox
			src={lightbox.src}
			alt={lightbox.alt}
			sourceUrl={lightbox.sourceUrl}
			onclose={() => (lightbox = null)}
		/>
	</div>
{/if}
