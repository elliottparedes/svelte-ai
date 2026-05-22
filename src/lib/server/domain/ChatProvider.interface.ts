export interface ChatMessage {
	id: string;
	role: 'user' | 'assistant' | 'system' | 'tool';
	content: string;
	createdAt: Date;
	toolCallId?: string;
	toolCalls?: readonly ToolCall[];
	reasoningContent?: string;
}

export interface ToolDefinition {
	name: string;
	description: string;
	parameters: Record<string, unknown>;
}

export interface ToolCall {
	id: string;
	name: string;
	arguments: Record<string, unknown>;
}

export interface ToolResult {
	toolCallId: string;
	content: string;
}

export interface ChatStreamChunk {
	content?: string;
	reasoningContent?: string;
	toolCall?: ToolCall;
	done: boolean;
}

export interface ChatModel {
	id: string;
	name: string;
	description?: string;
	supportsVision?: boolean;
	supportsFiles?: boolean;
	/** From OpenRouter; when false, do not send function tools for this model. */
	supportsTools?: boolean;
	/** OpenRouter `supported_parameters` includes `reasoning`. */
	supportsReasoning?: boolean;
	/** From OpenRouter `modalities` for image-generation models (e.g. `['image','text']`). */
	openRouterModalities?: readonly string[];
	/** OpenRouter total context window (tokens), when provided by the catalog. */
	contextLength?: number;
	/** Provider max completion tokens hint (tokens reserved from the window for the reply). */
	maxCompletionTokens?: number;
}

export interface ChatAttachment {
	type: 'image' | 'text' | 'file';
	name: string;
	dataUrl?: string;
	content?: string;
	mimeType?: string;
}

export interface ChatProvider {
	streamResponse(
		messages: readonly ChatMessage[],
		attachments?: readonly ChatAttachment[],
		tools?: readonly ToolDefinition[],
		options?: Record<string, unknown>
	): AsyncGenerator<ChatStreamChunk, void, unknown>;

	listModels(): Promise<readonly ChatModel[]>;
	/** Max estimated prompt tokens before trimming history (OpenRouter: from model catalog). */
	getPromptTokenBudget?(modelId: string): Promise<number | null>;
}
