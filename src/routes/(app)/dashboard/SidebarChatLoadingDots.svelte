<script lang="ts">
	let { size = 'sidebar' } = $props<{ size?: 'sidebar' | 'chat' }>();
</script>

<span class="loading-dots" class:chat={size === 'chat'} aria-label="Generating reply">
	<span></span><span></span><span></span>
</span>

<style>
	.loading-dots {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		flex-shrink: 0;
		margin-left: 0.35rem;
	}
	.loading-dots.chat {
		margin-left: 0;
		gap: 5px;
	}
	.loading-dots span {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: #89b4fa;
		animation: pulse 1.2s ease-in-out infinite;
	}
	.loading-dots span:nth-child(2) {
		animation-delay: 0.15s;
	}
	.loading-dots span:nth-child(3) {
		animation-delay: 0.3s;
	}
	.loading-dots.chat span {
		width: 6px;
		height: 6px;
	}
	@keyframes pulse {
		0%,
		80%,
		100% {
			opacity: 0.25;
			transform: scale(0.85);
		}
		40% {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
