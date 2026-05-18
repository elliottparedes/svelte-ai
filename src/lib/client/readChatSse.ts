export type ChatSseEvent =
	| { type: 'chunk'; content: string }
	| { type: 'tool_call'; name: string; arguments?: Record<string, unknown> }
	| { type: 'tool_result'; name: string; result: string }
	| { type: 'title'; conversationId: string; title: string }
	| { type: 'error'; message: string }
	| { type: 'done'; conversationId: string };

export async function* readChatSseStream(
	body: ReadableStream<Uint8Array>
): AsyncGenerator<ChatSseEvent> {
	const reader = body.getReader();
	const decoder = new TextDecoder();
	let carry = '';
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			carry += decoder.decode(value, { stream: true });
			const lines = carry.split('\n');
			carry = lines.pop() ?? '';
			for (const line of lines) {
				if (!line.startsWith('data: ')) continue;
				const json = line.slice(6).trim();
				if (!json) continue;
				try {
					const parsed = JSON.parse(json) as Record<string, unknown>;
					const t = parsed.type;
					if (t === 'chunk') {
						yield { type: 'chunk', content: String(parsed.content ?? '') };
					} else if (t === 'tool_call') {
						yield {
							type: 'tool_call',
							name: String(parsed.name),
							arguments: parsed.arguments as Record<string, unknown> | undefined
						};
					} else if (t === 'tool_result') {
						yield {
							type: 'tool_result',
							name: String(parsed.name),
							result: String(parsed.result ?? '')
						};
					} else if (t === 'title') {
						yield {
							type: 'title',
							conversationId: String(parsed.conversationId ?? ''),
							title: String(parsed.title ?? '')
						};
					} else if (t === 'error') {
						yield {
							type: 'error',
							message: String(parsed.message ?? 'An error occurred')
						};
					} else if (t === 'done') {
						yield { type: 'done', conversationId: String(parsed.conversationId ?? '') };
					}
				} catch {
					// ignore malformed JSON lines
				}
			}
		}
	} finally {
		reader.releaseLock();
	}
}
