import type { ChatMessage } from '$lib/types/dashboard';

export type MessageCache = Record<string, ChatMessage[]>;

export function flushMessageCache(
	cache: MessageCache,
	conversationId: string | null,
	messages: ChatMessage[]
): MessageCache {
	if (!conversationId || messages.length === 0) return cache;
	return { ...cache, [conversationId]: messages };
}

export function migrateMessageCache(cache: MessageCache, from: string, to: string): MessageCache {
	if (from === to || !cache[from]) return cache;
	const next = { ...cache, [to]: cache[from] };
	delete next[from];
	return next;
}

export function patchStreamingSet(ids: ReadonlySet<string>, id: string, streaming: boolean): Set<string> {
	const next = new Set(ids);
	if (streaming) next.add(id);
	else next.delete(id);
	return next;
}
