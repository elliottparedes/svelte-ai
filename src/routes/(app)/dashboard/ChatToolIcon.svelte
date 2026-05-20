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
	{#if id === 'calculator'}
		<rect x="5" y="3" width="14" height="18" rx="2" />
		<line x1="8" y1="7" x2="16" y2="7" />
		<circle cx="8.5" cy="11" r="0.75" fill="currentColor" stroke="none" />
		<circle cx="12" cy="11" r="0.75" fill="currentColor" stroke="none" />
		<circle cx="15.5" cy="11" r="0.75" fill="currentColor" stroke="none" />
		<circle cx="8.5" cy="14.5" r="0.75" fill="currentColor" stroke="none" />
		<circle cx="12" cy="14.5" r="0.75" fill="currentColor" stroke="none" />
		<circle cx="15.5" cy="14.5" r="0.75" fill="currentColor" stroke="none" />
		<line x1="8" y1="18" x2="16" y2="18" />
	{:else if id === 'datetime'}
		<circle cx="12" cy="12" r="8.5" />
		<polyline points="12 7 12 12 15.5 14" />
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
	{:else if id === 'map_route'}
		<path d="M12 21s5-4.5 5-9a5 5 0 1 0-10 0c0 4.5 5 9 5 9z" />
		<circle cx="12" cy="11" r="1.75" />
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
