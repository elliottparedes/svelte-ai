import { error, json, type RequestHandler } from '@sveltejs/kit';
import {
	TELEGRAM_TOKEN_ENCRYPTION_KEY,
	TELEGRAM_WEBHOOK_BASE_URL
} from '$lib/server/db/config';
import { handleDomainError } from '$lib/server/domain/DomainError';
import { TelegramBotRepository } from '$lib/server/repositories/TelegramBotRepository';
import { TelegramBotService } from '$lib/server/services/TelegramBotService';
import { telegramSyncWebhookSchema } from '$lib/server/validation/telegram.schema';

function service(): TelegramBotService {
	return new TelegramBotService(new TelegramBotRepository(), {
		encryptionKey: TELEGRAM_TOKEN_ENCRYPTION_KEY,
		webhookBaseUrl: TELEGRAM_WEBHOOK_BASE_URL || undefined
	});
}

export const POST: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) error(401, 'Unauthorized');
	if (!params.id) error(400, 'Missing bot id');
	let body: unknown = {};
	try {
		const text = await request.text();
		if (text.trim()) body = JSON.parse(text);
	} catch {
		error(400, 'Invalid JSON');
	}
	const parsed = telegramSyncWebhookSchema.safeParse(body);
	if (!parsed.success) error(400, parsed.error.issues.map((i) => i.message).join(', '));
	try {
		const webhook = await service().syncWebhook(
			locals.user.id,
			params.id,
			parsed.data.token
		);
		return json({ webhook });
	} catch (err) {
		handleDomainError(err);
	}
};
