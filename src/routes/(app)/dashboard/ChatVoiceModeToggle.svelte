<script lang="ts">
	import { ElevenLabsPcmPlayer } from '$lib/client/elevenLabsPcmPlayer';

	let {
		enabled = $bindable(false),
		disabled = false
	} = $props<{
		enabled?: boolean;
		disabled?: boolean;
	}>();

	const unlockPlayer = new ElevenLabsPcmPlayer();

	async function toggle() {
		enabled = !enabled;
		if (enabled) await unlockPlayer.unlock();
	}
</script>

<button
	type="button"
	class="icon-btn"
	class:active={enabled}
	title={enabled ? 'Voice mode on — assistant replies are spoken' : 'Voice mode off'}
	aria-pressed={enabled}
	{disabled}
	onclick={() => void toggle()}
>
	<span aria-hidden="true">{enabled ? '🔊' : '🔇'}</span>
</button>

<style>
	.icon-btn {
		background: none;
		border: none;
		color: #a6adc8;
		font-size: 1.1rem;
		cursor: pointer;
		padding: 0.25rem 0.35rem;
		line-height: 1;
		border-radius: 4px;
	}
	.icon-btn:hover:not(:disabled) {
		color: #cdd6f4;
	}
	.icon-btn.active {
		color: #89b4fa;
		background: rgba(137, 180, 250, 0.12);
	}
	.icon-btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
</style>
