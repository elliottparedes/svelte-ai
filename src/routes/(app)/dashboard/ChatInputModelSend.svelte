<script lang="ts">
	import ModelSelector from './ModelSelector.svelte';
	import type { Model, ModelProviderGroup } from '$lib/types/dashboard';

	let {
		models,
		modelGroups,
		selectedModel = $bindable(''),
		modelLocked = false,
		value,
		attachmentsLen,
		isStreaming,
		onSend
	} = $props<{
		models: Model[];
		modelGroups: ModelProviderGroup[];
		selectedModel?: string;
		modelLocked?: boolean;
		value: string;
		attachmentsLen: number;
		isStreaming: boolean;
		onSend: () => void;
	}>();

	let dropdownOpen = $state(false);
	let dropdownEl: HTMLDivElement | null = $state(null);

	$effect(() => {
		if (modelLocked) dropdownOpen = false;
	});

	$effect(() => {
		if (!dropdownOpen) return;
		function onClick(e: MouseEvent) {
			if (dropdownEl && !dropdownEl.contains(e.target as Node)) dropdownOpen = false;
		}
		document.addEventListener('click', onClick);
		return () => document.removeEventListener('click', onClick);
	});

	function selectModel(id: string) {
		if (modelLocked) return;
		selectedModel = id;
		dropdownOpen = false;
	}

	const currentName = $derived(models.find((m: Model) => m.id === selectedModel)?.name ?? 'Select model');
	const shortName = $derived(currentName.split('/').pop() ?? currentName);
</script>

<div class="footer-right">
	<div class="dropdown is-up" class:is-active={dropdownOpen} bind:this={dropdownEl}>
		<div class="dropdown-trigger">
			<button
				type="button"
				class="model-btn"
				class:locked={modelLocked}
				aria-haspopup={!modelLocked}
				aria-disabled={modelLocked}
				disabled={modelLocked}
				title={modelLocked ? 'Model cannot be changed after the first message' : undefined}
				onclick={() => !modelLocked && (dropdownOpen = !dropdownOpen)}
			>
				<span>{shortName}</span>
				{#if !modelLocked}<span class="chevron"></span>{/if}
			</button>
		</div>
		<div class="dropdown-menu" role="menu" style="min-width: 280px;">
			<div class="dropdown-content">
				<ModelSelector {modelGroups} selected={selectedModel} onChange={selectModel} />
			</div>
		</div>
	</div>
	<button
		type="button"
		class="send-btn"
		onclick={onSend}
		disabled={isStreaming || (!value.trim() && attachmentsLen === 0)}
	>
		<span>➤</span>
	</button>
</div>

<style>
	.footer-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.model-btn {
		background: none;
		border: 1px solid #313244;
		border-radius: 16px;
		color: #a6adc8;
		font-size: 0.8rem;
		padding: 0.3rem 0.75rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}
	.model-btn:hover:not(:disabled) {
		color: #cdd6f4;
		border-color: #45475a;
	}
	.model-btn:disabled,
	.model-btn.locked {
		opacity: 0.85;
		cursor: default;
	}
	.chevron {
		font-size: 0.7rem;
	}
	.send-btn {
		background: #89b4fa;
		border: none;
		border-radius: 50%;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: #1e1e2e;
		font-size: 1rem;
	}
	.send-btn:disabled {
		opacity: 0.3;
		cursor: default;
	}
	:global(.dropdown.is-up .dropdown-menu) {
		top: auto;
		bottom: 100%;
		margin-bottom: 8px;
	}
	:global(.dropdown-content) {
		background: #252537;
		border: 1px solid #313244;
		border-radius: 12px;
		padding: 0.25rem;
		color: #cdd6f4;
		overflow: visible;
		max-width: min(100vw - 2rem, 420px);
	}
</style>
