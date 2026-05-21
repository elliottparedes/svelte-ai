import { error, json, type RequestHandler } from '@sveltejs/kit';
import {
	TELEGRAM_TOKEN_ENCRYPTION_KEY,
	TELEGRAM_WEBHOOK_BASE_URL
} from '$lib/server/db/config';
import { handleDomainError } from '$lib/server/domain/DomainError';
import { TelegramBotRepository } from '$lib/server/repositories/TelegramBotRepository';
import { TelegramBotService } from '$lib/server/services/TelegramBotService';

function service(): TelegramBotService {
	return new TelegramBotService(new TelegramBotRepository(), {
		encryptionKey: TELEGRAM_TOKEN_ENCRYPTION_KEY,
		webhookBaseUrl: TELEGRAM_WEBHOOK_BASE_URL || undefined
	});
}

export const POST: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) error(401, 'Unauthorized');
	if (!params.id) error(400, 'Missing bot id');
	try {
		const webhook = await service().syncWebhook(locals.user.id, params.id);
		return json({ webhook });
	} catch (err) {
		handleDomainError(err);
	}
};
