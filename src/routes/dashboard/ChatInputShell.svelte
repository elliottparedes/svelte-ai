<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		fileAcceptAttr,
		dragOver,
		isStreaming,
		onDragOver,
		onDragLeave,
		onDrop,
		onFileSelect,
		fileInput = $bindable<HTMLInputElement | null>(null),
		children
	} = $props<{
		fileAcceptAttr: string;
		dragOver: boolean;
		isStreaming: boolean;
		onDragOver: (e: DragEvent) => void;
		onDragLeave: () => void;
		onDrop: (e: DragEvent) => void;
		onFileSelect: (e: Event) => void;
		fileInput?: HTMLInputElement | null;
		children: Snippet;
	}>();
</script>

<input
	bind:this={fileInput}
	type="file"
	multiple
	accept={fileAcceptAttr}
	style="display: none;"
	onchange={onFileSelect}
/>

<div
	class="input-wrapper"
	class:drag-over={dragOver}
	class:sending={isStreaming}
	role="region"
	aria-label="Chat input"
	ondragover={onDragOver}
	ondragleave={onDragLeave}
	ondrop={onDrop}
>
	{@render children()}
</div>

<style>
	.input-wrapper {
		margin: 0 auto 2.5rem;
		max-width: 900px;
		width: 100%;
		background: #1e1e2e;
		border: 1px solid #313244;
		border-radius: 24px;
		padding: 1rem 1.25rem 0.75rem;
		transition: border-color 0.2s;
	}
	.input-wrapper.drag-over,
	.input-wrapper.sending {
		border-color: #89b4fa;
	}
	.input-wrapper.sending {
		box-shadow: 0 0 0 1px #89b4fa33;
	}
</style>
