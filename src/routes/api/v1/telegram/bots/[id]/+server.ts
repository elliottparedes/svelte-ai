import { error, json, type RequestHandler } from '@sveltejs/kit';
import {
	TELEGRAM_TOKEN_ENCRYPTION_KEY,
	TELEGRAM_WEBHOOK_BASE_URL
} from '$lib/server/db/config';
import { handleDomainError } from '$lib/server/domain/DomainError';
import { TelegramBotRepository } from '$lib/server/repositories/TelegramBotRepository';
import { TelegramBotService } from '$lib/server/services/TelegramBotService';
import { updateTelegramBotSchema } from '$lib/server/validation/telegram.schema';

function service(): TelegramBotService {
	return new TelegramBotService(new TelegramBotRepository(), {
		encryptionKey: TELEGRAM_TOKEN_ENCRYPTION_KEY,
		webhookBaseUrl: TELEGRAM_WEBHOOK_BASE_URL || undefined
	});
}

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) error(401, 'Unauthorized');
	if (!params.id) error(400, 'Missing bot id');
	try {
		const bot = await service().getById(locals.user.id, params.id);
		return json({ bot });
	} catch (err) {
		handleDomainError(err);
	}
};

export const PATCH: RequestHandler = async ({ request, locals, params }) => {
	if (!locals.user) error(401, 'Unauthorized');
	if (!params.id) error(400, 'Missing bot id');
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}
	const parsed = updateTelegramBotSchema.safeParse(body);
	if (!parsed.success) error(400, parsed.error.issues.map((issue) => issue.message).join(', '));
	try {
		const bot = await service().update(locals.user.id, params.id, parsed.data);
		return json({ bot });
	} catch (err) {
		handleDomainError(err);
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) error(401, 'Unauthorized');
	if (!params.id) error(400, 'Missing bot id');
	try {
		await service().remove(locals.user.id, params.id);
		return json({ ok: true });
	} catch (err) {
		handleDomainError(err);
	}
};
