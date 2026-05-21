/**
 * Re-register Telegram webhook so secret_token matches the database.
 * Run on the server (Coolify terminal) with production .env loaded.
 *
 * Usage: npm run telegram:sync-webhook -- <bot-uuid>
 *    or: TELEGRAM_BOT_ID=<uuid> npm run telegram:sync-webhook
 */
import 'dotenv/config';
import { TelegramBotRepository } from '../src/lib/server/repositories/TelegramBotRepository';
import {
	TELEGRAM_TOKEN_ENCRYPTION_KEY,
	TELEGRAM_WEBHOOK_BASE_URL
} from '../src/lib/server/env';
import { syncTelegramBotWebhook } from '../src/lib/server/services/telegramBotWebhook';

async function main() {
	const botId = process.argv[2] ?? process.env.TELEGRAM_BOT_ID;
	if (!botId) {
		console.error('Usage: npm run telegram:sync-webhook -- <bot-uuid>');
		process.exit(1);
	}
	const repo = new TelegramBotRepository();
	const bot = await repo.findById(botId);
	if (!bot) {
		console.error('Bot not found:', botId);
		process.exit(1);
	}
	const status = await syncTelegramBotWebhook(
		bot,
		null,
		TELEGRAM_TOKEN_ENCRYPTION_KEY,
		TELEGRAM_WEBHOOK_BASE_URL
	);
	console.log(JSON.stringify(status, null, 2));
	if (!status.registered) process.exit(1);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
