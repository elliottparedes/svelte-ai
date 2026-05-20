import { fetchConversationThread } from '$lib/client/dashboardRemote';
import type { ChatMessage } from '$lib/types/dashboard';
import { isPendingConversationId } from '$lib/client/dashboardStreamLifecycle';

export function imageGenToolSucceeded(result: string): boolean {
	try {
		const data = JSON.parse(result) as { ok?: boolean };
		return data.ok === true;
	} catch {
		return false;
	}
}

/** Load persisted messages (with image markdown) after a lightweight image-gen SSE stream. */
export async function refetchMessagesAfterImageGen(
	conversationId: string | null
): Promise<ChatMessage[] | null> {
	if (!conversationId || isPendingConversationId(conversationId)) return null;
	const thread = await fetchConversationThread(conversationId);
	if (!thread) return null;
	return thread.messages;
}
