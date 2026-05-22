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
	<button type="button" class="close-btn" onclick={onclose} aria-label="Close image">
		<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
			<path
				d="M6 6l12 12M18 6L6 18"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
			/>
		</svg>
	</button>
	<div class="modal">
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
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		background: rgba(0, 0, 0, 0.85);
		display: grid;
		place-items: center;
		z-index: 1000;
		padding: max(1.5rem, env(safe-area-inset-top, 0px)) max(1.5rem, env(safe-area-inset-right, 0px))
			max(1.5rem, env(safe-area-inset-bottom, 0px)) max(1.5rem, env(safe-area-inset-left, 0px));
		animation: fadeIn 0.15s ease;
	}
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	.modal {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		width: min(100%, 1000px);
		max-width: 100%;
		max-height: 100%;
		margin: 0 auto;
		justify-self: center;
		animation: scaleIn 0.15s ease;
	}
	@keyframes scaleIn {
		from {
			transform: scale(0.92);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}
	.full-img {
		display: block;
		width: auto;
		height: auto;
		max-width: 100%;
		max-height: min(85vh, 85dvh);
		margin: 0 auto;
		border-radius: 10px;
		object-fit: contain;
		box-shadow: 0 8px 48px rgba(0, 0, 0, 0.6);
	}
	.close-btn {
		position: fixed;
		top: max(1rem, env(safe-area-inset-top, 0px));
		right: max(1rem, env(safe-area-inset-right, 0px));
		z-index: 1001;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 50%;
		background: #1e1e2e;
		border: 2px solid #cdd6f4;
		color: #f5f5f5;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 20px rgb(0 0 0 / 0.55);
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
		transition:
			background 0.15s,
			transform 0.15s;
	}
	.close-btn:hover {
		background: #313244;
	}
	.close-btn:active {
		transform: scale(0.96);
	}
	.source-link {
		font-size: 0.78rem;
		color: #89b4fa;
		text-decoration: none;
	}
	.source-link:hover {
		text-decoration: underline;
	}

	@media (max-width: 768px) {
		.backdrop {
			padding: max(1rem, env(safe-area-inset-top, 0px)) max(1rem, env(safe-area-inset-right, 0px))
				max(1rem, env(safe-area-inset-bottom, 0px)) max(1rem, env(safe-area-inset-left, 0px));
		}
		.full-img {
			max-height: min(80vh, 80dvh);
		}
		.close-btn {
			top: max(0.75rem, env(safe-area-inset-top, 0px));
			right: max(0.75rem, env(safe-area-inset-right, 0px));
			width: 3.25rem;
			height: 3.25rem;
			background: rgb(30 30 46 / 0.96);
			border-width: 2px;
			box-shadow: 0 4px 24px rgb(0 0 0 / 0.7);
		}
		.close-btn svg {
			width: 22px;
			height: 22px;
		}
	}
</style>
