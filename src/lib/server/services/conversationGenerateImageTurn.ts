import type { ToolCall } from '../domain/ChatProvider.interface';
import type { MessageRepository } from '../repositories/MessageRepository';
import type { ChatRepository } from '../repositories/ChatRepository';
import type { ConversationTitleService } from './ConversationTitleService';
import type { ConversationProcessEvent } from './conversationProcess.types';
import { yieldNewThreadTitleEvents } from './conversationTitleTurn.util';
import {
	assistantContentForImageGeneration,
	IMAGE_GENERATION_REPLY,
	toolResultForLlmHistory
} from '$lib/shared/imageGenerationToolResult';

export async function* yieldGenerateImageSuccess(params: {
	userId: string;
	conversationId: string;
	isNewThread: boolean;
	userPrompt: string;
	assistantPreamble: string;
	result: string;
	pendingToolCall: ToolCall;
	messageRepo: MessageRepository;
	chatRepo: ChatRepository;
	titleService: ConversationTitleService | undefined;
}): AsyncGenerator<ConversationProcessEvent> {
	const imageBlock = assistantContentForImageGeneration(params.result);
	const preamble = params.assistantPreamble.trim();
	const stored = preamble ? `${preamble}\n\n${imageBlock}` : imageBlock;
	await params.messageRepo.create(params.conversationId, 'assistant', stored);
	const sseToolResult = toolResultForLlmHistory('generate_image', params.result);
	yield { type: 'tool_result' as const, name: 'generate_image', result: sseToolResult };
	yield { type: 'chunk' as const, content: IMAGE_GENERATION_REPLY };
	yield* yieldNewThreadTitleEvents({
		isNewThread: params.isNewThread,
		conversationId: params.conversationId,
		userPrompt: params.userPrompt,
		assistantContent: stored,
		userId: params.userId,
		chatRepo: params.chatRepo,
		titleService: params.titleService
	});
	yield { type: 'done' as const, conversationId: params.conversationId };
}
