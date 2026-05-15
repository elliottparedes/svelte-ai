export interface ChatMessageToolCall {
	name: string;
	arguments?: Record<string, unknown>;
	result?: string;
}

export interface ChatMessage {
	id: string;
	role: 'user' | 'assistant' | 'tool';
	content: string;
	createdAt?: Date | string;
	toolCall?: ChatMessageToolCall;
}

export interface Conversation {
	id: string;
	title: string;
	projectId?: string | null;
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
}

export type ChatAttachmentInputType = 'image' | 'text' | 'file';

export interface ChatAttachmentInput {
	type: ChatAttachmentInputType;
	name: string;
	dataUrl?: string;
	content?: string;
	mimeType?: string;
}

export interface DashboardUser {
	name: string | null;
	email: string;
}

/** Matches dashboard `+page.server` load shape. */
export interface DashboardPageLoadData {
	conversations: Conversation[];
	projects: Project[];
	models: Model[];
	defaultModelId: string;
}
