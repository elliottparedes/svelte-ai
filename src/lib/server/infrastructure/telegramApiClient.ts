type TelegramResult<T> = { ok: boolean; result?: T; description?: string };
type TelegramMe = { id: number; username?: string };
type TelegramFile = { file_path?: string };
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
	text: string,
	options?: { parseMode?: 'HTML'; fallbackText?: string }
): Promise<void> {
	const body: Record<string, unknown> = { chat_id: chatId, text: text.slice(0, 4096) };
	if (options?.parseMode) body.parse_mode = options.parseMode;
	const payload = await callTelegram<boolean>(token, 'sendMessage', body);
	if (!payload.ok && options?.parseMode) {
		await sendTelegramMessage(token, chatId, options.fallbackText ?? text);
		return;
	}
	if (!payload.ok) throw new Error(payload.description || 'Telegram sendMessage failed');
}

export async function getTelegramFilePath(token: string, fileId: string): Promise<string> {
	const payload = await callTelegram<TelegramFile>(token, 'getFile', { file_id: fileId });
	const filePath = payload.result?.file_path;
	if (!payload.ok || !filePath) {
		throw new Error(payload.description || 'Telegram getFile failed');
	}
	return filePath;
}

export async function downloadTelegramFileAsDataUrl(
	token: string,
	filePath: string
): Promise<{ dataUrl: string; mimeType: string }> {
	const response = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
	if (!response.ok) {
		throw new Error(`Telegram file download failed: ${response.status} ${response.statusText}`);
	}
	const contentType = response.headers.get('content-type');
	const mimeType = inferMimeType(filePath, contentType);
	const bytes = Buffer.from(await response.arrayBuffer());
	return { dataUrl: `data:${mimeType};base64,${bytes.toString('base64')}`, mimeType };
}

function inferMimeType(filePath: string, contentType: string | null): string {
	const ctype = contentType?.split(';')[0]?.trim().toLowerCase();
	if (ctype?.startsWith('image/')) return ctype;
	const lowerPath = filePath.toLowerCase();
	if (lowerPath.endsWith('.png')) return 'image/png';
	if (lowerPath.endsWith('.webp')) return 'image/webp';
	if (lowerPath.endsWith('.gif')) return 'image/gif';
	return 'image/jpeg';
}
