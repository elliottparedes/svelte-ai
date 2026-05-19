import { ElevenLabsPcmPlayer } from '$lib/client/elevenLabsPcmPlayer';
import type { ImmersiveVoicePhase } from '$lib/shared/immersiveVoice';
import type { DashboardSendDeps } from '$lib/client/dashboardSendChat';

export function buildImmersivePcmHooks(
	setPhase: (p: ImmersiveVoicePhase) => void,
	setLevel: (n: number) => void,
	isStreaming: () => boolean
): NonNullable<DashboardSendDeps['immersive']>['pcmHooks'] {
	return {
		onSpeakingChange: (speaking) => {
			if (speaking) setPhase('speaking');
			else setPhase(isStreaming() ? 'thinking' : 'idle');
		},
		onLevel: setLevel
	};
}

export function createImmersiveSendBundle(
	setPhase: (p: ImmersiveVoicePhase) => void,
	setLevel: (n: number) => void,
	isStreaming: () => boolean
): { pcm: ElevenLabsPcmPlayer; immersive: NonNullable<DashboardSendDeps['immersive']> } {
	const pcm = new ElevenLabsPcmPlayer();
	const pcmHooks = buildImmersivePcmHooks(setPhase, setLevel, isStreaming);
	pcm.setHooks(pcmHooks);
	return { pcm, immersive: { pcm, onPhase: setPhase, pcmHooks } };
}

export function immersiveConfigFromPcm(
	pcm: ElevenLabsPcmPlayer,
	setPhase: (p: ImmersiveVoicePhase) => void,
	setLevel: (n: number) => void,
	isStreaming: () => boolean
): NonNullable<DashboardSendDeps['immersive']> {
	const pcmHooks = buildImmersivePcmHooks(setPhase, setLevel, isStreaming);
	pcm.setHooks(pcmHooks);
	return { pcm, onPhase: setPhase, pcmHooks };
}
