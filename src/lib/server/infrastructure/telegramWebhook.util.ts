export function buildTelegramWebhookUrl(baseUrl: string, botId: string): string {
	const base = baseUrl.trim().replace(/\/+$/, '');
	return `${base}/api/v1/telegram/webhook/${botId}`;
}
