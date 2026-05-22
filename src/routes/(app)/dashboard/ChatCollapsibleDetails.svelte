<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		badge,
		title = '',
		pending = undefined,
		fullWidth = false,
		open = $bindable(false),
		body
	} = $props<{
		badge: string;
		title?: string;
		pending?: string;
		fullWidth?: boolean;
		open?: boolean;
		body: Snippet;
	}>();
</script>

<details class="tool-call" class:tool-call--map={fullWidth} bind:open>
	<summary class="tool-summary">
		<span class="tool-summary-chevron" aria-hidden="true"></span>
		<span class="tool-summary-badge">{badge}</span>
		{#if title}
			<span class="tool-summary-name">{title}</span>
		{/if}
		{#if pending}
			<span class="tool-summary-pending">{pending}</span>
		{/if}
	</summary>
	<div class="tool-body">
		{@render body()}
	</div>
</details>

<style>
	.tool-call {
		width: fit-content;
		max-width: min(100%, 42rem);
		border-radius: 10px;
		border: 1px solid #313244;
		background: #11111b;
		overflow: hidden;
		font-size: 0.82rem;
	}
	.tool-call--map {
		width: 100%;
	}
	.tool-summary {
		list-style: none;
		display: flex;
		align-items: center;
		gap: 0.45rem;
		flex-wrap: wrap;
		padding: 0.45rem 0.65rem;
		cursor: pointer;
		color: #7f849c;
		border-bottom: 1px solid transparent;
		user-select: none;
	}
	.tool-summary::-webkit-details-marker {
		display: none;
	}
	.tool-summary:hover {
		background: #1e1e2e;
		color: #a6adc8;
	}
	.tool-call[open] .tool-summary {
		border-bottom-color: #313244;
		color: #a6adc8;
	}
	.tool-summary-chevron {
		display: inline-block;
		width: 0.35rem;
		height: 0.35rem;
		border-right: 2px solid currentColor;
		border-bottom: 2px solid currentColor;
		transform: rotate(-45deg);
		transition: transform 0.15s ease;
		margin-right: 0.1rem;
		opacity: 0.7;
	}
	.tool-call[open] .tool-summary-chevron {
		transform: rotate(45deg);
	}
	.tool-summary-badge {
		font-size: 0.65rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #6c7086;
		background: #252537;
		padding: 0.12rem 0.38rem;
		border-radius: 4px;
	}
	.tool-summary-name {
		font-weight: 500;
		color: #cdd6f4;
	}
	.tool-summary-pending {
		font-size: 0.72rem;
		color: #89b4fa;
		opacity: 0.9;
	}
	.tool-body {
		padding: 0.5rem 0.65rem 0.65rem;
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}
</style>
