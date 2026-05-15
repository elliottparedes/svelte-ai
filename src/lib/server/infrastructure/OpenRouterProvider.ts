import type {
	ChatProvider,
	ChatMessage,
	ChatStreamChunk,
	ChatModel,
	ChatAttachment,
	ToolDefinition
} from '../domain/ChatProvider.interface';
import { parseGoSseDataLine } from './openCodeGoParseLine';
import { ToolCallAccumulator } from './ToolCallAccumulator';
import { formatOpenRouterMessages } from './openRouterFormat';
import { applyOpenRouterStreamPayloadOptions } from './openRouterChatRequest.util';
import { openRouterPdfPluginsForChat } from './openRouterPdfPlugin.util';

const BASE = 'https://openrouter.ai/api/v1';

export class OpenRouterProvider implements ChatProvider {
	constructor(
		private readonly apiKey: string,
		private readonly httpReferer?: string
	) {}

	private headers(): Record<string, string> {
		const h: Record<string, string> = {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${this.apiKey}`,
			'X-Title': 'AI Chat Platform'
		};
		if (this.httpReferer) h['HTTP-Referer'] = this.httpReferer;
		return h;
	}

	async *streamResponse(
		messages: readonly ChatMessage[],
		attachments?: readonly ChatAttachment[],
		tools?: readonly ToolDefinition[],
		options?: Record<string, unknown>
	): AsyncGenerator<ChatStreamChunk, void, unknown> {
		const formattedMsgs = formatOpenRouterMessages(messages, attachments);
		const payload: Record<string, unknown> = {
			model: options?.model as string,
			messages: formattedMsgs,
			stream: true,
			temperature: (options?.temperature as number) ?? 0.7,
			max_tokens: (options?.maxTokens as number) ?? 4096
		};
		if (tools && tools.length > 0) {
			payload.tools = tools.map((t) => ({
				type: 'function',
				function: { name: t.name, description: t.description, parameters: t.parameters }
			}));
		}
		const pdfPlugins = openRouterPdfPluginsForChat(attachments, options?.model as string | undefined);
		if (pdfPlugins) payload.plugins = pdfPlugins;
		applyOpenRouterStreamPayloadOptions(payload, options);

		const res = await fetch(`${BASE}/chat/completions`, {
			method: 'POST',
			headers: this.headers(),
			body: JSON.stringify(payload)
		});

		if (!res.ok) {
			const detail = (await res.text().catch(() => '')).slice(0, 800);
			throw new Error(`OpenRouter error: ${res.status} ${res.statusText}${detail ? ` — ${detail}` : ''}`);
		}

		const reader = res.body?.getReader();
		if (!reader) throw new Error('No response body');
		const decoder = new TextDecoder();
		let buffer = '';
		const toolAccumulator = new ToolCallAccumulator();
		let reasoningBuffer = '';

		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() ?? '';
				for (const line of lines) {
					const parsed = parseGoSseDataLine(line);
					if (!parsed) continue;
					if (parsed.reasoningChunk) reasoningBuffer += parsed.reasoningChunk;
					if (parsed.textChunk) yield { content: parsed.textChunk, done: false };
					if (parsed.toolDeltas) toolAccumulator.feed(parsed.toolDeltas);
					if (parsed.done) {
						if (!toolAccumulator.isEmpty()) {
							const calls = toolAccumulator.build();
							if (calls.length > 0) {
								yield { toolCall: calls[0], reasoningContent: reasoningBuffer, done: false };
								return;
							}
						}
						yield { content: '', done: true };
						return;
					}
				}
			}
		} finally {
			reader.releaseLock();
		}
		if (!toolAccumulator.isEmpty()) {
			const calls = toolAccumulator.build();
			if (calls.length > 0) {
				yield { toolCall: calls[0], reasoningContent: reasoningBuffer, done: false };
			}
		}
	}

	async listModels(): Promise<readonly ChatModel[]> {
		const res = await fetch(`${BASE}/models`, { headers: this.headers() });
		if (!res.ok) {
			const detail = (await res.text().catch(() => '')).slice(0, 800);
			throw new Error(`OpenRouter models error: ${res.status}${detail ? ` — ${detail}` : ''}`);
		}
		const json = (await res.json()) as {
			data: Array<{
				id: string;
				name: string;
				architecture?: { input_modalities?: string[]; output_modalities?: string[] };
				supported_parameters?: string[];
			}>;
		};
		return json.data.map((m) => {
			const mods = m.architecture?.input_modalities ?? [];
			const out = m.architecture?.output_modalities ?? [];
			const params = m.supported_parameters;
			const supportsTools = !Array.isArray(params) || params.includes('tools');
			const openRouterModalities = out.includes('image')
				? out.includes('text')
					? (['image', 'text'] as const)
					: (['image'] as const)
				: undefined;
			return {
				id: m.id,
				name: m.name || m.id,
				supportsVision: mods.includes('image'),
				supportsFiles: mods.includes('file'),
				supportsTools,
				...(openRouterModalities ? { openRouterModalities } : {})
			};
		});
	}
}
