export type SpeechRecognizer = {
	start: () => void;
	stop: () => void;
	abort: () => void;
	isSupported: boolean;
};

type SpeechResultLike = {
	resultIndex: number;
	results: {
		length: number;
		[i: number]: { isFinal: boolean; [j: number]: { transcript?: string } | undefined };
	};
};

type SpeechRecognitionCtor = new () => {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	onresult: ((ev: SpeechResultLike) => void) | null;
	onerror: ((ev: { error: string }) => void) | null;
	onend: (() => void) | null;
	start: () => void;
	stop: () => void;
	abort: () => void;
};

const TRANSIENT_ERRORS = new Set(['aborted', 'no-speech']);

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
	if (typeof window === 'undefined') return null;
	const w = window as Window & {
		SpeechRecognition?: SpeechRecognitionCtor;
		webkitSpeechRecognition?: SpeechRecognitionCtor;
	};
	return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Browser speech-to-text (Web Speech API). */
export function createSpeechRecognizer(opts: {
	onFinal: (text: string) => void;
	onInterim?: (text: string) => void;
	onError?: (message: string) => void;
	onEnd?: () => void;
	/** Keep mic open between phrases (recommended for immersive voice). */
	continuous?: boolean;
	lang?: string;
}): SpeechRecognizer | null {
	const Ctor = getSpeechRecognitionCtor();
	if (!Ctor) {
		return { start: () => {}, stop: () => {}, abort: () => {}, isSupported: false };
	}

	const rec = new Ctor();
	let listening = false;
	let restartTimer: ReturnType<typeof setTimeout> | undefined;

	rec.continuous = opts.continuous ?? false;
	rec.interimResults = true;
	rec.lang = opts.lang ?? 'en-US';

	rec.onresult = (ev) => {
		let interim = '';
		let final = '';
		for (let i = ev.resultIndex; i < ev.results.length; i++) {
			const r = ev.results[i]!;
			const t = r[0]?.transcript ?? '';
			if (r.isFinal) final += t;
			else interim += t;
		}
		if (interim && opts.onInterim) opts.onInterim(interim.trim());
		if (final.trim()) opts.onFinal(final.trim());
	};

	rec.onerror = (ev) => {
		if (TRANSIENT_ERRORS.has(ev.error)) return;
		const msg =
			ev.error === 'not-allowed'
				? 'Microphone access denied — allow mic in browser settings'
				: ev.error === 'network'
					? 'Speech recognition network error'
					: `Speech error: ${ev.error}`;
		opts.onError?.(msg);
	};

	rec.onend = () => {
		listening = false;
		opts.onEnd?.();
	};

	const safeStart = () => {
		if (listening) return;
		try {
			rec.start();
			listening = true;
		} catch {
			restartTimer = setTimeout(() => {
				try {
					rec.start();
					listening = true;
				} catch {
					/* still busy */
				}
			}, 280);
		}
	};

	return {
		isSupported: true,
		start: safeStart,
		stop: () => {
			if (restartTimer) clearTimeout(restartTimer);
			if (listening) rec.stop();
		},
		abort: () => {
			if (restartTimer) clearTimeout(restartTimer);
			listening = false;
			rec.abort();
		}
	};
}
