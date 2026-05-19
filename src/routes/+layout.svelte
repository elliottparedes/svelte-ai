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
	}
	.root-shell {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
		overflow: hidden;
	}
	.root-content {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		width: 100%;
	}
</style>
