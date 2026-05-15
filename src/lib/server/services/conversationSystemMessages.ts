import type { ChatMessage } from '../domain/ChatProvider.interface';
import type { ProjectRepository } from '../repositories/ProjectRepository';
import { TOOL_SYSTEM_PROMPT } from './conversationTools.config';

export async function buildSystemMessagesForTurn(
	conv: { projectId?: string | null } | null,
	projectRepo: ProjectRepository | undefined,
	toolSystemContent: string = TOOL_SYSTEM_PROMPT
): Promise<ChatMessage[]> {
	const systemMessages: ChatMessage[] = [
		{ id: 'system-tools', role: 'system', content: toolSystemContent, createdAt: new Date() }
	];
	if (conv?.projectId && projectRepo) {
		const project = await projectRepo.findById(conv.projectId);
		if (project?.systemPrompt) {
			systemMessages.push({
				id: 'system-project',
				role: 'system',
				content: project.systemPrompt,
				createdAt: new Date()
			});
		}
	}
	return systemMessages;
}
