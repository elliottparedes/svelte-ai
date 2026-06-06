<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<title>Inkstream</title>
</svelte:head>

<div class="root-shell">
	<div class="root-content">
		{@render children()}
	</div>
</div>

<style>
	:global(html),
	:global(body) {
		height: 100%;
		margin: 0;
		overflow: hidden;
		background: #181825;
	}
	:global(html) {
		min-height: -webkit-fill-available;
	}
	.root-shell {
		display: flex;
		flex-direction: column;
		height: 100%;
		height: 100dvh;
		min-height: 0;
		overflow: hidden;
		background: #181825;
	}
	.root-content {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		width: 100%;
	}
</style>
