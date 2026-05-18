import { completeOpenRouterText } from '../infrastructure/openRouterCompleteText';

const SYSTEM =
	'Write a short chat title (3–6 words). Output only the title: no quotes, no punctuation at the end, max 60 characters.';

export function sanitizeGeneratedTitle(raw: string): string | null {
	let t = raw.replace(/^["'`]+|["'`]+$/g, '').replace(/\s+/g, ' ').trim();
	if (!t) return null;
	if (t.length > 60) t = t.slice(0, 60).trim();
	return t || null;
}

export class ConversationTitleService {
	constructor(
		private readonly apiKey: string,
		private readonly modelId: string,
		private readonly httpReferer?: string
	) {}

	async generate(userPrompt: string, assistantReply: string): Promise<string | null> {
		const user = [
			'User message:',
			userPrompt.slice(0, 500),
			'',
			'Assistant reply:',
			assistantReply.slice(0, 500)
		].join('\n');
		const raw = await completeOpenRouterText(
			this.apiKey,
			this.modelId,
			[
				{ role: 'system', content: SYSTEM },
				{ role: 'user', content: user }
			],
			24,
			this.httpReferer
		);
		return raw ? sanitizeGeneratedTitle(raw) : null;
	}
}
