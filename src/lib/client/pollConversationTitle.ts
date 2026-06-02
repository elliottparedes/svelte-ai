import { fetchNewConversationSummary } from './dashboardRemote';

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isPlaceholderConversationTitle(title: string | null | undefined): boolean {
	const t = title?.trim();
	return !t || t === 'New chat';
}

/** Refetch sidebar title after background title job (stream no longer sends title events). */
export async function pollConversationTitle(
	conversationId: string,
	opts?: { maxAttempts?: number; intervalMs?: number }
): Promise<string | null> {
	const maxAttempts = opts?.maxAttempts ?? 24;
	const intervalMs = opts?.intervalMs ?? 1250;

	for (let i = 0; i < maxAttempts; i++) {
		const meta = await fetchNewConversationSummary(conversationId);
		const title = meta?.title?.trim();
		if (title && !isPlaceholderConversationTitle(title)) return title;
		if (i < maxAttempts - 1) await sleep(intervalMs);
	}
	return null;
}
