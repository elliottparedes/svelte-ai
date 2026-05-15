import type { ChatAttachment, ChatMessage, ChatProvider } from '../domain/ChatProvider.interface';
import type { ChatRepository } from '../repositories/ChatRepository';
import type { MessageRepository } from '../repositories/MessageRepository';
import type { ProjectRepository } from '../repositories/ProjectRepository';
import type { ToolExecutor } from '../infrastructure/ToolExecutor';
import { logger } from '../logger';
import { augmentHistory, buildAugmentedPrompt } from './conversationPrompt.util';
import { resolveConversationForPrompt } from './conversationResolve.util';
import { buildSystemMessagesForTurn } from './conversationSystemMessages';
import { maybeApplyVisionRelay, VISION_RELAY_SYSTEM_HINT } from './conversationVisionRelay.util';
import type { ConversationProcessEvent } from './conversationProcess.types';
import {
	MAX_HISTORY_MESSAGES,
	TOOLS,
	TOOLS_WITHOUT_WEB_SEARCH,
	TOOL_SYSTEM_PROMPT,
	TOOL_SYSTEM_PROMPT_NO_TOOLS,
	TOOL_SYSTEM_PROMPT_NO_WEB_SEARCH
} from './conversationTools.config';
import type { VisionRelayService } from './VisionRelayService';
import { modelSupportsTools, modelOpenRouterModalities } from '../model/modelCapabilities';
import { runConversationToolTurns } from './conversationToolTurns';

export class ConversationService {
	constructor(
		private readonly provider: ChatProvider,
		private readonly chatRepo: ChatRepository,
		private readonly messageRepo: MessageRepository,
		private readonly toolExecutor: ToolExecutor,
		private readonly projectRepo?: ProjectRepository,
		private readonly visionRelay?: VisionRelayService
	) {}

	async *processPrompt(
		userId: string,
		conversationId: string | undefined,
		prompt: string,
		attachments?: readonly ChatAttachment[],
		model?: string,
		projectId?: string
	): AsyncGenerator<ConversationProcessEvent, void, unknown> {
		const isNewThread = !conversationId;
		const convId = await resolveConversationForPrompt(
			this.chatRepo,
			userId,
			conversationId,
			projectId,
			prompt
		);

		const attachmentSummary =
			attachments
				?.map((a) => {
					const label =
						a.type === 'image' ? 'Image' : a.type === 'file' ? 'PDF' : 'File';
					return `[${label}: ${a.name}]`;
				})
				.join(' ') ?? '';
		const storedContent = attachmentSummary ? `${prompt}\n${attachmentSummary}` : prompt;
		await this.messageRepo.create(convId, 'user', storedContent);
		const history = await this.messageRepo.findByConversationId(convId, MAX_HISTORY_MESSAGES);

		const conv = await this.chatRepo.findById(convId);
		const effectiveProjectId = conv?.projectId ?? projectId ?? null;
		logger.info('Chat message accepted', {
			userId,
			conversationId: convId,
			isNewThread,
			model: model ?? 'default',
			projectId: effectiveProjectId,
			promptChars: prompt.length,
			attachmentCount: attachments?.length ?? 0
		});

		const augmentedPromptBase = buildAugmentedPrompt(prompt, attachments);
		const imageAttachments = attachments?.filter((a) => a.type === 'image' && a.dataUrl);
		const { augmentedPrompt, relayApplied } = await maybeApplyVisionRelay({
			userId,
			conversationId: convId,
			augmentedPrompt: augmentedPromptBase,
			imageAttachments,
			model,
			visionRelay: this.visionRelay
		});

		const multimodal = attachments?.filter(
			(a) =>
				(a.type === 'image' && a.dataUrl) || (a.type === 'file' && a.dataUrl)
		);
		let streamAttachments: readonly ChatAttachment[] | undefined;
		if (relayApplied) {
			streamAttachments = multimodal?.filter((a) => a.type === 'file');
			if (!streamAttachments?.length) streamAttachments = undefined;
		} else {
			streamAttachments = multimodal?.length ? multimodal : undefined;
		}

		const toolsCapable = modelSupportsTools(model);
		const toolSystemPrompt = !toolsCapable
			? TOOL_SYSTEM_PROMPT_NO_TOOLS
			: relayApplied
				? TOOL_SYSTEM_PROMPT_NO_WEB_SEARCH
				: TOOL_SYSTEM_PROMPT;
		const systemMessages = await buildSystemMessagesForTurn(conv, this.projectRepo, toolSystemPrompt);

		const relaySystem: ChatMessage[] = relayApplied
			? [{ id: 'system-vision-relay', role: 'system', content: VISION_RELAY_SYSTEM_HINT, createdAt: new Date() }]
			: [];

		let augmentedHistory = augmentHistory(history, augmentedPrompt);
		augmentedHistory = [...systemMessages, ...relaySystem, ...augmentedHistory];

		const orMods = modelOpenRouterModalities(model);
		const options: Record<string, unknown> | undefined =
			model || orMods?.length
				? {
						...(model ? { model } : {}),
						...(orMods?.length ? { modalities: orMods } : {})
					}
				: undefined;
		const toolsForTurn = !toolsCapable ? [] : relayApplied ? TOOLS_WITHOUT_WEB_SEARCH : TOOLS;

		yield* runConversationToolTurns({
			userId,
			conversationId: convId,
			modelLabel: model ?? 'default',
			provider: this.provider,
			messageRepo: this.messageRepo,
			toolExecutor: this.toolExecutor,
			initialHistory: augmentedHistory,
			streamAttachments,
			toolsForTurn,
			options
		});
	}
}
