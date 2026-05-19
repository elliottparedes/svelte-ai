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
	lang?: string;
}): SpeechRecognizer | null {
	const Ctor = getSpeechRecognitionCtor();
	if (!Ctor) {
		return { start: () => {}, stop: () => {}, abort: () => {}, isSupported: false };
	}

	const rec = new Ctor();
	rec.continuous = false;
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

	rec.onerror = (ev) => opts.onError?.(ev.error === 'not-allowed' ? 'Microphone access denied' : ev.error);
	rec.onend = () => opts.onEnd?.();

	return {
		isSupported: true,
		start: () => {
			try {
				rec.start();
			} catch {
				/* already started */
			}
		},
		stop: () => rec.stop(),
		abort: () => rec.abort()
	};
}
