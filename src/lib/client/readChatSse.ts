export type ChatRoutingSource = 'explicit' | 'deep_reasoning' | 'router_llm' | 'heuristic';

export type ChatSseEvent =
	| { type: 'chunk'; content: string }
	| { type: 'reasoning'; content: string }
	| {
			type: 'usage';
			turnCostUsd: number;
			turnLlmCostUsd: number;
			turnToolCostUsd: number;
			turnPromptTokens: number;
			turnCompletionTokens: number;
	  }
	| { type: 'audio'; data: string }
	| { type: 'routing'; modelId: string; source: ChatRoutingSource; tier?: string }
	| {
			type: 'tool_call';
			toolCallId: string;
			name: string;
			arguments?: Record<string, unknown>;
			conversationId?: string;
			turnId?: string;
			execution?: 'client' | 'server';
			sandboxFiles?: { name: string; content: string }[];
			usageSnapshot?: {
				llmCostUsd: number;
				promptTokens: number;
				completionTokens: number;
				externalItems: { provider: string; toolName: string; costUsd: number }[];
			};
	  }
	| { type: 'tool_result'; toolCallId: string; name: string; result: string }
	| { type: 'title'; conversationId: string; title: string }
	| { type: 'summary_start' }
	| { type: 'summary_done'; conversationId: string; summaryThroughMessageId: string; summaryChars: number }
	| { type: 'error'; message: string }
	| { type: 'done'; conversationId: string };

function* parseSseDataLines(lines: string[]): Generator<ChatSseEvent> {
	for (const line of lines) {
		if (!line.startsWith('data: ')) continue;
		const json = line.slice(6).trim();
		if (!json) continue;
		try {
			const parsed = JSON.parse(json) as Record<string, unknown>;
			const t = parsed.type;
			if (t === 'chunk') {
				yield { type: 'chunk', content: String(parsed.content ?? '') };
			} else if (t === 'reasoning') {
				yield { type: 'reasoning', content: String(parsed.content ?? '') };
			} else if (t === 'usage') {
				yield {
					type: 'usage',
					turnCostUsd: Number(parsed.turnCostUsd ?? 0),
					turnLlmCostUsd: Number(parsed.turnLlmCostUsd ?? parsed.turnCostUsd ?? 0),
					turnToolCostUsd: Number(parsed.turnToolCostUsd ?? 0),
					turnPromptTokens: Number(parsed.turnPromptTokens ?? 0),
					turnCompletionTokens: Number(parsed.turnCompletionTokens ?? 0)
				};
			} else if (t === 'audio') {
				yield { type: 'audio', data: String(parsed.data ?? '') };
			} else if (t === 'routing') {
				yield {
					type: 'routing',
					modelId: String(parsed.modelId ?? ''),
					source: String(parsed.source ?? 'heuristic') as ChatRoutingSource,
					tier: parsed.tier != null ? String(parsed.tier) : undefined
				};
			} else if (t === 'tool_call') {
				yield {
					type: 'tool_call',
					toolCallId: String(parsed.toolCallId ?? ''),
					name: String(parsed.name),
					arguments: parsed.arguments as Record<string, unknown> | undefined,
					conversationId: parsed.conversationId != null ? String(parsed.conversationId) : undefined,
					turnId: parsed.turnId != null ? String(parsed.turnId) : undefined,
					execution: parsed.execution === 'client' ? 'client' : 'server',
					sandboxFiles: Array.isArray(parsed.sandboxFiles)
						? (parsed.sandboxFiles as { name: string; content: string }[])
						: undefined,
					usageSnapshot:
						parsed.usageSnapshot && typeof parsed.usageSnapshot === 'object'
							? (parsed.usageSnapshot as {
									llmCostUsd: number;
									promptTokens: number;
									completionTokens: number;
									externalItems: { provider: string; toolName: string; costUsd: number }[];
							  })
							: undefined
				};
			} else if (t === 'tool_result') {
				yield {
					type: 'tool_result',
					toolCallId: String(parsed.toolCallId ?? ''),
					name: String(parsed.name),
					result: String(parsed.result ?? '')
				};
			} else if (t === 'title') {
				yield {
					type: 'title',
					conversationId: String(parsed.conversationId ?? ''),
					title: String(parsed.title ?? '')
				};
			} else if (t === 'summary_start') {
				yield { type: 'summary_start' };
			} else if (t === 'summary_done') {
				yield {
					type: 'summary_done',
					conversationId: String(parsed.conversationId ?? ''),
					summaryThroughMessageId: String(parsed.summaryThroughMessageId ?? ''),
					summaryChars: Number(parsed.summaryChars ?? 0)
				};
			} else if (t === 'error') {
				yield { type: 'error', message: String(parsed.message ?? 'An error occurred') };
			} else if (t === 'done') {
				yield { type: 'done', conversationId: String(parsed.conversationId ?? '') };
			}
		} catch {
			// ignore malformed JSON lines
		}
	}
}

export async function* readChatSseStream(
	body: ReadableStream<Uint8Array>
): AsyncGenerator<ChatSseEvent> {
	const reader = body.getReader();
	const decoder = new TextDecoder();
	let carry = '';
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (value) {
				carry += decoder.decode(value, { stream: true });
				const lines = carry.split('\n');
				carry = lines.pop() ?? '';
				yield* parseSseDataLines(lines);
			}
			if (done) break;
		}
		carry += decoder.decode();
		if (carry.trim()) yield* parseSseDataLines(carry.split('\n'));
	} finally {
		reader.releaseLock();
	}
}
