<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		body,
		onAllOn,
		onNoSearch,
		onAllOff
	} = $props<{
		body: Snippet;
		onAllOn: () => void;
		onNoSearch: () => void;
		onAllOff: () => void;
	}>();
</script>

<div class="popover" role="dialog" aria-label="Chat tools">
	<div class="head">
		<span class="head-t">Model tools</span>
		<span class="badge">Context</span>
	</div>
	<div class="body">{@render body()}</div>
	<div class="foot">
		<button type="button" class="link" onclick={onAllOn}>All on</button>
		<span class="sep">·</span>
		<button type="button" class="link" onclick={onNoSearch}>No search</button>
		<span class="sep">·</span>
		<button type="button" class="link" onclick={onAllOff}>All off</button>
	</div>
</div>

<style>
	.popover {
		position: absolute;
		bottom: calc(100% + 10px);
		left: 0;
		min-width: min(20rem, 92vw);
		max-width: 22rem;
		background: #11111b;
		border: 1px solid #313244;
		border-radius: 14px;
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.55);
		z-index: 40;
		overflow: hidden;
	}
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.65rem 0.85rem;
		border-bottom: 1px solid #313244;
	}
	.head-t {
		font-size: 0.8rem;
		font-weight: 600;
		color: #cdd6f4;
	}
	.badge {
		padding: 0.15rem 0.45rem;
		border-radius: 999px;
		font-size: 0.62rem;
		font-weight: 700;
		background: #89b4fa;
		color: #11111b;
	}
	.body {
		padding: 0.35rem;
		max-height: min(70vh, 22rem);
		overflow-y: auto;
	}
	.foot {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.2rem;
		padding: 0.45rem 0.55rem 0.55rem;
		border-top: 1px solid #313244;
		background: #181825;
	}
	.link {
		border: none;
		background: none;
		color: #89b4fa;
		font-size: 0.68rem;
		cursor: pointer;
		padding: 0.12rem 0.2rem;
	}
	.link:hover {
		text-decoration: underline;
	}
	.sep {
		color: #45475a;
		font-size: 0.75rem;
		user-select: none;
	}
</style>
