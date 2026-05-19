<script lang="ts">
	let {
		isStreaming,
		assistantHasContent,
		errorMessage
	} = $props<{
		isStreaming: boolean;
		assistantHasContent: boolean;
		errorMessage: string;
	}>();
</script>

{#if isStreaming && !assistantHasContent}
	<div class="assistant-row typing-wrap">
		<div class="typing">
			<div class="dots">
				<span></span>
				<span></span>
				<span></span>
			</div>
		</div>
	</div>
{/if}

{#if errorMessage}
	<div class="assistant-row error-wrap">
		<div class="error-bubble">{errorMessage}</div>
	</div>
{/if}

<style>
	.assistant-row {
		width: 100%;
		color: #cdd6f4;
		animation: messageIn 0.25s ease-out;
	}
	.typing-wrap,
	.error-wrap {
		font-size: 0.95rem;
		line-height: 1.6;
	}
	.typing {
		display: inline-flex;
		padding: 0.5rem 0;
	}
	.dots {
		display: flex;
		gap: 0.35rem;
		align-items: center;
		height: 1.2rem;
	}
	.dots span {
		width: 6px;
		height: 6px;
		background: #a6adc8;
		border-radius: 50%;
		animation: bounce 1.4s infinite ease-in-out both;
	}
	.dots span:nth-child(1) {
		animation-delay: -0.32s;
	}
	.dots span:nth-child(2) {
		animation-delay: -0.16s;
	}
	@keyframes bounce {
		0%,
		80%,
		100% {
			transform: scale(0);
		}
		40% {
			transform: scale(1);
		}
	}
	@keyframes messageIn {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.error-bubble {
		background: #1e1e2e;
		border: 1px solid #f38ba8;
		color: #f38ba8;
		padding: 0.6rem 1rem;
		border-radius: 1rem;
		font-size: 0.9rem;
		display: inline-block;
	}
</style>
