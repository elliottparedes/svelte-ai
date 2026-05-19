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
import {
	fetchOpenRouterChatModelsCached,
	promptInputBudgetForModel
} from './openRouterModelsCatalog';

const BASE = 'https://openrouter.ai/api/v1';

export class OpenRouterProvider implements ChatProvider {
	constructor(
		private readonly apiKey: string,
		private readonly httpReferer?: string
	) {}

	private modelsCacheKey(): string {
		return `${this.apiKey.length}:${this.httpReferer ?? ''}`;
	}

	private headers(): Record<string, string> {
		const h: Record<string, string> = {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${this.apiKey}`,
			'X-Title': 'Inkstream'
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
		return fetchOpenRouterChatModelsCached(this.modelsCacheKey(), this.headers());
	}

	async getPromptTokenBudget(modelId: string): Promise<number | null> {
		const models = await this.listModels();
		return promptInputBudgetForModel(models, modelId);
	}
}
