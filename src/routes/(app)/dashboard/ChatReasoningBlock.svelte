<script lang="ts">
	import ChatCollapsibleDetails from './ChatCollapsibleDetails.svelte';

	let { content, streaming = false } = $props<{ content: string; streaming?: boolean }>();

	/** Collapsed by default; user expands manually. */
	let expanded = $state(false);
</script>

<div class="reasoning-wrap">
	<ChatCollapsibleDetails
		badge="Thinking"
		pending={streaming ? 'Thinking…' : undefined}
		bind:open={expanded}
	>
		{#snippet body()}
			<pre class="reasoning-pre">{content}</pre>
		{/snippet}
	</ChatCollapsibleDetails>
</div>

<style>
	.reasoning-wrap {
		margin-bottom: 0.75rem;
	}
	.reasoning-pre {
		margin: 0;
		padding: 0.45rem 0.55rem;
		border-radius: 6px;
		background: #181825;
		border: 1px solid #252537;
		color: #a6adc8;
		font-family: inherit;
		font-size: 0.74rem;
		line-height: 1.45;
		white-space: pre-wrap;
		word-break: break-word;
		max-height: 13rem;
		overflow-y: auto;
	}
</style>
