import { z } from 'zod';
import { CHAT_TOOL_ORDER } from '$lib/shared/chatToolSystemPrompt';

const chatToolNameSchema = z.enum(CHAT_TOOL_ORDER);

export const attachmentSchema = z.object({
	type: z.enum(['image', 'text', 'file']),
	name: z.string().min(1),
	dataUrl: z.string().max(15_000_000).optional(),
	content: z.string().max(5_000_000).optional(),
	mimeType: z.string().optional()
});

export const chatPromptSchema = z.object({
	conversationId: z.string().uuid().optional(),
	message: z.string().min(1).max(50000),
	model: z.string().min(1).optional(),
	attachments: z.array(attachmentSchema).optional(),
	projectId: z.string().uuid().optional(),
	/** Omit for legacy “all tools” (minus vision-relay web strip). Empty = no tools. */
	enabledToolNames: z.array(chatToolNameSchema).max(CHAT_TOOL_ORDER.length).optional(),
	/** Stream assistant reply audio via ElevenLabs on the same SSE connection. */
	voiceMode: z.boolean().optional(),
	/** Dashboard: route this turn to the deep reasoning model (e.g. DeepSeek R1). */
	deepReasoning: z.boolean().optional()
});

export const chatResumeToolSchema = z.object({
	conversationId: z.string().uuid(),
	resumeTool: z.object({
		turnId: z.string().uuid(),
		toolCallId: z.string().min(1),
		name: chatToolNameSchema,
		arguments: z.record(z.string(), z.unknown()).default({}),
		result: z.string().max(200_000),
		sandboxFiles: z
			.array(z.object({ name: z.string().min(1).max(120), content: z.string().max(5_000_000) }))
			.max(16),
		usageSnapshot: z.object({
			llmCostUsd: z.number().min(0),
			promptTokens: z.number().int().min(0),
			completionTokens: z.number().int().min(0),
			externalItems: z
				.array(
					z.object({
						provider: z.string().min(1),
						toolName: z.string().min(1),
						costUsd: z.number().min(0)
					})
				)
				.default([])
		})
	}),
	browserTimeZone: z.string().trim().min(1).optional()
});

export const conversationIdSchema = z.object({
	id: z.string().uuid()
});

export const reportConversationIssueSchema = z.object({
	clientContext: z.record(z.string(), z.unknown()).optional()
});

export const createConversationSchema = z.object({
	title: z.string().min(1).max(200)
});

export type ChatPromptInput = z.infer<typeof chatPromptSchema>;
export type ChatResumeToolInput = z.infer<typeof chatResumeToolSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type ReportConversationIssueInput = z.infer<typeof reportConversationIssueSchema>;
