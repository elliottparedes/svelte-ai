/** Rough token estimate (~4 chars/token); aligns UI hint with server-side trim heuristic. */
const CHARS_PER_TOKEN = 4;
const PER_MESSAGE_OVERHEAD = 4;
/** Full tool stack baseline; matches `estimateChatToolsTurnTokens` for all tools. */
export const ESTIMATED_TOOL_SYSTEM_TOKENS = 3200;

export function estimateTokensFromText(text: string): number {
	if (!text) return 0;
	return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export type TokenEstimatableMessage = {
	role: string;
	content: string;
	toolCall?: { name?: string; arguments?: unknown; result?: string };
	toolCalls?: readonly { name: string; arguments: Record<string, unknown> }[];
};

export function estimateMessageTokens(m: TokenEstimatableMessage): number {
	let t = estimateTokensFromText(m.content) + PER_MESSAGE_OVERHEAD;
	if (m.toolCall) {
		t += estimateTokensFromText(
			(m.toolCall.name ?? '') +
				JSON.stringify(m.toolCall.arguments ?? {}) +
				(m.toolCall.result ?? '')
		);
	}
	if (m.toolCalls?.length) {
		for (const tc of m.toolCalls) {
			t += PER_MESSAGE_OVERHEAD + estimateTokensFromText(tc.name + JSON.stringify(tc.arguments));
		}
	}
	return t;
}

export function estimateMessagesTokens(messages: readonly TokenEstimatableMessage[]): number {
	let s = 0;
	for (const m of messages) s += estimateMessageTokens(m);
	return s;
}

export function estimateAttachmentInputTokens(
	attachments: readonly { type: string; dataUrl?: string; content?: string }[]
): number {
	let s = 0;
	for (const a of attachments) {
		if (a.type === 'image' && a.dataUrl) s += Math.ceil(a.dataUrl.length / CHARS_PER_TOKEN);
		else if (a.content) s += estimateTokensFromText(a.content);
		else if (a.type === 'file' && a.dataUrl) s += Math.ceil(a.dataUrl.length / CHARS_PER_TOKEN);
	}
	return s;
}
