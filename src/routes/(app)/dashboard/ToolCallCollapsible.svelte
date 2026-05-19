<script lang="ts">
	let {
		name,
		args = undefined,
		result = undefined
	} = $props<{
		name: string;
		args?: Record<string, unknown>;
		result?: string;
	}>();

	const title = $derived(name.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()));
	const pending = $derived(result === undefined);
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

<details class="tool-call">
	<summary class="tool-summary">
		<span class="tool-summary-chevron" aria-hidden="true"></span>
		<span class="tool-summary-badge">Tools</span>
		<span class="tool-summary-name">{title}</span>
		{#if pending}
			<span class="tool-summary-pending">Running…</span>
		{/if}
	</summary>
	<div class="tool-body">
		{#if argsText}
			<div class="tool-section">
				<div class="tool-label">Input</div>
				<pre class="tool-pre">{argsText}</pre>
			</div>
		{/if}
		{#if result !== undefined}
			<div class="tool-section">
				<div class="tool-label">Result</div>
				<pre class="tool-pre">{result}</pre>
			</div>
		{/if}
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
	.tool-body { padding: 0.5rem 0.65rem 0.65rem; display: flex; flex-direction: column; gap: 0.65rem; }
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
