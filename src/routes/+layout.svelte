<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<title>AI Studio</title>
</svelte:head>

<div class="root-shell">
	{@render children()}
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
</style>
