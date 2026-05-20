import type { ChatMessage } from '$lib/types/dashboard';
import {
	imageGenerationMarkdown,
	parseImageGenerationToolResult
} from '$lib/shared/imageGenerationToolResult';

function toolResultText(m: ChatMessage): string | undefined {
	if (m.toolCall?.result) return m.toolCall.result;
	if (m.role === 'tool' && m.content.trim()) return m.content;
	return undefined;
}

function withToolCall(m: ChatMessage, result: string): ChatMessage {
	if (m.toolCall) return m;
	return {
		...m,
		toolCall: { name: 'generate_image', arguments: {}, result }
	};
}

function nextShowsImage(messages: readonly ChatMessage[], index: number, imageUrl: string): boolean {
	const next = messages[index + 1];
	return Boolean(next?.role === 'assistant' && next.content.includes(imageUrl));
}

/** Insert assistant markdown image messages after successful generate_image tool rows. */
export function hydrateGenerateImageMessages(messages: readonly ChatMessage[]): ChatMessage[] {
	const out: ChatMessage[] = [];
	for (let i = 0; i < messages.length; i++) {
		const m = messages[i];
		if (m.role !== 'tool') {
			out.push(m);
			continue;
		}
		const name = m.toolCall?.name;
		const result = toolResultText(m);
		const isGenerateImage =
			name === 'generate_image' || (!name && parseImageGenerationToolResult(result)?.ok);
		if (!isGenerateImage) {
			out.push(m);
			continue;
		}
		const payload = parseImageGenerationToolResult(result);
		out.push(withToolCall(m, result ?? ''));
		if (payload?.ok && payload.imageUrl && !nextShowsImage(messages, i, payload.imageUrl)) {
			out.push({
				id: `gen-img-${m.id}`,
				role: 'assistant',
				content: imageGenerationMarkdown(payload),
				createdAt: m.createdAt ?? new Date()
			});
		}
	}
	return out;
}
