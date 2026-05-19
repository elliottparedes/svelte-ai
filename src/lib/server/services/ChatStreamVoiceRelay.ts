import { ElevenLabsTtsRelay } from '$lib/server/infrastructure/ElevenLabsTtsRelay';
import type { TtsStreamConfig } from './TtsStreamService';

/** Forwards assistant text to ElevenLabs; emits base64 PCM as it arrives. */
export class ChatStreamVoiceRelay {
	private relay = new ElevenLabsTtsRelay();
	private finalResolve: (() => void) | null = null;
	private finalPromise: Promise<void> = Promise.resolve();

	constructor(
		private readonly config: TtsStreamConfig,
		private readonly onAudio: (base64Pcm: string) => void
	) {}

	async connect(): Promise<void> {
		this.finalPromise = new Promise<void>((resolve) => {
			this.finalResolve = resolve;
		});
		await this.relay.connect(this.config, (chunk) => {
			if (chunk.audio.length > 0) {
				this.onAudio(Buffer.from(chunk.audio).toString('base64'));
			}
			if (chunk.isFinal) this.finalResolve?.();
		});
	}

	feedText(text: string): void {
		if (text) this.relay.sendText(text);
	}

	async finish(): Promise<void> {
		this.relay.end();
		await Promise.race([
			this.finalPromise,
			new Promise<void>((r) => setTimeout(r, 45_000))
		]);
		this.relay.close();
	}
}
