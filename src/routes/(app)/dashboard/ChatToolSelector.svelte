<script lang="ts">
	import { ALL_CHAT_TOOL_IDS, DEFAULT_CHAT_TOOL_IDS, type ChatToolId } from '$lib/shared/chatToolSystemPrompt';
	import { TOOL_ROWS, applyPresetSelect, toggleToolId } from './dashboardChatToolSelector.js';
	import ChatToolToggleRow from './ChatToolToggleRow.svelte';
	import ChatToolsMenuPopover from './ChatToolsMenuPopover.svelte';

	let {
		enabledIds = $bindable<ChatToolId[]>([...DEFAULT_CHAT_TOOL_IDS]),
		disabled = false
	} = $props<{
		enabledIds?: ChatToolId[];
		disabled?: boolean;
	}>();

	let open = $state(false);
	let rootEl = $state<HTMLDivElement | null>(null);

	function onDocClick(e: MouseEvent) {
		const t = e.target as Node | null;
		if (rootEl && t && !rootEl.contains(t)) open = false;
	}

	$effect(() => {
		if (!open) return;
		const id = window.setTimeout(() => document.addEventListener('click', onDocClick, true), 0);
		return () => {
			window.clearTimeout(id);
			document.removeEventListener('click', onDocClick, true);
		};
	});

	function triggerClick(e: MouseEvent) {
		e.stopPropagation();
		if (!disabled) open = !open;
	}

	function preset(key: 'none' | 'local' | 'all') {
		const next = applyPresetSelect(key);
		if (next !== null) enabledIds = next;
	}

	function toggleTool(id: ChatToolId, on: boolean) {
		enabledIds = toggleToolId(enabledIds, id, on);
	}
</script>

<div class="wrap" bind:this={rootEl}>
	<button
		type="button"
		class="tr"
		class:tr-on={open}
		{disabled}
		onclick={triggerClick}
		aria-expanded={open}
		aria-haspopup="dialog"
	>
		<svg class="svg" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
			<line x1="3" y1="7" x2="21" y2="7" /><circle cx="17" cy="7" r="2" fill="currentColor" stroke="none" />
			<line x1="3" y1="12" x2="21" y2="12" /><circle cx="10" cy="12" r="2" fill="currentColor" stroke="none" />
			<line x1="3" y1="17" x2="21" y2="17" /><circle cx="15" cy="17" r="2" fill="currentColor" stroke="none" />
		</svg>
		<span>Tools</span>
		{#if enabledIds.length < ALL_CHAT_TOOL_IDS.length}
			<span class="pill">{enabledIds.length}</span>
		{/if}
	</button>

	{#if open}
		<ChatToolsMenuPopover onAllOn={() => preset('all')} onNoSearch={() => preset('local')} onAllOff={() => preset('none')}>
			{#snippet body()}
				{#each TOOL_ROWS as row (row.id)}
					<ChatToolToggleRow
						toolId={row.id}
						title={row.title}
						description={row.description}
						checked={enabledIds.includes(row.id)}
						{disabled}
						onChange={(on) => toggleTool(row.id, on)}
					/>
				{/each}
			{/snippet}
		</ChatToolsMenuPopover>
	{/if}
</div>

<style>
	.wrap {
		position: relative;
	}
	.tr {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem 0.75rem;
		border-radius: 999px;
		border: 1px solid #45475a;
		background: #313244;
		color: #cdd6f4;
		font-size: 0.78rem;
		font-weight: 500;
		cursor: pointer;
	}
	.tr:hover:not(:disabled) {
		background: #45475a;
		border-color: #585b70;
	}
	.tr-on {
		border-color: #89b4fa;
		box-shadow: 0 0 0 1px #89b4fa44;
	}
	.tr:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.svg {
		width: 1rem;
		height: 1rem;
		opacity: 0.9;
	}
	.pill {
		min-width: 1.1rem;
		padding: 0 0.35rem;
		height: 1.1rem;
		line-height: 1.1rem;
		text-align: center;
		font-size: 0.65rem;
		font-weight: 700;
		border-radius: 999px;
		background: #89b4fa;
		color: #1e1e2e;
	}
</style>
