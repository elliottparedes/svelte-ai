import type { ProjectRepository } from '../repositories/ProjectRepository';
import type { ChatRepository } from '../repositories/ChatRepository';
import { DomainError } from '../domain/DomainError';

export class ProjectService {
	constructor(
		private readonly projectRepo: ProjectRepository,
		private readonly chatRepo: ChatRepository
	) {}

	async listProjects(userId: string) {
		return this.projectRepo.findByUserId(userId);
	}

	async createProject(userId: string, name: string, systemPrompt?: string) {
		return this.projectRepo.create({ userId, name, systemPrompt });
	}

	async updateProject(userId: string, projectId: string, name?: string, systemPrompt?: string) {
		const proj = await this.projectRepo.findById(projectId);
		if (!proj || proj.userId !== userId) throw new DomainError('Project not found', 404);
		return this.projectRepo.update(projectId, { name, systemPrompt });
	}

	async deleteProject(userId: string, projectId: string) {
		const proj = await this.projectRepo.findById(projectId);
		if (!proj || proj.userId !== userId) throw new DomainError('Project not found', 404);

		const convs = await this.chatRepo.findByProjectId(projectId);
		for (const c of convs) {
			await this.chatRepo.update(c.id, { projectId: null });
		}
		await this.projectRepo.delete(projectId);
	}

	async getProjectConversations(userId: string, projectId: string) {
		const proj = await this.projectRepo.findById(projectId);
		if (!proj || proj.userId !== userId) throw new DomainError('Project not found', 404);
		return this.chatRepo.findByProjectId(projectId);
	}

	async moveConversationToProject(userId: string, conversationId: string, projectId: string | null) {
		const conv = await this.chatRepo.findById(conversationId);
		if (!conv || conv.userId !== userId) throw new DomainError('Conversation not found', 404);
		if (projectId) {
			const proj = await this.projectRepo.findById(projectId);
			if (!proj || proj.userId !== userId) throw new DomainError('Project not found', 404);
		}
		return this.chatRepo.update(conversationId, { projectId });
	}
}
