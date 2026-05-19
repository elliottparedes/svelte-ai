import { ElevenLabsAudioQueue } from '$lib/client/elevenLabsAudioQueue';
import { createTtsTextChunker } from '$lib/client/ttsTextChunker';

type TtsOut = { type: 'audio'; data: string } | { type: 'error'; message: string } | { type: 'done' };

/** Streams assistant text to /api/v1/tts/stream and plays returned audio. */
export class ChatTtsSession {
	private controller: ReadableStreamDefaultController<Uint8Array> | null = null;
	private bodyStream: ReadableStream<Uint8Array> | null = null;
	private readerTask: Promise<void> | null = null;
	private audio = new ElevenLabsAudioQueue();
	private chunker = createTtsTextChunker((text) => this.writeLine({ type: 'text', content: text }));
	private closed = false;

	start(): void {
		this.bodyStream = new ReadableStream({
			start: (c) => {
				this.controller = c;
			}
		});
		this.readerTask = this.runReader();
	}

	feedDelta(delta: string): void {
		if (!this.closed) this.chunker.push(delta);
	}

	async finish(): Promise<void> {
		if (this.closed) return;
		this.chunker.flush();
		this.writeLine({ type: 'end' });
		this.controller?.close();
		this.closed = true;
		try {
			await this.readerTask;
		} catch {
			/* playback errors are non-fatal */
		}
	}

	abort(): void {
		if (this.closed) return;
		this.closed = true;
		this.audio.stop();
		try {
			this.controller?.close();
		} catch {
			/* already closed */
		}
	}

	private writeLine(obj: Record<string, string>): void {
		if (!this.controller || this.closed) return;
		const line = `${JSON.stringify(obj)}\n`;
		this.controller.enqueue(new TextEncoder().encode(line));
	}

	private async runReader(): Promise<void> {
		if (!this.bodyStream) return;
		const res = await fetch('/api/v1/tts/stream', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-ndjson' },
			body: this.bodyStream,
			duplex: 'half'
		} as RequestInit);
		if (!res.ok || !res.body) throw new Error('TTS request failed');

		const reader = res.body.getReader();
		const decoder = new TextDecoder();
		let carry = '';
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			carry += decoder.decode(value, { stream: true });
			const lines = carry.split('\n');
			carry = lines.pop() ?? '';
			for (const line of lines) {
				if (!line.trim()) continue;
				const ev = JSON.parse(line) as TtsOut;
				if (ev.type === 'audio') {
					const bin = atob(ev.data);
					const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
					this.audio.enqueueMp3Bytes(bytes);
				} else if (ev.type === 'error') {
					throw new Error(ev.message);
				}
			}
		}
	}
}
