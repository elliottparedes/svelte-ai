<script lang="ts">
	import { parseImageGenerationToolResult } from '$lib/shared/imageGenerationToolResult';

	let { result } = $props<{ result: string }>();

	const data = $derived(parseImageGenerationToolResult(result));
</script>

{#if data?.ok}
	<p class="ok">Image generated — shown in the chat above.</p>
{:else if data && !data.ok}
	<p class="err">{data.error ?? 'Image generation failed'}</p>
{/if}

<style>
	.ok {
		margin: 0;
		font-size: 0.8rem;
		color: #a6e3a1;
	}
	.err {
		color: #f38ba8;
		font-size: 0.8rem;
		margin: 0;
	}
</style>
