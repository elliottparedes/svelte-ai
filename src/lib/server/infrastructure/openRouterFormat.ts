import type { ChatAttachment, ChatMessage } from '../domain/ChatProvider.interface';

/**
 * OpenRouter /v1/chat/completions message shape (OpenAI-compatible + file parts for PDFs).
 */
export function formatOpenRouterMessages(
	messages: readonly ChatMessage[],
	attachments?: readonly ChatAttachment[]
): Array<Record<string, unknown>> {
	const hasAttachments = attachments && attachments.length > 0;

	return messages.map((m) => {
		if (m.role === 'tool') {
			return { role: 'tool', tool_call_id: m.toolCallId, content: m.content };
		}

		if (m.role === 'assistant' && m.toolCalls && m.toolCalls.length > 0) {
			const msg: Record<string, unknown> = {
				role: 'assistant',
				content: m.content?.trim() ? m.content : null,
				tool_calls: m.toolCalls.map((tc) => ({
					id: tc.id,
					type: 'function',
					function: { name: tc.name, arguments: JSON.stringify(tc.arguments) }
				}))
			};
			if (m.reasoningContent !== undefined) {
				msg.reasoning_content = m.reasoningContent;
			}
			return msg;
		}

		if (m.role !== 'user' || !hasAttachments) {
			return { role: m.role, content: m.content };
		}

		const isLastUser = m === messages.filter((x) => x.role === 'user').at(-1);
		if (!isLastUser) {
			return { role: m.role, content: m.content };
		}

		const content: Array<Record<string, unknown>> = [{ type: 'text', text: m.content }];
		for (const a of attachments!) {
			if (a.type === 'image' && a.dataUrl) {
				content.push({ type: 'image_url', image_url: { url: a.dataUrl } });
			} else if (a.type === 'file' && a.dataUrl) {
				content.push({
					type: 'file',
					file: { filename: a.name, file_data: a.dataUrl }
				});
			}
		}
		return { role: m.role, content };
	});
}
