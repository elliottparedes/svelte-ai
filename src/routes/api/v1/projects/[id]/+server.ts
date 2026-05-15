import type { RequestHandler } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import { ProjectRepository } from '$lib/server/repositories/ProjectRepository';
import { ChatRepository } from '$lib/server/repositories/ChatRepository';
import { ProjectService } from '$lib/server/services/ProjectService';

export const GET: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Unauthorized');

	const projectId = params.id;
	if (!projectId) error(400, 'Missing project id');

	const service = new ProjectService(new ProjectRepository(), new ChatRepository());
	const conversations = await service.getProjectConversations(user.id, projectId);
	return json({ conversations });
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Unauthorized');

	const projectId = params.id;
	if (!projectId) error(400, 'Missing project id');

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}

	const { name, systemPrompt } = body as Record<string, unknown>;
	const service = new ProjectService(new ProjectRepository(), new ChatRepository());
	const updated = await service.updateProject(
		user.id,
		projectId,
		typeof name === 'string' ? name.trim() : undefined,
		typeof systemPrompt === 'string' ? systemPrompt : undefined
	);
	return json({ project: updated });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Unauthorized');

	const projectId = params.id;
	if (!projectId) error(400, 'Missing project id');

	const service = new ProjectService(new ProjectRepository(), new ChatRepository());
	await service.deleteProject(user.id, projectId);
	return json({ success: true });
};
