<script lang="ts">
	import ChatCollapsibleDetails from './ChatCollapsibleDetails.svelte';
	import ToolCallResultSection from './ToolCallResultSection.svelte';

	let {
		name,
		args = undefined,
		result = undefined
	} = $props<{
		name: string;
		args?: Record<string, unknown>;
		result?: string;
	}>();

	let open = $state(false);

	const title = $derived(name.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()));
	const pending = $derived(result === undefined ? 'Running…' : undefined);

	function previewArgs(a: Record<string, unknown> | undefined): string {
		if (!a || Object.keys(a).length === 0) return '';
		try {
			const s = JSON.stringify(a, null, 2);
			return s.length > 600 ? s.slice(0, 600) + '\n…' : s;
		} catch {
			return '';
		}
	}
	const argsText = $derived(previewArgs(args));
</script>

<ChatCollapsibleDetails
	badge="Tools"
	{title}
	{pending}
	fullWidth={name === 'map_route'}
	bind:open
>
	{#snippet body()}
		{#if argsText}
			<div class="tool-section">
				<div class="tool-label">Input</div>
				<pre class="tool-pre">{argsText}</pre>
			</div>
		{/if}
		{#if result !== undefined}
			<ToolCallResultSection {name} {result} mapActive={open} />
		{/if}
	{/snippet}
</ChatCollapsibleDetails>

<style>
	.tool-section {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
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
