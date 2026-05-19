<script lang="ts">
	import AppAccountShell from '$lib/components/app/AppAccountShell.svelte';

	let { children } = $props();
</script>

<AppAccountShell>
	{@render children()}
</AppAccountShell>
