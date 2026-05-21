import { error, json, type RequestHandler } from '@sveltejs/kit';
import {
	TELEGRAM_TOKEN_ENCRYPTION_KEY,
	TELEGRAM_WEBHOOK_BASE_URL
} from '$lib/server/db/config';
import { handleDomainError } from '$lib/server/domain/DomainError';
import { TelegramBotRepository } from '$lib/server/repositories/TelegramBotRepository';
import { TelegramBotService } from '$lib/server/services/TelegramBotService';
import { createTelegramBotSchema } from '$lib/server/validation/telegram.schema';

function service(): TelegramBotService {
	return new TelegramBotService(new TelegramBotRepository(), {
		encryptionKey: TELEGRAM_TOKEN_ENCRYPTION_KEY,
		webhookBaseUrl: TELEGRAM_WEBHOOK_BASE_URL || undefined
	});
}

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401, 'Unauthorized');
	try {
		const bots = await service().listByUser(locals.user.id);
		return json({ bots });
	} catch (err) {
		handleDomainError(err);
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401, 'Unauthorized');
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}
	const parsed = createTelegramBotSchema.safeParse(body);
	if (!parsed.success) error(400, parsed.error.issues.map((issue) => issue.message).join(', '));
	try {
		const bot = await service().create({
			userId: locals.user.id,
			name: parsed.data.name,
			token: parsed.data.token,
			projectId: parsed.data.projectId ?? null,
			defaultModelId: parsed.data.defaultModelId ?? null,
			enabledToolNames: parsed.data.enabledToolNames,
			dailyMessageLimit: parsed.data.dailyMessageLimit
		});
		return json({ bot }, { status: 201 });
	} catch (err) {
		handleDomainError(err);
	}
};
