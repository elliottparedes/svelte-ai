export interface Conversation {
	id: string;
	userId: string;
	projectId: string | null;
	title: string;
	modelId: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateConversationInput {
	userId: string;
	projectId?: string;
	title: string;
	modelId?: string;
}

export interface UpdateConversationInput {
	title?: string;
	projectId?: string | null;
	modelId?: string;
}
