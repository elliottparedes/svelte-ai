import type { OpenRouterUsage } from '../domain/OpenRouterUsage.types';
import { parseOpenRouterUsage } from './openRouterUsage.util';
import { textFromOpenRouterDelta } from './openRouterStreamDelta';

export type GoStreamParsed = {
	textChunk?: string;
	reasoningChunk?: string;
	usage?: OpenRouterUsage;
	toolDeltas?: Array<{
		index?: number;
		id?: string;
		type?: string;
		function?: { name?: string | null; arguments?: string };
	}>;
	/** OpenRouter sent `data: [DONE]` — end of HTTP stream. */
	streamDone?: boolean;
	/** Model finished with tool_calls (provider should yield tool call and stop). */
	toolCallsFinish?: boolean;
};

export function parseGoSseDataLine(line: string): GoStreamParsed | null {
	const trimmed = line.trim();
	if (!trimmed || !trimmed.startsWith('data: ')) return null;
	const data = trimmed.slice(6);
	if (data === '[DONE]') return { streamDone: true };

	try {
		const parsed = JSON.parse(data) as {
			usage?: unknown;
			choices?: Array<{
				delta?: {
					content?: unknown;
					reasoning_content?: string;
					reasoning?: string;
					reasoning_details?: unknown;
					tool_calls?: GoStreamParsed['toolDeltas'];
				};
				finish_reason?: string | null;
			}>;
		};
		const usage = parseOpenRouterUsage(parsed.usage);
		const choice = parsed.choices?.[0];
		const delta = choice?.delta;
		if (delta?.tool_calls) {
			const out: GoStreamParsed = { toolDeltas: delta.tool_calls };
			if (usage) out.usage = usage;
			return out;
		}
		const { text, reasoning } = textFromOpenRouterDelta(delta);
		if (choice?.finish_reason === 'tool_calls') {
			const result: GoStreamParsed = { toolCallsFinish: true };
			if (text) result.textChunk = text;
			if (reasoning) result.reasoningChunk = reasoning;
			if (usage) result.usage = usage;
			return result;
		}
		if (choice?.finish_reason === 'stop') {
			const result: GoStreamParsed = {};
			if (text) result.textChunk = text;
			if (reasoning) result.reasoningChunk = reasoning;
			if (usage) result.usage = usage;
			return Object.keys(result).length > 0 ? result : null;
		}
		if (usage && !choice) return { usage };
		const result: GoStreamParsed = {};
		if (text) result.textChunk = text;
		if (reasoning) result.reasoningChunk = reasoning;
		if (usage) result.usage = usage;
		return Object.keys(result).length > 0 ? result : null;
	} catch {
		return null;
	}
}
