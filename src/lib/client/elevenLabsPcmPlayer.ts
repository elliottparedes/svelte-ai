const PCM_SAMPLE_RATE = 24_000;

export type PcmPlayerHooks = {
	onSpeakingChange?: (speaking: boolean) => void;
	onLevel?: (level: number) => void;
};

/** Streams PCM chunks via Web Audio with optional level metering for visualizers. */
export class ElevenLabsPcmPlayer {
	private ctx: AudioContext | null = null;
	private analyser: AnalyserNode | null = null;
	private levelBuf: Uint8Array | null = null;
	private nextTime = 0;
	private stopped = false;
	private activeSources = 0;
	private rafId = 0;
	private hooks: PcmPlayerHooks = {};

	setHooks(hooks: PcmPlayerHooks): void {
		this.hooks = hooks;
	}

	async unlock(): Promise<void> {
		if (typeof window === 'undefined') return;
		if (!this.ctx) this.ctx = new AudioContext();
		if (this.ctx.state === 'suspended') await this.ctx.resume();
		this.ensureAnalyser();
	}

	playPcm(bytes: Uint8Array): void {
		if (this.stopped || bytes.length < 2) return;
		if (!this.ctx) this.ctx = new AudioContext();
		this.ensureAnalyser();
		const int16 = new Int16Array(
			bytes.buffer,
			bytes.byteOffset,
			Math.floor(bytes.byteLength / 2)
		);
		const floats = new Float32Array(int16.length);
		for (let i = 0; i < int16.length; i++) floats[i] = int16[i]! / 32768;
		const buf = this.ctx.createBuffer(1, floats.length, PCM_SAMPLE_RATE);
		buf.copyToChannel(floats, 0);
		const src = this.ctx.createBufferSource();
		src.buffer = buf;
		src.connect(this.analyser!);
		const start = Math.max(this.nextTime, this.ctx.currentTime);
		src.start(start);
		this.nextTime = start + buf.duration;
		this.activeSources++;
		if (this.activeSources === 1) {
			this.hooks.onSpeakingChange?.(true);
			this.startMeter();
		}
		src.onended = () => {
			this.activeSources = Math.max(0, this.activeSources - 1);
			if (this.activeSources === 0) {
				this.stopMeter();
				this.hooks.onSpeakingChange?.(false);
			}
		};
	}

	stop(): void {
		this.stopped = true;
		this.activeSources = 0;
		this.stopMeter();
		this.hooks.onSpeakingChange?.(false);
		if (this.ctx) this.nextTime = this.ctx.currentTime;
	}

	private ensureAnalyser(): void {
		if (!this.ctx || this.analyser) return;
		this.analyser = this.ctx.createAnalyser();
		this.analyser.fftSize = 256;
		this.analyser.connect(this.ctx.destination);
		this.levelBuf = new Uint8Array(this.analyser.frequencyBinCount);
	}

	private startMeter(): void {
		if (this.rafId || typeof window === 'undefined') return;
		const tick = () => {
			if (!this.analyser || !this.levelBuf) return;
			this.analyser.getByteFrequencyData(this.levelBuf as Uint8Array<ArrayBuffer>);
			let sum = 0;
			for (const v of this.levelBuf) sum += v;
			const level = sum / (this.levelBuf.length * 255);
			this.hooks.onLevel?.(Math.min(1, level * 2.2));
			this.rafId = requestAnimationFrame(tick);
		};
		this.rafId = requestAnimationFrame(tick);
	}

	private stopMeter(): void {
		if (this.rafId) cancelAnimationFrame(this.rafId);
		this.rafId = 0;
		this.hooks.onLevel?.(0);
	}
}
