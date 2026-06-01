import type { OpenRouterUsage } from '../domain/OpenRouterUsage.types';
import { completeOpenRouterText } from '../infrastructure/openRouterCompleteText';
import type { ChatMessage } from '../domain/ChatProvider.interface';
import { formatMessagesForSummarizer } from './conversationSummaryBatch';

const SYSTEM =
	'Compress chat history into a concise running summary for another AI. ' +
	'Preserve: user goals, decisions, constraints, names, numbers, code identifiers, open questions. ' +
	'Omit: filler, raw tool dumps, repeated phrasing. Output bullet points only, no preamble.';

export type SummaryGenerationResult = { summary: string | null; usage: OpenRouterUsage | null };

export class ConversationSummaryService {
	constructor(
		private readonly apiKey: string,
		readonly modelId: string,
		private readonly maxTokens: number,
		private readonly httpReferer?: string
	) {}

	async extend(
		previousSummary: string | null,
		batch: readonly ChatMessage[]
	): Promise<SummaryGenerationResult> {
		const formatted = formatMessagesForSummarizer(batch);
		const user = previousSummary
			? `Previous summary:\n${previousSummary}\n\nNew messages:\n${formatted}`
			: `Messages:\n${formatted}`;
		const { text, usage } = await completeOpenRouterText(
			this.apiKey,
			this.modelId,
			[
				{ role: 'system', content: SYSTEM },
				{ role: 'user', content: user }
			],
			this.maxTokens,
			this.httpReferer
		);
		return { summary: text?.trim() || null, usage };
	}
}
