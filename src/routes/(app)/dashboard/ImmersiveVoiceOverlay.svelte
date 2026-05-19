<script lang="ts">
	import { onMount } from 'svelte';
	import VoiceOrbRing from './VoiceOrbRing.svelte';
	import { connectScribe, type ScribeConnection } from '$lib/client/scribeClient';
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
	let micError = $state('');
	let isConnected = $state(false);
	let isConnecting = $state(false);
	let conn: ScribeConnection | null = null;

	const statusText = $derived.by(() => {
		if (micError) return micError;
		if (isConnecting) return 'Connecting mic…';
		if (phase === 'thinking') return 'Thinking…';
		if (phase === 'speaking') return 'Speaking…';
		if (isConnected) return 'Listening… speak now';
		return 'Tap 🎤 to start';
	});

	// Use wrapper refs so closures always call the current prop, never a stale capture
	function handleCommit(text: string) {
		console.log('[IVO] handleCommit called, text=', JSON.stringify(text), 'phase=', phase);
		interim = '';
		if (!text) {
			console.log('[IVO] empty commit — ignoring');
			return;
		}
		try {
			onPhaseChange?.('thinking');
			void onSend(text);
		} catch (e) {
			console.error('[IVO] handleCommit threw:', e);
			onPhaseChange?.('idle');
		}
	}

	function handlePartial(text: string) {
		interim = text;
	}

	async function startListening() {
		if (isConnecting || isConnected) {
			console.log('[IVO] startListening skipped — already', { isConnecting, isConnected });
			return;
		}
		console.log('[IVO] startListening…');
		isConnecting = true;
		micError = '';
		interim = '';

		try {
			conn = await connectScribe({
				onConnected() {
					console.log('[IVO] mic connected ✓');
					isConnecting = false;
					isConnected = true;
					onPhaseChange?.('listening');
				},
				onDisconnected() {
					console.log('[IVO] mic disconnected, phase=', phase);
					isConnected = false;
					isConnecting = false;
					conn = null;
					if (phase !== 'thinking' && phase !== 'speaking') {
						onPhaseChange?.('idle');
					}
				},
				onPartial: handlePartial,
				onCommit: handleCommit,
				onError(msg) {
					console.error('[IVO] mic error:', msg);
					micError = msg.includes('not-allowed') || msg.includes('Permission')
						? 'Mic blocked — allow in browser settings'
						: `Mic error: ${msg}`;
					isConnecting = false;
					isConnected = false;
					onPhaseChange?.('idle');
				}
			});
			console.log('[IVO] connectScribe resolved, conn=', conn);
		} catch (e) {
			console.error('[IVO] connectScribe threw:', e);
			micError = e instanceof Error ? e.message : 'Could not connect mic';
			isConnecting = false;
		}
	}

	function stopListening() {
		console.log('[IVO] stopListening');
		conn?.close();
		conn = null;
		isConnected = false;
	}

	// Pause mic while TTS is playing, resume after
	let prevPhase = $state<ImmersiveVoicePhase>('idle');
	$effect(() => {
		const p = phase;
		if (p === 'speaking' && isConnected) stopListening();
		if (prevPhase === 'speaking' && p === 'idle') {
			setTimeout(startListening, 400);
		}
		prevPhase = p;
	});

	onMount(() => {
		void startListening();
		return () => stopListening();
	});
</script>

<div class="iv-root">
	<div class="iv-top">
		<button class="iv-close" type="button" onclick={onClose}>Exit voice</button>
	</div>

	<div class="iv-body">
		<VoiceOrbRing {phase} level={audioLevel} />

		<p class="iv-status">{statusText}</p>
		<p class="iv-interim">{interim ? `"${interim}"` : ''}</p>

		<button
			type="button"
			class="iv-mic"
			class:listening={isConnected}
			class:connecting={isConnecting}
			disabled={phase === 'speaking' || isConnecting}
			onclick={isConnected ? stopListening : startListening}
			title={isConnected ? 'Tap to stop' : 'Tap to speak'}
		>
			{isConnecting ? '⏳' : '🎤'}
		</button>
	</div>
</div>

<style>
	.iv-root {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: radial-gradient(ellipse 80% 70% at 50% 48%, #252538 0%, #181825 65%);
	}
	.iv-top {
		position: absolute;
		top: 1rem;
		right: 1rem;
	}
	.iv-close {
		background: rgba(49, 50, 68, 0.9);
		border: 1px solid #45475a;
		color: #cdd6f4;
		border-radius: 8px;
		padding: 0.4rem 0.85rem;
		cursor: pointer;
		font-size: 0.85rem;
	}
	.iv-close:hover {
		background: #313244;
	}
	.iv-body {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0;
	}
	.iv-status {
		margin: 1.25rem 0 0;
		font-size: 1rem;
		color: #a6adc8;
		text-align: center;
		min-height: 1.5rem;
	}
	.iv-interim {
		margin: 0.5rem 0 0;
		max-width: 32rem;
		text-align: center;
		color: #cdd6f4;
		font-size: 0.95rem;
		min-height: 2.5rem;
		padding: 0 1rem;
	}
	.iv-mic {
		margin-top: 1.5rem;
		width: 4.5rem;
		height: 4.5rem;
		border-radius: 50%;
		border: 2px solid #89b4fa;
		background: rgba(137, 180, 250, 0.1);
		font-size: 1.6rem;
		cursor: pointer;
		transition: transform 0.15s, box-shadow 0.15s, border-color 0.2s, background 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.iv-mic:hover:not(:disabled) {
		transform: scale(1.07);
		box-shadow: 0 0 28px rgba(137, 180, 250, 0.3);
	}
	.iv-mic.listening {
		border-color: #f38ba8;
		background: rgba(243, 139, 168, 0.15);
		animation: mic-pulse 1.2s ease-in-out infinite;
	}
	.iv-mic.connecting {
		border-color: #f9e2af;
		background: rgba(249, 226, 175, 0.12);
	}
	.iv-mic:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}
	@keyframes mic-pulse {
		0%, 100% { box-shadow: 0 0 0 0 rgba(243, 139, 168, 0.4); }
		50% { box-shadow: 0 0 0 14px rgba(243, 139, 168, 0); }
	}
</style>
