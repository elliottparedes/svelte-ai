/** Plays sequential MP3 blobs from ElevenLabs stream chunks. */
export class ElevenLabsAudioQueue {
	private queue: Blob[] = [];
	private playing = false;
	private stopped = false;

	enqueueMp3Bytes(bytes: Uint8Array): void {
		if (this.stopped || bytes.length === 0) return;
		this.queue.push(new Blob([bytes.slice()], { type: 'audio/mpeg' }));
		void this.pump();
	}

	stop(): void {
		this.stopped = true;
		this.queue = [];
	}

	private async pump(): Promise<void> {
		if (this.playing || this.stopped) return;
		this.playing = true;
		while (this.queue.length > 0 && !this.stopped) {
			const blob = this.queue.shift()!;
			const url = URL.createObjectURL(blob);
			try {
				await playUrl(url);
			} finally {
				URL.revokeObjectURL(url);
			}
		}
		this.playing = false;
	}
}

function playUrl(url: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const audio = new Audio(url);
		audio.onended = () => resolve();
		audio.onerror = () => reject(new Error('Audio playback failed'));
		void audio.play().catch(reject);
	});
}
