<script lang="ts">
	import type { ChatToolId } from '$lib/shared/chatToolSystemPrompt';

	let {
		id,
		size = 18,
		active = false
	} = $props<{ id: ChatToolId; size?: number; active?: boolean }>();
</script>

<svg
	class="ico"
	class:active
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.65"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{#if id === 'execute_javascript'}
		<path d="M9 7h4.5a2.5 2.5 0 0 1 0 5H11" />
		<path d="M11 12h2.5a2.5 2.5 0 0 1 0 5H9" />
		<path d="M7 7v7a3 3 0 0 0 3 3" />
	{:else if id === 'fetch_url'}
		<path d="M10 13a4.5 4.5 0 0 0 6.4 0l1.6-1.6a4.5 4.5 0 0 0-6.4-6.4L10 6" />
		<path d="M14 11a4.5 4.5 0 0 0-6.4 0L6 12.6a4.5 4.5 0 0 0 6.4 6.4L14 18" />
	{:else if id === 'web_search'}
		<circle cx="11" cy="11" r="6.5" />
		<line x1="16" y1="16" x2="20" y2="20" />
	{:else if id === 'image_search'}
		<rect x="4" y="5" width="16" height="14" rx="2" />
		<circle cx="9" cy="10" r="1.5" />
		<path d="M4 17l5.5-5.5L14 16l3-3 3 3" />
	{:else if id === 'generate_image'}
		<rect x="4" y="5" width="16" height="14" rx="2" />
		<circle cx="9" cy="10" r="1.5" />
		<path d="M4 17l5-5 4 4 3-3 4 4" />
	{/if}
</svg>

<style>
	.ico {
		display: block;
		flex-shrink: 0;
		color: #7f849c;
		transition: color 0.15s ease;
	}
	.ico.active {
		color: #89b4fa;
	}
</style>
