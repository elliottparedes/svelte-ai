<script lang="ts">
	import type { ModelProviderGroup } from '$lib/types/dashboard';
	import { filterModelPickerGroups } from '$lib/client/filterModelPickerGroups';
	import ChatModelPickerRow from './ChatModelPickerRow.svelte';
	import './thinScroll.css';

	let {
		groups,
		selectedModelId,
		favoriteModelIds = [],
		searchQuery = $bindable(''),
		onPick,
		onToggleFavorite
	} = $props<{
		groups: ModelProviderGroup[];
		selectedModelId: string;
		favoriteModelIds?: string[];
		searchQuery?: string;
		onPick: (modelId: string) => void;
		onToggleFavorite: (modelId: string) => void;
	}>();

	const filtered = $derived(filterModelPickerGroups(groups, searchQuery));
	const favoriteSet = $derived(new Set(favoriteModelIds));

	let searchInput = $state<HTMLInputElement | null>(null);

	$effect(() => {
		const shouldAutoFocus = window.matchMedia('(pointer: fine)').matches;
		if (!shouldAutoFocus) return;
		const t = window.setTimeout(() => searchInput?.focus(), 0);
		return () => window.clearTimeout(t);
	});
</script>

<div class="panel drop-up" role="listbox" aria-label="OpenRouter models">
	<div class="list thin-scroll">
		{#if filtered.length === 0}
			<p class="empty">No models match “{searchQuery}”</p>
		{:else}
			{#each filtered as group (group.label)}
				<div class="group">
					<div class="group-label">{group.label}</div>
					{#each group.models as m (m.id)}
						<ChatModelPickerRow
							model={m}
							selected={m.id === selectedModelId}
							isFavorite={favoriteSet.has(m.id)}
							onPick={() => onPick(m.id)}
							onToggleFavorite={() => onToggleFavorite(m.id)}
						/>
					{/each}
				</div>
			{/each}
		{/if}
	</div>
	<div class="search-wrap">
		<input
			bind:this={searchInput}
			type="search"
			class="search"
			placeholder="Search models…"
			bind:value={searchQuery}
			autocomplete="off"
			spellcheck="false"
		/>
	</div>
</div>

<style>
	.panel {
		position: absolute;
		left: 0;
		right: 0;
		min-width: min(18rem, 92vw);
		max-width: 22rem;
		background: #11111b;
		border: 1px solid #313244;
		border-radius: 12px;
		z-index: 50;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
	.panel.drop-up {
		bottom: calc(100% + 8px);
		top: auto;
		box-shadow: 0 -10px 36px rgba(0, 0, 0, 0.5);
		transform-origin: bottom center;
		animation: drop-up-in 0.2s cubic-bezier(0.22, 1, 0.36, 1);
	}
	@keyframes drop-up-in {
		from {
			opacity: 0;
			transform: translateY(6px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
	.search-wrap {
		flex-shrink: 0;
		padding: 0.5rem 0.55rem;
		border-top: 1px solid #313244;
		background: #181825;
	}
	.search {
		width: 100%;
		box-sizing: border-box;
		background: #252537;
		border: 1px solid #313244;
		border-radius: 8px;
		color: #cdd6f4;
		font-size: 0.8rem;
		padding: 0.4rem 0.55rem;
		outline: none;
	}
	.search:focus {
		border-color: #89b4fa;
	}
	.search::placeholder {
		color: #6c7086;
	}
	.list {
		flex: 1;
		min-height: 0;
		max-height: min(16rem, 38vh);
		padding: 0.25rem 0;
	}
	.empty {
		margin: 0.75rem 0.85rem;
		font-size: 0.78rem;
		color: #a6adc8;
	}
	.group-label {
		position: sticky;
		top: 0;
		z-index: 1;
		padding: 0.35rem 0.75rem 0.2rem;
		font-size: 0.62rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #6c7086;
		background: #11111b;
	}

	@media (max-width: 768px) {
		.panel.drop-up {
			position: fixed;
			left: max(0.65rem, env(safe-area-inset-left, 0px));
			right: max(0.65rem, env(safe-area-inset-right, 0px));
			bottom: max(6.5rem, calc(5.75rem + env(safe-area-inset-bottom, 0px)));
			top: auto;
			min-width: 0;
			max-width: none;
			width: auto;
			z-index: 100;
		}

		.list {
			max-height: min(45dvh, 22rem);
		}
	}
</style>
