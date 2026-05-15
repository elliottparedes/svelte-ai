<script lang="ts">
	import { onMount } from 'svelte';

	let {
		value = $bindable(''),
		submitRename,
		cancelRename
	} = $props<{
		value?: string;
		submitRename: (e: Event) => void;
		cancelRename: (e: Event) => void;
	}>();

	let inputEl: HTMLInputElement | null = $state(null);

	onMount(() => queueMicrotask(() => inputEl?.focus()));
</script>

<div class="conv-item editing">
	<input
		bind:this={inputEl}
		class="rename-input"
		type="text"
		bind:value
		onkeydown={(e: KeyboardEvent) => {
			if (e.key === 'Enter') submitRename(e);
			if (e.key === 'Escape') cancelRename(e);
		}}
		onblur={submitRename}
	/>
</div>

<style>
	.conv-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-radius: 8px;
		transition: background 0.15s;
	}
	.conv-item.editing {
		padding: 0.25rem 0.5rem;
	}
	.rename-input {
		width: 100%;
		background: #181825;
		border: 1px solid #89b4fa;
		border-radius: 6px;
		color: #cdd6f4;
		padding: 0.25rem 0.5rem;
		font-size: 0.85rem;
		outline: none;
	}
</style>
