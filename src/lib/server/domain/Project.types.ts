export interface Project {
	id: string;
	userId: string;
	name: string;
	systemPrompt: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateProjectInput {
	userId: string;
	name: string;
	systemPrompt?: string;
}

export interface UpdateProjectInput {
	name?: string;
	systemPrompt?: string;
}
