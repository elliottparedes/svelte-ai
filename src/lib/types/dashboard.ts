export interface ChatMessageToolCall {
	name: string;
	arguments?: Record<string, unknown>;
	result?: string;
}

export interface ChatMessage {
	id: string;
	role: 'user' | 'assistant' | 'tool';
	content: string;
	/** Reasoning-model chain-of-thought (streamed + persisted when present). */
	reasoningContent?: string;
	createdAt?: Date | string;
	toolCall?: ChatMessageToolCall;
}

export interface Conversation {
	id: string;
	title: string;
	projectId?: string | null;
	modelId?: string | null;
	createdAt: Date | string;
}

export interface Project {
	id: string;
	name: string;
	systemPrompt?: string | null;
}

export interface Model {
	id: string;
	name: string;
	supportsVision?: boolean;
	supportsFiles?: boolean;
	/** When false, server omits tool definitions for this model id. */
	supportsTools?: boolean;
	/** From OpenRouter model catalog (`context_length`). */
	contextLength?: number;
	/** From OpenRouter (`top_provider.max_completion_tokens` or similar). */
	maxCompletionTokens?: number;
}

export interface ModelProviderGroup {
	label: string;
	models: Model[];
}

export type ChatAttachmentInputType = 'image' | 'text' | 'file';

export interface ChatAttachmentInput {
	type: ChatAttachmentInputType;
	name: string;
	dataUrl?: string;
	content?: string;
	mimeType?: string;
}

export type { PublicUser as DashboardUser } from './app';

/** Matches dashboard `+page.server` load shape. */
export interface DashboardPageLoadData {
	conversations: Conversation[];
	projects: Project[];
	models: Model[];
	modelGroups: ModelProviderGroup[];
	defaultModelId: string;
	/** True when ELEVENLABS_API_KEY is configured. */
	ttsEnabled: boolean;
}
