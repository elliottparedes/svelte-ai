<script lang="ts">
	import { onMount } from 'svelte';
	import VoiceOrbRing from './VoiceOrbRing.svelte';
	import { createSpeechRecognizer } from '$lib/client/speechRecognitionClient';
	import type { ImmersiveVoicePhase } from '$lib/shared/immersiveVoice';

	let {
		phase,
		audioLevel,
		isStreaming,
		onClose,
		onSend,
		onPhaseChange
	} = $props<{
		phase: ImmersiveVoicePhase;
		audioLevel: number;
		isStreaming: boolean;
		onClose: () => void;
		onSend: (text: string) => void | Promise<void>;
		onPhaseChange?: (phase: ImmersiveVoicePhase) => void;
	}>();

	let interim = $state('');
	let sttOk = $state(true);
	let recognizer = $state<ReturnType<typeof createSpeechRecognizer>>(null);

	const statusText = $derived.by(() => {
		switch (phase) {
			case 'listening':
				return 'Listening…';
			case 'thinking':
				return 'Thinking…';
			case 'speaking':
				return 'Speaking…';
			case 'error':
				return 'Something went wrong — tap mic to try again';
			default:
				return isStreaming ? 'One moment…' : 'Tap the mic or speak to start';
		}
	});

	const micDisabled = $derived(isStreaming || phase === 'thinking' || phase === 'speaking');

	function startListening() {
		if (micDisabled || !recognizer?.isSupported) return;
		interim = '';
		onPhaseChange?.('listening');
		recognizer.start();
	}

	let prevPhase = $state<ImmersiveVoicePhase>('idle');
	$effect(() => {
		const becameIdle = prevPhase !== 'idle' && phase === 'idle' && !isStreaming;
		prevPhase = phase;
		if (!becameIdle) return;
		const t = setTimeout(() => {
			if (phase === 'idle' && !isStreaming) startListening();
		}, 500);
		return () => clearTimeout(t);
	});

	onMount(() => {
		recognizer = createSpeechRecognizer({
			onInterim: (t) => (interim = t),
			onFinal: (text) => {
				interim = '';
				recognizer?.abort();
				if (text) void onSend(text);
			},
			onError: () => {
				sttOk = false;
				onPhaseChange?.('error');
			}
		});
		sttOk = recognizer?.isSupported ?? false;
		setTimeout(() => startListening(), 400);
		return () => recognizer?.abort();
	});
</script>

<div class="immersive-root">
	<div class="immersive-top">
		<button type="button" class="immersive-close" onclick={onClose}>Exit voice</button>
	</div>

	<VoiceOrbRing {phase} level={audioLevel} />

	<p class="immersive-status">{statusText}</p>
	{#if interim}
		<p class="immersive-interim">“{interim}”</p>
	{:else}
		<p class="immersive-interim"></p>
	{/if}

	{#if !sttOk}
		<p class="immersive-warn">Speech recognition needs Chrome or Edge.</p>
	{/if}

	<button
		type="button"
		class="immersive-mic"
		class:listening={phase === 'listening'}
		disabled={micDisabled || !sttOk}
		title="Speak"
		onclick={startListening}
	>
		🎤
	</button>
</div>

<style src="./immersiveVoiceOrb.css"></style>
