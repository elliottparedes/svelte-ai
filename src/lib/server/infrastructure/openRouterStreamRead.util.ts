export class StreamIdleTimeoutError extends Error {
	constructor(idleMs: number) {
		super(`OpenRouter stream idle for ${idleMs}ms`);
		this.name = 'StreamIdleTimeoutError';
	}
}

/** Abort a stalled SSE body read when the provider stops sending chunks. */
export async function readStreamChunkWithIdleTimeout(
	reader: ReadableStreamDefaultReader<Uint8Array>,
	idleMs: number
): Promise<ReadableStreamReadResult<Uint8Array>> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<never>((_, reject) => {
		timer = setTimeout(() => reject(new StreamIdleTimeoutError(idleMs)), idleMs);
	});
	try {
		return await Promise.race([reader.read(), timeout]);
	} finally {
		if (timer) clearTimeout(timer);
	}
}
