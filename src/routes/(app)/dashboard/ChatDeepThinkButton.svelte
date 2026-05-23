<script lang="ts">
	let {
		enabled = $bindable(false),
		disabled = false
	} = $props<{
		enabled?: boolean;
		disabled?: boolean;
	}>();
</script>

<button
	type="button"
	class="deep-think-btn"
	class:active={enabled}
	title={enabled ? 'Deep think on for next message' : 'Deep think off — auto-routes by task'}
	aria-pressed={enabled}
	{disabled}
	onclick={() => (enabled = !enabled)}
>
	Deep think
</button>

<style>
	.deep-think-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.35rem 0.85rem;
		border-radius: 999px;
		border: 1px solid #45475a;
		background: #313244;
		color: #a6adc8;
		font-size: 0.78rem;
		font-weight: 500;
		line-height: 1.2;
		white-space: nowrap;
		cursor: pointer;
	}
	.deep-think-btn:hover:not(:disabled) {
		color: #cdd6f4;
		background: #45475a;
		border-color: #585b70;
	}
	.deep-think-btn.active {
		color: #f9e2af;
		border-color: rgba(249, 226, 175, 0.5);
		background: rgba(249, 226, 175, 0.14);
		box-shadow: 0 0 0 1px rgba(249, 226, 175, 0.2);
	}
	.deep-think-btn.active:hover:not(:disabled) {
		background: rgba(249, 226, 175, 0.2);
		border-color: rgba(249, 226, 175, 0.6);
	}
	.deep-think-btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
</style>
