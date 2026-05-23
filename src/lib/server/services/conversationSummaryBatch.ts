import type { ChatMessage } from '../domain/ChatProvider.interface';

const SUMMARIZER_MSG_CHARS = 800;

export function filterSummarizableMessages(messages: readonly ChatMessage[]): ChatMessage[] {
	return messages.filter((m) => m.role === 'user' || m.role === 'assistant');
}

export function messagesAfterWatermark(
	all: readonly ChatMessage[],
	watermarkId: string | null
): ChatMessage[] {
	if (!watermarkId) return [...all];
	const idx = all.findIndex((m) => m.id === watermarkId);
	if (idx === -1) return [...all];
	return all.slice(idx + 1);
}

/** Oldest `interval` user/assistant rows from the zone before the hot tail. */
export function pickSummaryBatch(
	summarizable: readonly ChatMessage[],
	interval: number,
	hotTail: number
): ChatMessage[] {
	if (summarizable.length <= hotTail) return [];
	const compressible = summarizable.slice(0, summarizable.length - hotTail);
	if (compressible.length < interval) return [];
	return compressible.slice(0, interval);
}

export function formatMessagesForSummarizer(batch: readonly ChatMessage[]): string {
	return batch
		.map((m) => {
			const text = m.content.replace(/\s+/g, ' ').trim().slice(0, SUMMARIZER_MSG_CHARS);
			return `${m.role}: ${text}`;
		})
		.join('\n');
}
