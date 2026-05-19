import type { RequestHandler } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import { UserRepository } from '$lib/server/repositories/UserRepository';
import { handleDomainError } from '$lib/server/domain/DomainError';
import { parseProfileAltModelIds, profileAltModelsSchema } from '$lib/server/validation/profile.schema';

export const PATCH: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Unauthorized');

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}

	const parsed = profileAltModelsSchema.safeParse(body);
	if (!parsed.success) {
		error(400, parsed.error.issues.map((i) => i.message).join(', '));
	}

	const repo = new UserRepository();
	try {
		const enabledIds = parseProfileAltModelIds(parsed.data);
		await repo.updateAltModelIds(user.id, enabledIds);
		return json({ enabledIds });
	} catch (err) {
		handleDomainError(err);
	}
};
