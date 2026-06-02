import type { OpenRouterUsage } from '../domain/OpenRouterUsage.types';
import { completeOpenRouterText } from '../infrastructure/openRouterCompleteText';

const SYSTEM =
	'Write a short chat title (3–6 words). Output only the title: no quotes, no punctuation at the end, max 60 characters.';

const PROMPT_ONLY_SYSTEM =
	'Write a short chat title (3–6 words) for a conversation that starts with the user message below. Output only the title: no quotes, no punctuation at the end, max 60 characters.';

export function sanitizeGeneratedTitle(raw: string): string | null {
	let t = raw.replace(/^["'`]+|["'`]+$/g, '').replace(/\s+/g, ' ').trim();
	if (!t) return null;
	if (t.length > 60) t = t.slice(0, 60).trim();
	return t || null;
}

export function fallbackTitleFromPrompt(userPrompt: string): string {
	const cleaned = userPrompt
		.replace(/\s+/g, ' ')
		.replace(/^[\W_]+|[\W_]+$/g, '')
		.trim();
	if (!cleaned) return 'New chat';
	const words = cleaned.split(' ').filter(Boolean).slice(0, 6);
	const title = words.join(' ');
	return title.length > 60 ? `${title.slice(0, 57).trim()}...` : title;
}

export type TitleGenerationResult = { title: string | null; usage: OpenRouterUsage | null };

export class ConversationTitleService {
	constructor(
		private readonly apiKey: string,
		private readonly modelId: string,
		private readonly httpReferer?: string
	) {}

	/** Title from the user message only — run in parallel with the main chat stream. */
	async generateFromUserPrompt(
		userPrompt: string,
		options?: { timeoutMs?: number }
	): Promise<TitleGenerationResult> {
		const signal =
			options?.timeoutMs != null && options.timeoutMs > 0
				? AbortSignal.timeout(options.timeoutMs)
				: undefined;
		const { text, usage } = await completeOpenRouterText(
			this.apiKey,
			this.modelId,
			[
				{ role: 'system', content: PROMPT_ONLY_SYSTEM },
				{ role: 'user', content: userPrompt.slice(0, 800) }
			],
			20,
			this.httpReferer,
			signal
		);
		return { title: text ? sanitizeGeneratedTitle(text) : null, usage };
	}

	async generate(
		userPrompt: string,
		assistantReply: string,
		options?: { timeoutMs?: number }
	): Promise<TitleGenerationResult> {
		const user = [
			'User message:',
			userPrompt.slice(0, 500),
			'',
			'Assistant reply:',
			assistantReply.slice(0, 500)
		].join('\n');
		const signal =
			options?.timeoutMs != null && options.timeoutMs > 0
				? AbortSignal.timeout(options.timeoutMs)
				: undefined;
		const { text, usage } = await completeOpenRouterText(
			this.apiKey,
			this.modelId,
			[
				{ role: 'system', content: SYSTEM },
				{ role: 'user', content: user }
			],
			24,
			this.httpReferer,
			signal
		);
		return { title: text ? sanitizeGeneratedTitle(text) : null, usage };
	}
}
