<script lang="ts">
	import { marked } from 'marked';
	import hljs from 'highlight.js';
	import 'highlight.js/styles/github-dark.css';
	import { markdownBlobifyDataImages } from '$lib/client/markdownBlobifyDataImages';
	import ImageLightbox from './ImageLightbox.svelte';

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

<div class="markdown-body" use:enhanceCodeBlocks use:markdownBlobifyDataImages={html} use:interceptImageClicks>{@html html}</div>

{#if lightbox}
	<ImageLightbox
		src={lightbox.src}
		alt={lightbox.alt}
		sourceUrl={lightbox.sourceUrl}
		onclose={() => lightbox = null}
	/>
{/if}

<style>
	.markdown-body :global(p) {
		margin-bottom: 0.75rem;
		overflow-wrap: anywhere;
		word-break: break-word;
	}
	.markdown-body :global(p:last-child) {
		margin-bottom: 0;
	}
	.markdown-body :global(code) {
		background: #1e1e2e;
		padding: 0.2em 0.4em;
		border-radius: 3px;
		font-family: 'Fira Code', 'Consolas', monospace;
	}
	.markdown-body :global(pre) {
		background: #1e1e2e;
		padding: 1rem;
		border-radius: 8px;
		overflow-x: auto;
	}
	.markdown-body :global(pre code) {
		background: none;
		padding: 0;
	}
	.markdown-body :global(ul), .markdown-body :global(ol) {
		padding-left: 1.5rem;
		margin-bottom: 0.75rem;
	}
	.markdown-body :global(blockquote) {
		border-left: 3px solid #45475a;
		padding-left: 1rem;
		color: #a6adc8;
		margin-bottom: 0.75rem;
	}
	.markdown-body :global(a) {
		color: #89b4fa;
	}
	.markdown-body :global(img) {
		max-width: 200px;
		max-height: 200px;
		width: auto;
		height: auto;
		border-radius: 6px;
		object-fit: cover;
		display: inline-block;
		margin: 4px;
	}
	.markdown-body :global(p:has(img)) {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		align-items: flex-start;
	}
	.markdown-body :global(strong) {
		color: #f5c2e7;
	}
	.markdown-body :global(.code-copy-btn) {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: #313244;
		border: 1px solid #45475a;
		border-radius: 6px;
		color: #a6adc8;
		cursor: pointer;
		padding: 0.3rem;
		line-height: 1;
		opacity: 0;
		transition: opacity 0.2s, color 0.15s, background 0.15s;
	}
	.markdown-body :global(pre:hover .code-copy-btn) {
		opacity: 1;
	}
	.markdown-body :global(.code-copy-btn:hover) {
		color: #cdd6f4;
		background: #45475a;
	}
	.markdown-body :global(.code-copy-btn.copied) {
		color: #a6e3a1;
		border-color: #a6e3a1;
		opacity: 1;
	}
</style>
