import { ElevenLabsTtsRelay } from '$lib/server/infrastructure/ElevenLabsTtsRelay';

export type TtsStreamLine =
	| { type: 'text'; content: string }
	| { type: 'end' };

export type TtsOutLine =
	| { type: 'audio'; data: string }
	| { type: 'error'; message: string }
	| { type: 'done' };

export type TtsStreamConfig = {
	apiKey: string;
	voiceId: string;
	modelId: string;
};

function parseInputLine(line: string): TtsStreamLine | null {
	try {
		const o = JSON.parse(line) as Record<string, unknown>;
		if (o.type === 'text' && typeof o.content === 'string') {
			return { type: 'text', content: o.content };
		}
		if (o.type === 'end') return { type: 'end' };
	} catch {
		/* ignore */
	}
	return null;
}

/** Pipe NDJSON text in → NDJSON audio lines out. */
export async function runTtsNdjsonStream(
	input: ReadableStream<Uint8Array>,
	writeOut: (line: TtsOutLine) => void,
	config: TtsStreamConfig
): Promise<void> {
	const relay = new ElevenLabsTtsRelay();
	let finalResolve: (() => void) | null = null;
	const finalPromise = new Promise<void>((resolve) => {
		finalResolve = resolve;
	});

	await relay.connect(config, (chunk) => {
		if (chunk.audio.length > 0) {
			writeOut({ type: 'audio', data: Buffer.from(chunk.audio).toString('base64') });
		}
		if (chunk.isFinal) finalResolve?.();
	});

	const reader = input.getReader();
	const decoder = new TextDecoder();
	let carry = '';
	let ended = false;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			carry += decoder.decode(value, { stream: true });
			const lines = carry.split('\n');
			carry = lines.pop() ?? '';
			for (const line of lines) {
				const msg = parseInputLine(line.trim());
				if (!msg) continue;
				if (msg.type === 'text') relay.sendText(msg.content);
				else if (msg.type === 'end') ended = true;
			}
		}
		const tail = parseInputLine(carry.trim());
		if (tail?.type === 'text') relay.sendText(tail.content);
		if (tail?.type === 'end') ended = true;
		if (!ended) ended = true;
		relay.end();
		await finalPromise;
		writeOut({ type: 'done' });
	} finally {
		relay.close();
	}
}
