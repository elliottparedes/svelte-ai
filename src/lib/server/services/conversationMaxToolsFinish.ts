import type { ChatAttachment, ChatMessage, ChatProvider } from '../domain/ChatProvider.interface';

/** Shown when the tool-turn budget is exhausted and the synthesis pass returns nothing. */
export const MAX_TOOL_BUDGET_FALLBACK_REPLY =
	'I hit the tool-call limit before I could wrap up. Scroll up for what I found, or ask a narrower question and I can try again.';

async function* yieldFinalTurnWithoutTools(
	provider: ChatProvider,
	history: ChatMessage[],
	imageAttachments: readonly ChatAttachment[] | undefined,
	options: Record<string, unknown> | undefined
): AsyncGenerator<
	{ type: 'chunk'; content: string } | { type: 'reasoning'; content: string },
	void,
	unknown
> {
	for await (const chunk of provider.streamResponse(history, imageAttachments, undefined, options)) {
		if (chunk.toolCall) break;
		if (chunk.done) break;
		if (chunk.reasoningContent) {
			yield { type: 'reasoning' as const, content: chunk.reasoningContent };
		}
		yield { type: 'chunk' as const, content: chunk.content ?? '' };
	}
}

export type BudgetSynthEvent =
	| { kind: 'chunk'; content: string }
	| { kind: 'reasoning'; content: string }
	| { kind: 'done'; reply: string; reasoning: string };

/** Streams assistant chunks after tool budget is exhausted, then emits final `reply` for persistence. */
export async function* eachBudgetExhaustionChunk(
	provider: ChatProvider,
	history: ChatMessage[],
	imageAttachments: readonly ChatAttachment[] | undefined,
	options: Record<string, unknown> | undefined
): AsyncGenerator<BudgetSynthEvent, void, unknown> {
	let synthesized = '';
	let reasoning = '';
	for await (const part of yieldFinalTurnWithoutTools(provider, history, imageAttachments, options)) {
		if (part.type === 'reasoning') {
			reasoning += part.content;
			yield { kind: 'reasoning', content: part.content };
			continue;
		}
		synthesized += part.content;
		yield { kind: 'chunk', content: part.content };
	}
	if (!synthesized.trim()) {
		yield { kind: 'chunk', content: MAX_TOOL_BUDGET_FALLBACK_REPLY };
	}
	yield {
		kind: 'done',
		reply: synthesized.trim() ? synthesized : MAX_TOOL_BUDGET_FALLBACK_REPLY,
		reasoning
	};
}
