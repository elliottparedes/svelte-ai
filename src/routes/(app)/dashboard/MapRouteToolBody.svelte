<script lang="ts">
	import MapRoutePreview from './MapRoutePreview.svelte';
	import type { MapRouteToolPayload } from '$lib/shared/mapRoute.types';

	let { data, rawResult = '', mapActive = true } = $props<{
		data: MapRouteToolPayload;
		rawResult?: string;
		mapActive?: boolean;
	}>();

	const modeLabel = $derived(
		data.mode === 'walking' ? 'Walking' : data.mode === 'cycling' ? 'Cycling' : 'Driving'
	);
</script>

<div class="map-route-body">
	<p class="summary">
		<span class="mode">{modeLabel}</span>
		<span>{data.route.distanceKm} km</span>
		<span class="dot">·</span>
		<span>{data.route.durationMinutes} min</span>
	</p>
	<p class="labels">
		<span class="from" title={data.origin.label}>A: {data.origin.label}</span>
		<span class="arrow">→</span>
		<span class="to" title={data.destination.label}>B: {data.destination.label}</span>
	</p>
	{#if mapActive}
		<MapRoutePreview {data} />
	{:else}
		<div class="map-placeholder" aria-hidden="true">Map loads when expanded</div>
	{/if}
	<details class="json-fallback">
		<summary>Raw JSON</summary>
		<pre class="tool-pre">{rawResult}</pre>
	</details>
</div>

<style>
	.map-route-body {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
		min-width: min(100%, 36rem);
	}
	.summary {
		margin: 0;
		font-size: 0.82rem;
		color: #cdd6f4;
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		align-items: center;
	}
	.mode {
		font-size: 0.65rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #89b4fa;
		background: #252537;
		padding: 0.12rem 0.38rem;
		border-radius: 4px;
	}
	.dot {
		color: #6c7086;
	}
	.labels {
		margin: 0;
		font-size: 0.74rem;
		color: #a6adc8;
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		align-items: center;
	}
	.from,
	.to {
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.arrow {
		color: #6c7086;
	}
	.map-placeholder {
		width: 100%;
		height: 280px;
		border-radius: 8px;
		border: 1px dashed #313244;
		background: #11111b;
		color: #6c7086;
		font-size: 0.74rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.json-fallback summary {
		font-size: 0.65rem;
		color: #6c7086;
		cursor: pointer;
		user-select: none;
	}
	.tool-pre {
		margin: 0.35rem 0 0;
		padding: 0.45rem 0.55rem;
		border-radius: 6px;
		background: #181825;
		border: 1px solid #252537;
		color: #a6adc8;
		font-family: 'Fira Code', 'Consolas', monospace;
		font-size: 0.74rem;
		line-height: 1.45;
		white-space: pre-wrap;
		word-break: break-word;
		max-height: 8rem;
		overflow-y: auto;
	}
</style>
