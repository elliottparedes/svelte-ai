<script lang="ts">
	let { content, streaming = false } = $props<{ content: string; streaming?: boolean }>();

	let expanded = $state(false);

	$effect(() => {
		if (streaming) expanded = true;
	});
</script>

<div class="reasoning-wrap">
	<button
		type="button"
		class="reasoning-toggle"
		aria-expanded={expanded}
		onclick={() => (expanded = !expanded)}
	>
		<svg
			class="chevron"
			class:open={expanded}
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<polyline points="9 18 15 12 9 6"></polyline>
		</svg>
		<span class="reasoning-label">
			{streaming ? 'Thinking…' : 'Thinking'}
		</span>
	</button>
	{#if expanded}
		<pre class="reasoning-body">{content}</pre>
	{/if}
</div>

<style>
	.reasoning-wrap {
		margin-bottom: 0.75rem;
	}
	.reasoning-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		background: #252537;
		border: 1px solid #313244;
		border-radius: 8px;
		color: #a6adc8;
		font-size: 0.8rem;
		padding: 0.35rem 0.6rem;
		cursor: pointer;
		transition: border-color 0.15s, color 0.15s;
	}
	.reasoning-toggle:hover {
		border-color: #45475a;
		color: #cdd6f4;
	}
	.chevron {
		flex-shrink: 0;
		transition: transform 0.15s;
	}
	.chevron.open {
		transform: rotate(90deg);
	}
	.reasoning-body {
		margin: 0.5rem 0 0;
		padding: 0.75rem 1rem;
		background: #1e1e2e;
		border: 1px solid #313244;
		border-radius: 8px;
		color: #a6adc8;
		font-size: 0.82rem;
		line-height: 1.55;
		white-space: pre-wrap;
		word-break: break-word;
		max-height: 320px;
		overflow-y: auto;
		font-family: inherit;
	}
</style>
