<script lang="ts">
	const RING_SIZE = 18;
	const STROKE = 2.25;
	const RADIUS = (RING_SIZE - STROKE) / 2;
	const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

	let { pct, warn = false } = $props<{ pct: number; warn?: boolean }>();

	const dashOffset = $derived(CIRCUMFERENCE * (1 - pct / 100));
</script>

<svg
	class="ring"
	width={RING_SIZE}
	height={RING_SIZE}
	viewBox="0 0 {RING_SIZE} {RING_SIZE}"
	aria-hidden="true"
>
	<circle
		class="track"
		cx={RING_SIZE / 2}
		cy={RING_SIZE / 2}
		r={RADIUS}
		fill="none"
		stroke-width={STROKE}
	/>
	<circle
		class="fill"
		class:warn
		cx={RING_SIZE / 2}
		cy={RING_SIZE / 2}
		r={RADIUS}
		fill="none"
		stroke-width={STROKE}
		stroke-linecap="round"
		stroke-dasharray={CIRCUMFERENCE}
		stroke-dashoffset={dashOffset}
		transform="rotate(-90 {RING_SIZE / 2} {RING_SIZE / 2})"
	/>
</svg>

<style>
	.ring {
		display: block;
	}
	.track {
		stroke: #313244;
	}
	.fill {
		stroke: #89b4fa;
		transition: stroke-dashoffset 0.2s ease, stroke 0.15s ease;
	}
	.fill.warn {
		stroke: #fab387;
	}
</style>
