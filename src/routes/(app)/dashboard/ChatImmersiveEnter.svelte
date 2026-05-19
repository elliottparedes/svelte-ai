<script lang="ts">
	let {
		ttsEnabled = false,
		active = false,
		disabled = false,
		onEnter
	} = $props<{
		ttsEnabled?: boolean;
		active?: boolean;
		disabled?: boolean;
		onEnter: () => void;
	}>();
</script>

{#if ttsEnabled}
	<button
		type="button"
		class="icon-btn"
		class:active
		title="Voice conversation — fullscreen orb with speech"
		aria-pressed={active}
		{disabled}
		onclick={onEnter}
	>
		<span aria-hidden="true">◎</span>
	</button>
{/if}

<style>
	.icon-btn {
		background: none;
		border: none;
		color: #a6adc8;
		font-size: 1.15rem;
		cursor: pointer;
		padding: 0.25rem 0.35rem;
		border-radius: 4px;
		line-height: 1;
	}
	.icon-btn:hover:not(:disabled) {
		color: #cdd6f4;
	}
	.icon-btn.active {
		color: #cba6f7;
		background: rgba(203, 166, 247, 0.12);
	}
	.icon-btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
</style>
