<script lang="ts">
	import type { Model } from '$lib/types/dashboard';

	let {
		model,
		selected = false,
		isFavorite = false,
		onPick,
		onToggleFavorite
	} = $props<{
		model: Model;
		selected?: boolean;
		isFavorite?: boolean;
		onPick: () => void;
		onToggleFavorite: () => void;
	}>();
</script>

<div class="row" role="option" aria-selected={selected}>
	<button type="button" class="pick" class:selected onclick={onPick}>
		<span class="name">{model.name}</span>
		<span class="id">{model.id}</span>
	</button>
	<button
		type="button"
		class="star"
		class:favorited={isFavorite}
		aria-pressed={isFavorite}
		title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
		onclick={onToggleFavorite}
	>
		{isFavorite ? '★' : '☆'}
	</button>
</div>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 0.15rem;
		width: 100%;
	}
	.pick {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.1rem;
		flex: 1;
		min-width: 0;
		text-align: left;
		border: none;
		background: none;
		padding: 0.4rem 0.75rem;
		cursor: pointer;
		color: #cdd6f4;
	}
	.pick:hover,
	.row:has(.star:hover) .pick {
		background: transparent;
	}
	.row:hover .pick {
		background: #1e1e2e;
	}
	.pick.selected {
		background: #252537;
	}
	.row:hover .pick.selected {
		background: #252537;
	}
	.pick.selected .name {
		color: #89b4fa;
	}
	.name {
		font-size: 0.8rem;
		line-height: 1.25;
	}
	.id {
		font-size: 0.65rem;
		color: #6c7086;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.star {
		flex-shrink: 0;
		border: none;
		background: none;
		color: #6c7086;
		font-size: 0.95rem;
		line-height: 1;
		padding: 0.35rem 0.45rem;
		margin-right: 0.25rem;
		cursor: pointer;
		border-radius: 4px;
	}
	.star:hover {
		color: #f9e2af;
		background: rgba(249, 226, 175, 0.08);
	}
	.star.favorited {
		color: #f9e2af;
	}
</style>
