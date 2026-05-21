import { DomainError } from '../domain/DomainError';
import type { TelegramBot } from '../domain/TelegramBot.types';
import { decryptSecret } from '../infrastructure/secretCrypto';
import {
	getTelegramWebhookInfo,
	setTelegramWebhook,
	type TelegramWebhookInfo
} from '../infrastructure/telegramApiClient';
import { buildTelegramWebhookUrl } from '../infrastructure/telegramWebhook.util';

export type TelegramWebhookStatus = {
	registered: boolean;
	expectedUrl: string;
	actualUrl: string;
	pendingUpdateCount: number;
	lastErrorMessage: string | null;
};

export async function syncTelegramBotWebhook(
	bot: TelegramBot,
	tokenPlain: string | null,
	encryptionKey: string,
	webhookBaseUrl: string | undefined
): Promise<TelegramWebhookStatus> {
	const base = webhookBaseUrl?.trim();
	if (!base) {
		throw new DomainError(
			'Server TELEGRAM_WEBHOOK_BASE_URL is not set. Use a public HTTPS URL (e.g. ngrok) and restart the app.',
			503
		);
	}
	let token: string;
	if (tokenPlain) {
		token = tokenPlain;
	} else {
		try {
			token = decryptSecret(bot.tokenCiphertext, encryptionKey);
		} catch {
			throw new DomainError(
				'Stored bot token cannot be decrypted on this server. Paste your BotFather token again when registering the webhook.',
				400
			);
		}
	}
	const expectedUrl = buildTelegramWebhookUrl(base, bot.id);
	await setTelegramWebhook(token, expectedUrl, bot.webhookSecret);
	return readWebhookStatus(expectedUrl, await getTelegramWebhookInfo(token));
}

export function readWebhookStatus(
	expectedUrl: string,
	info: TelegramWebhookInfo
): TelegramWebhookStatus {
	return {
		registered: info.url === expectedUrl,
		expectedUrl,
		actualUrl: info.url || '',
		pendingUpdateCount: info.pending_update_count,
		lastErrorMessage: info.last_error_message ?? null
	};
}
