import type { ChatAttachment } from '../domain/ChatProvider.interface';
import {
	downloadTelegramFileAsDataUrl,
	getTelegramFilePath
} from '../infrastructure/telegramApiClient';

export function parseToolNames(raw: string | null): string[] | undefined {
	if (!raw?.trim()) return undefined;
	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) return undefined;
		return parsed.filter((item): item is string => typeof item === 'string');
	} catch {
		return undefined;
	}
}

export function isResetCommand(prompt: string): boolean {
	const command = prompt.trim().toLowerCase();
	return command === '/reset' || command.startsWith('/reset@');
}

export async function buildPhotoAttachment(
	token: string,
	photos: Array<{ file_id: string; file_size?: number }> | undefined
): Promise<ChatAttachment | null> {
	const best = photos?.at(-1);
	if (!best?.file_id) return null;
	const path = await getTelegramFilePath(token, best.file_id);
	const { dataUrl, mimeType } = await downloadTelegramFileAsDataUrl(token, path);
	return { type: 'image', name: 'telegram-image', dataUrl, mimeType };
}
