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
	>
		Send
	</button>
</div>

<style>
	.footer-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.send-btn {
		background: #89b4fa;
		color: #1e1e2e;
		border: none;
		border-radius: 6px;
		padding: 0.4rem 0.85rem;
		font-weight: 600;
		cursor: pointer;
	}
	.send-btn:hover:not(:disabled) {
		background: #b4befe;
	}
	.send-btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
</style>
