<script lang="ts">
	import MapRouteToolBody from './MapRouteToolBody.svelte';
	import { parseMapRouteToolResult } from '$lib/shared/mapRouteToolResult';

	let { name, result, mapActive = true } = $props<{
		name: string;
		result: string;
		mapActive?: boolean;
	}>();

	const mapRouteData = $derived(name === 'map_route' ? parseMapRouteToolResult(result) : null);
</script>

<div class="tool-section">
	<div class="tool-label">Result</div>
	{#if mapRouteData}
		<MapRouteToolBody data={mapRouteData} rawResult={result} {mapActive} />
	{:else}
		<pre class="tool-pre">{result}</pre>
	{/if}
</div>

<style>
	.tool-section { display: flex; flex-direction: column; gap: 0.25rem; }
	.tool-label {
		font-size: 0.65rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #6c7086;
	}
	.tool-pre {
		margin: 0;
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
		max-height: 13rem;
		overflow-y: auto;
	}
</style>
