<script lang="ts">
	import { onMount } from 'svelte';
	import { cleanupDevServiceWorkers } from '$lib/client/devServiceWorkerCleanup';
	let { children } = $props();

	onMount(() => {
		void cleanupDevServiceWorkers().then((changed) => {
			if (!changed) return;
			const url = new URL(window.location.href);
			if (url.searchParams.get('sw-reset') === '1') return;
			url.searchParams.set('sw-reset', '1');
			window.location.replace(url.toString());
		});
	});
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
		color-scheme: dark;
	}
	:global(html) {
		min-height: -webkit-fill-available;
	}
	:global(body) {
		padding-bottom: env(safe-area-inset-bottom, 0px);
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
