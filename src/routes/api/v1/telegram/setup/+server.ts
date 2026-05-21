import { error, json, type RequestHandler } from '@sveltejs/kit';
import { TELEGRAM_WEBHOOK_BASE_URL } from '$lib/server/db/config';

const docs = {
	tutorial: 'https://core.telegram.org/bots/tutorial/',
	api: 'https://core.telegram.org/bots/API',
	webhooks: 'https://core.telegram.org/bots/webhooks'
};

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401, 'Unauthorized');
	const webhookBaseConfigured = TELEGRAM_WEBHOOK_BASE_URL.trim().length > 0;
	return json({
		webhookBaseConfigured,
		docs,
		botFatherSteps: [
			'Open Telegram and message @BotFather',
			'Run /newbot and choose display name and username',
			'Copy the token and paste it once in Inkstream',
			'Use /revoke in BotFather if the token leaks'
		],
		webhookChecklist: [
			'Use HTTPS with a valid TLS certificate chain',
			'Expose a reachable webhook URL on 443/80/88/8443',
			'Set a webhook secret token and verify it server-side',
			'Run a test message and confirm webhook delivery'
		],
		tips: [
			'Start with short replies, then offer deeper follow-up prompts',
			'Provide commands like /help, /settings, and /reset',
			'Use lower-cost models by default and reserve premium fallback for hard prompts',
			'Enable mention-only mode for noisy group chats'
		]
	});
};
