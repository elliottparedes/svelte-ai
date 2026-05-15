import type { RequestHandler } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import { ProjectRepository } from '$lib/server/repositories/ProjectRepository';
import { ChatRepository } from '$lib/server/repositories/ChatRepository';
import { ProjectService } from '$lib/server/services/ProjectService';

export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Unauthorized');

	const service = new ProjectService(new ProjectRepository(), new ChatRepository());
	const projects = await service.listProjects(user.id);
	return json({ projects });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Unauthorized');

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}

	const { name, systemPrompt } = body as Record<string, unknown>;
	if (typeof name !== 'string' || !name.trim()) {
		error(400, 'Name is required');
	}

	const service = new ProjectService(new ProjectRepository(), new ChatRepository());
	const project = await service.createProject(user.id, name.trim(), typeof systemPrompt === 'string' ? systemPrompt : undefined);
	return json({ project }, { status: 201 });
};
