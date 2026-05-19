import { elevenLabsStreamInputUrl } from './elevenLabsWsUrl';

export type ElevenLabsTtsRelayConfig = {
	apiKey: string;
	voiceId: string;
	modelId: string;
};

export type ElevenLabsAudioOut = { audio: Uint8Array; isFinal: boolean };

/** Bidirectional relay to ElevenLabs stream-input WebSocket. */
export class ElevenLabsTtsRelay {
	private ws: WebSocket | null = null;
	private onChunk: ((chunk: ElevenLabsAudioOut) => void) | null = null;
	private closed = false;

	connect(config: ElevenLabsTtsRelayConfig, onChunk: (chunk: ElevenLabsAudioOut) => void): Promise<void> {
		this.onChunk = onChunk;
		return new Promise((resolve, reject) => {
			const ws = new WebSocket(elevenLabsStreamInputUrl(config.voiceId, config.modelId));
			this.ws = ws;
			ws.onopen = () => {
				ws.send(
					JSON.stringify({
						text: ' ',
						voice_settings: { stability: 0.5, similarity_boost: 0.75 },
						generation_config: { chunk_length_schedule: [50, 50, 50, 50] },
						xi_api_key: config.apiKey
					})
				);
				resolve();
			};
			ws.onerror = () => reject(new Error('ElevenLabs connection failed'));
			ws.onmessage = (ev) => {
				try {
					this.handleMessage(String(ev.data));
				} catch (e) {
					ws.close();
					reject(e instanceof Error ? e : new Error('ElevenLabs error'));
				}
			};
			ws.onclose = () => {
				this.closed = true;
			};
		});
	}

	sendText(text: string): void {
		if (!text || !this.ws || this.closed) return;
		const payload = text.endsWith(' ') ? text : `${text} `;
		this.ws.send(JSON.stringify({ text: payload, try_trigger_generation: true }));
	}

	/** EOS — flushes remaining audio. */
	end(): void {
		if (!this.ws || this.closed) return;
		this.ws.send(JSON.stringify({ text: '' }));
	}

	close(): void {
		this.closed = true;
		if (this.ws && this.ws.readyState <= WebSocket.OPEN) {
			this.ws.close();
		}
		this.ws = null;
	}

	private handleMessage(raw: string): void {
		let data: Record<string, unknown>;
		try {
			data = JSON.parse(raw) as Record<string, unknown>;
		} catch {
			return;
		}
		const err = data.message ?? data.error ?? data.detail;
		if (typeof err === 'string' && err.length > 0) {
			throw new Error(err);
		}
		const audioB64 = data.audio;
		if (typeof audioB64 === 'string' && audioB64.length > 0) {
			const audio = Uint8Array.from(Buffer.from(audioB64, 'base64'));
			this.onChunk?.({ audio, isFinal: false });
		}
		if (data.isFinal === true) {
			this.onChunk?.({ audio: new Uint8Array(0), isFinal: true });
		}
	}
}
