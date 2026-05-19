<script lang="ts">
	let { src, alt, sourceUrl, onclose } = $props<{
		src: string;
		alt: string;
		sourceUrl?: string;
		onclose: () => void;
	}>();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onclose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="backdrop" onclick={handleBackdropClick} role="dialog" aria-modal="true" tabindex="-1">
	<div class="modal">
		<button class="close-btn" onclick={onclose} aria-label="Close">✕</button>
		<img class="full-img" {src} {alt} />
		{#if sourceUrl}
			<a class="source-link" href={sourceUrl} target="_blank" rel="noopener noreferrer">
				View source ↗
			</a>
		{/if}
	</div>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.85);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1.5rem;
		animation: fadeIn 0.15s ease;
	}
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	.modal {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		max-width: min(90vw, 1000px);
		max-height: 90vh;
		animation: scaleIn 0.15s ease;
	}
	@keyframes scaleIn {
		from { transform: scale(0.92); opacity: 0; }
		to { transform: scale(1); opacity: 1; }
	}
	.full-img {
		max-width: 100%;
		max-height: calc(90vh - 4rem);
		border-radius: 10px;
		object-fit: contain;
		box-shadow: 0 8px 48px rgba(0, 0, 0, 0.6);
	}
	.close-btn {
		position: absolute;
		top: -0.75rem;
		right: -0.75rem;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: #313244;
		border: 1px solid #45475a;
		color: #cdd6f4;
		cursor: pointer;
		font-size: 0.8rem;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
		transition: background 0.15s;
	}
	.close-btn:hover { background: #45475a; }
	.source-link {
		font-size: 0.78rem;
		color: #89b4fa;
		text-decoration: none;
	}
	.source-link:hover { text-decoration: underline; }
</style>
