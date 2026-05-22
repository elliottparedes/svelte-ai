import type { ChatAttachmentInput } from '$lib/types/dashboard';

/** Extensions accepted when model supports non-image uploads */
export const CHAT_ACCEPT_NON_IMAGE =
	'.pdf,.txt,.md,.json,.csv,.ts,.js,.jsx,.tsx,.py,.java,.c,.cpp,.go,.rs,.rb,.php,.html,.css,.scss,.yaml,.yml,.sql,.sh,.svg';

export const CHAT_PASTE_CHARS_THRESHOLD = 800;

export function chatInputFileAcceptAttr(
	supportsVision: boolean,
	supportsFiles: boolean
): string {
	if (supportsVision && supportsFiles) return `image/*,${CHAT_ACCEPT_NON_IMAGE}`;
	if (supportsVision) return 'image/*';
	if (supportsFiles) return CHAT_ACCEPT_NON_IMAGE;
	return '';
}

export function chatFileAllowedForModel(
	file: File,
	caps: { supportsVision: boolean; supportsFiles: boolean }
): boolean {
	const t = file.type;
	const lower = file.name.toLowerCase();
	const looksPdf = t === 'application/pdf' || lower.endsWith('.pdf');
	if (looksPdf) return caps.supportsFiles;
	const looksImage =
		t.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file.name);
	if (looksImage) return caps.supportsVision;
	return true;
}

export function chatAttachmentRejectMessage(caps: {
	supportsVision: boolean;
	supportsFiles: boolean;
}): string {
	if (caps.supportsFiles) return 'This model does not accept that file type.';
	if (caps.supportsVision) {
		return 'This model accepts images only (not PDFs). Pick a model with file support for PDFs.';
	}
	return 'This model does not accept attachments.';
}

export async function uploadChatAttachment(file: File): Promise<ChatAttachmentInput> {
	const form = new FormData();
	form.append('file', file);
	const res = await fetch('/api/v1/upload', { method: 'POST', body: form, credentials: 'same-origin' });
	if (!res.ok) {
		const msg = await res.text().catch(() => '');
		throw new Error(msg.slice(0, 200) || `Upload failed (${res.status})`);
	}
	return res.json() as Promise<ChatAttachmentInput>;
}

/** Long plain-text paste → .txt attachment (works on any model; inlined server-side). */
function tryConsumeLongTextPaste(e: ClipboardEvent, onFile: (file: File) => void): boolean {
	const text = e.clipboardData?.getData('text/plain') ?? '';
	if (text.length <= CHAT_PASTE_CHARS_THRESHOLD) return false;
	e.preventDefault();
	onFile(
		new File([new Blob([text], { type: 'text/plain' })], 'pasted-text.txt', { type: 'text/plain' })
	);
	return true;
}

export function consumeClipboardForAttachments(
	e: ClipboardEvent,
	opts: { filePasteEnabled: boolean; onFile: (file: File) => void }
): void {
	if (tryConsumeLongTextPaste(e, opts.onFile)) return;
	if (!opts.filePasteEnabled) return;
	const items = e.clipboardData?.items;
	if (!items) return;
	for (const item of items) {
		if (item.kind !== 'file') continue;
		const file = item.getAsFile();
		if (file) opts.onFile(file);
	}
}
