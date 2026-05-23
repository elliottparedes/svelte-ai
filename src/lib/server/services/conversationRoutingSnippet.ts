import type { ChatMessage } from '../domain/ChatProvider.interface';

/** Short context for the router LLM (not the full thread). */
export function buildRoutingHistorySnippet(messages: readonly ChatMessage[]): string | undefined {
	if (messages.length === 0) return undefined;
	const lines: string[] = [];
	for (const m of messages.slice(-4)) {
		const role = m.role === 'assistant' ? 'assistant' : m.role;
		const text = m.content.replace(/\s+/g, ' ').trim().slice(0, 180);
		if (text) lines.push(`${role}: ${text}`);
	}
	return lines.length ? lines.join('\n') : undefined;
}
