const SPLITTERS = new Set(['.', ',', '?', '!', ';', ':', '—', '-', '(', ')', '[', ']', '}', ' ']);

/** Buffer streaming tokens so ElevenLabs gets phrase-sized chunks. */
export function createTtsTextChunker(onChunk: (text: string) => void) {
	let buffer = '';
	return {
		push(delta: string) {
			if (!delta) return;
			for (const ch of delta) {
				buffer += ch;
				if (SPLITTERS.has(ch)) {
					onChunk(buffer);
					buffer = '';
				}
			}
		},
		flush() {
			if (buffer) {
				onChunk(buffer.endsWith(' ') ? buffer : `${buffer} `);
				buffer = '';
			}
		}
	};
}
