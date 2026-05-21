type TelegramResult<T> = { ok: boolean; result?: T; description?: string };
type TelegramMe = { id: number; username?: string };
export type TelegramWebhookInfo = {
	url: string;
	has_custom_certificate: boolean;
	pending_update_count: number;
	last_error_date?: number;
	last_error_message?: string;
};

function apiBase(token: string): string {
	return `https://api.telegram.org/bot${token}`;
}

async function callTelegram<T>(
	token: string,
	method: string,
	body?: Record<string, unknown>
): Promise<TelegramResult<T>> {
	const response = await fetch(`${apiBase(token)}/${method}`, {
		method: body ? 'POST' : 'GET',
		headers: body ? { 'Content-Type': 'application/json' } : undefined,
		body: body ? JSON.stringify(body) : undefined
	});
	const payload = (await response.json()) as TelegramResult<T>;
	return payload;
}

export async function getTelegramMe(token: string): Promise<TelegramMe> {
	const payload = await callTelegram<TelegramMe>(token, 'getMe');
	if (!payload.ok || !payload.result) {
		throw new Error(payload.description || 'Telegram getMe failed');
	}
	return payload.result;
}

export async function setTelegramWebhook(
	token: string,
	url: string,
	secretToken: string
): Promise<void> {
	const payload = await callTelegram<boolean>(token, 'setWebhook', {
		url,
		secret_token: secretToken
	});
	if (!payload.ok) throw new Error(payload.description || 'Telegram setWebhook failed');
}

export async function getTelegramWebhookInfo(token: string): Promise<TelegramWebhookInfo> {
	const payload = await callTelegram<TelegramWebhookInfo>(token, 'getWebhookInfo');
	if (!payload.ok || !payload.result) {
		throw new Error(payload.description || 'Telegram getWebhookInfo failed');
	}
	return payload.result;
}

export async function sendTelegramMessage(
	token: string,
	chatId: string | number,
	text: string
): Promise<void> {
	const payload = await callTelegram<boolean>(token, 'sendMessage', {
		chat_id: chatId,
		text
	});
	if (!payload.ok) throw new Error(payload.description || 'Telegram sendMessage failed');
}
