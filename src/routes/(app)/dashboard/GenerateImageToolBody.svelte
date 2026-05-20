<script lang="ts">
	import { parseImageGenerationToolResult } from '$lib/shared/imageGenerationToolResult';

	let { result } = $props<{ result: string }>();

	const data = $derived(parseImageGenerationToolResult(result));
</script>

{#if data?.ok && data.imageUrl}
	<figure class="gen-inline">
		<img src={data.imageUrl} alt={data.prompt} loading="lazy" />
	</figure>
{:else if data && !data.ok}
	<p class="err">{data.error ?? 'Image generation failed'}</p>
{/if}

<style>
	.gen-inline {
		margin: 0;
		max-width: 100%;
	}
	.gen-inline img {
		max-width: 100%;
		border-radius: 8px;
		border: 1px solid #313244;
	}
	.err {
		color: #f38ba8;
		font-size: 0.8rem;
		margin: 0;
	}
</style>
