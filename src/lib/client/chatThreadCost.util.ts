import type { ChatMessage } from '$lib/types/dashboard';

export function sumAssistantCostUsd(messages: readonly ChatMessage[]): number {
	let total = 0;
	for (const m of messages) {
		if (m.role === 'assistant' && typeof m.costUsd === 'number' && m.costUsd > 0) {
			total += m.costUsd;
		}
	}
	return total;
}

/** Format USD for compact display next to Send. */
export function formatThreadCostUsd(usd: number): string {
	if (usd <= 0) return '';
	if (usd >= 0.01) return `$${usd.toFixed(2)}`;
	if (usd >= 0.001) return `$${usd.toFixed(3)}`;
	return `$${usd.toFixed(4)}`;
}
