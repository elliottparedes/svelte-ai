<script lang="ts">
	import type { ImmersiveVoicePhase } from '$lib/shared/immersiveVoice';

	let {
		phase,
		level = 0
	} = $props<{
		phase: ImmersiveVoicePhase;
		level?: number;
	}>();

	const active = $derived(phase === 'speaking' || phase === 'thinking' || phase === 'listening');
	const spin = $derived(phase === 'speaking' ? 2.8 : phase === 'thinking' ? 6 : 10);
	const scale = $derived(1 + level * 0.14 + (phase === 'listening' ? 0.04 : 0));
	const dash = $derived(40 + level * 120);
</script>

<div class="orb-wrap" style="transform: scale({scale})">
	<svg class="orb-svg" viewBox="0 0 200 200" aria-hidden="true">
		<defs>
			<linearGradient id="orbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
				<stop offset="0%" stop-color="#89b4fa" />
				<stop offset="50%" stop-color="#cba6f7" />
				<stop offset="100%" stop-color="#f38ba8" />
			</linearGradient>
		</defs>
		<circle class="orb-bg" cx="100" cy="100" r="72" />
		<circle
			class="orb-ring"
			class:active
			cx="100"
			cy="100"
			r="72"
			style="stroke-dasharray: {dash} 999; animation-duration: {spin}s"
		/>
		<circle class="orb-core" cx="100" cy="100" r="48" class:lit={active} />
	</svg>
</div>

<style>
	.orb-wrap {
		width: min(52vw, 280px);
		height: min(52vw, 280px);
		transition: transform 0.08s ease-out;
	}
	.orb-svg {
		width: 100%;
		height: 100%;
	}
	.orb-bg {
		fill: #1e1e2e;
		stroke: #313244;
		stroke-width: 2;
	}
	.orb-ring {
		fill: none;
		stroke: url(#orbGrad);
		stroke-width: 3;
		stroke-linecap: round;
		opacity: 0.35;
		transform-origin: 100px 100px;
	}
	.orb-ring.active {
		opacity: 1;
		animation: orb-spin linear infinite;
	}
	.orb-core {
		fill: #252537;
		transition: fill 0.2s;
	}
	.orb-core.lit {
		fill: #2a2a3d;
	}
	@keyframes orb-spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
