<script lang="ts">
	let { title, subtitle = '' } = $props<{ title: string; subtitle?: string }>();
</script>

<header class="page-header">
	<h1 class="page-title">{title}</h1>
	{#if subtitle}
		<p class="page-subtitle">{subtitle}</p>
	{/if}
</header>

<style>
	.page-header {
		margin-bottom: 1.5rem;
	}
	.page-title {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: #cdd6f4;
		line-height: 1.25;
	}
	.page-subtitle {
		margin: 0.35rem 0 0;
		font-size: 0.9rem;
		color: #a6adc8;
	}
</style>
