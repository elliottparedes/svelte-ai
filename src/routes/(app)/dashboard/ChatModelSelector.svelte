<script lang="ts">
	import type { Model, ModelProviderGroup } from '$lib/types/dashboard';
	import { selectedModelLabel } from '$lib/client/filterModelPickerGroups';
	import ChatModelPickerPanel from './ChatModelPickerPanel.svelte';

	let {
		models,
		modelGroups,
		selectedModelId = $bindable(''),
		disabled = false
	} = $props<{
		models: Model[];
		modelGroups: ModelProviderGroup[];
		selectedModelId?: string;
		disabled?: boolean;
	}>();

	const grouped = $derived(
		modelGroups.length > 0 ? modelGroups : [{ label: 'Models', models }]
	);

	let open = $state(false);
	let searchQuery = $state('');
	let rootEl = $state<HTMLDivElement | null>(null);
	const triggerLabel = $derived(selectedModelLabel(models, grouped, selectedModelId));

	function onDocClick(e: MouseEvent) {
		const t = e.target as Node | null;
		if (rootEl && t && !rootEl.contains(t)) close();
	}

	function close() {
		open = false;
		searchQuery = '';
	}

	function openPicker(e: MouseEvent) {
		e.stopPropagation();
		if (disabled) return;
		open = !open;
		if (open) searchQuery = '';
	}

	function pick(id: string) {
		selectedModelId = id;
		close();
	}

	$effect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') close();
		};
		document.addEventListener('keydown', onKey);
		const t = window.setTimeout(() => document.addEventListener('click', onDocClick, true), 0);
		return () => {
			window.clearTimeout(t);
			document.removeEventListener('click', onDocClick, true);
			document.removeEventListener('keydown', onKey);
		};
	});
</script>

<div class="picker" bind:this={rootEl}>
	<button
		type="button"
		class="trigger"
		class:open
		{disabled}
		onclick={openPicker}
		aria-expanded={open}
		aria-haspopup="listbox"
		title={selectedModelId || 'Select model'}
	>
		<span class="trigger-label">{triggerLabel}</span>
		<span class="chev" aria-hidden="true">▾</span>
	</button>
	{#if open}
		<ChatModelPickerPanel groups={grouped} {selectedModelId} bind:searchQuery onPick={pick} />
	{/if}
</div>

<style>
	.picker {
		position: relative;
		flex: 1;
		min-width: 0;
		max-width: min(22rem, 100%);
	}
	.trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		width: 100%;
		background: #252537;
		color: #cdd6f4;
		border: 1px solid #313244;
		border-radius: 8px;
		padding: 0.35rem 0.55rem;
		font-size: 0.8rem;
		cursor: pointer;
		text-align: left;
	}
	.trigger:hover:not(:disabled) {
		border-color: #45475a;
	}
	.trigger.open {
		border-color: #89b4fa;
	}
	.trigger:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.trigger-label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
		min-width: 0;
	}
	.chev {
		flex-shrink: 0;
		font-size: 0.65rem;
		color: #a6adc8;
	}
</style>
