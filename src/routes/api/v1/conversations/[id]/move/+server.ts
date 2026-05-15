import type { RequestHandler } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import { ProjectRepository } from '$lib/server/repositories/ProjectRepository';
import { ChatRepository } from '$lib/server/repositories/ChatRepository';
import { ProjectService } from '$lib/server/services/ProjectService';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Unauthorized');

	const conversationId = params.id;
	if (!conversationId) error(400, 'Missing conversation id');

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}

	const { projectId } = body as Record<string, unknown>;
	const service = new ProjectService(new ProjectRepository(), new ChatRepository());
	const updated = await service.moveConversationToProject(
		user.id,
		conversationId,
		typeof projectId === 'string' ? projectId : null
	);
	return json({ conversation: updated });
};
