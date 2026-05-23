<script lang="ts">
	let {
		value,
		attachmentsLen,
		isStreaming,
		onSend
	} = $props<{
		value: string;
		attachmentsLen: number;
		isStreaming: boolean;
		onSend: () => void;
	}>();
</script>

<div class="footer-right">
	<button
		type="button"
		class="send-btn"
		disabled={isStreaming || (!value.trim() && attachmentsLen === 0)}
		onclick={onSend}
		aria-label="Send message"
	>
		<span class="send-label">Send</span>
		<svg
			class="send-icon"
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="M12 19V5" />
			<path d="m5 12 7-7 7 7" />
		</svg>
	</button>
</div>

<style>
	.footer-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}
	.send-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: #89b4fa;
		color: #1e1e2e;
		border: none;
		border-radius: 6px;
		padding: 0.4rem 0.85rem;
		font-weight: 600;
		cursor: pointer;
		line-height: 1;
	}
	.send-icon {
		display: none;
	}
	.send-btn:hover:not(:disabled) {
		background: #b4befe;
	}
	.send-btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
</style>
