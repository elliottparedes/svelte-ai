import { textFromOpenRouterDelta } from './openRouterStreamDelta';

export type GoStreamParsed = {
	textChunk?: string;
	reasoningChunk?: string;
	toolDeltas?: Array<{
		index?: number;
		id?: string;
		type?: string;
		function?: { name?: string | null; arguments?: string };
	}>;
	done?: boolean;
};

export function parseGoSseDataLine(line: string): GoStreamParsed | null {
	const trimmed = line.trim();
	if (!trimmed || !trimmed.startsWith('data: ')) return null;
	const data = trimmed.slice(6);
	if (data === '[DONE]') return { done: true };

	try {
		const parsed = JSON.parse(data) as {
			choices?: Array<{
				delta?: {
					content?: unknown;
					reasoning_content?: string;
					reasoning?: string;
					reasoning_details?: unknown;
					tool_calls?: GoStreamParsed['toolDeltas'];
					images?: ReadonlyArray<{ type?: string; image_url?: { url?: string } }>;
				};
				finish_reason?: string;
			}>;
		};
		const choice = parsed.choices?.[0];
		const delta = choice?.delta;
		if (delta?.tool_calls) {
			return { toolDeltas: delta.tool_calls };
		}
		const { text, reasoning } = textFromOpenRouterDelta(delta);
		if (choice?.finish_reason === 'tool_calls' || choice?.finish_reason === 'stop') {
			const result: { textChunk?: string; reasoningChunk?: string; done: true } = { done: true };
			if (text) result.textChunk = text;
			if (reasoning) result.reasoningChunk = reasoning;
			return result;
		}
		const result: { textChunk?: string; reasoningChunk?: string } = {};
		if (text) result.textChunk = text;
		if (reasoning) result.reasoningChunk = reasoning;
		return Object.keys(result).length > 0 ? result : null;
	} catch {
		return null;
	}
}
