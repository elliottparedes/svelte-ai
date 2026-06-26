import type { ChatMessage } from '$lib/types/dashboard';

const roleWeight: Record<ChatMessage['role'], number> = { user: 0, assistant: 1, tool: 2 };

export function orderChatMessages(messages: readonly ChatMessage[]): ChatMessage[] {
	return [...messages]
		.map((msg, index) => ({ msg, index }))
		.sort((a, b) => {
			if (a.msg.turnId && a.msg.turnId === b.msg.turnId) {
				const roleDelta = roleWeight[a.msg.role] - roleWeight[b.msg.role];
				if (roleDelta !== 0) return roleDelta;
				const seqDelta = (a.msg.turnSequence ?? 0) - (b.msg.turnSequence ?? 0);
				if (seqDelta !== 0) return seqDelta;
			}
			const timeDelta = new Date(a.msg.createdAt ?? 0).getTime() - new Date(b.msg.createdAt ?? 0).getTime();
			return timeDelta !== 0 ? timeDelta : a.index - b.index;
		})
		.map((row) => row.msg);
}
