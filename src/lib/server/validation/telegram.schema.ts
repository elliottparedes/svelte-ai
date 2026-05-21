import { z } from 'zod';
import { CHAT_TOOL_ORDER } from '$lib/shared/chatToolSystemPrompt';

const toolNameSchema = z.enum(CHAT_TOOL_ORDER);

export const createTelegramBotSchema = z.object({
	name: z.string().min(1).max(120),
	token: z.string().min(20).max(200),
	projectId: z.string().uuid().nullable().optional(),
	defaultModelId: z.string().min(3).max(128).nullable().optional(),
	enabledToolNames: z.array(toolNameSchema).max(CHAT_TOOL_ORDER.length).optional(),
	dailyMessageLimit: z.number().int().min(10).max(100000).optional()
});

export const updateTelegramBotSchema = z.object({
	name: z.string().min(1).max(120).optional(),
	token: z.string().min(20).max(200).optional(),
	projectId: z.string().uuid().nullable().optional(),
	defaultModelId: z.string().min(3).max(128).nullable().optional(),
	enabledToolNames: z.array(toolNameSchema).max(CHAT_TOOL_ORDER.length).optional(),
	dailyMessageLimit: z.number().int().min(10).max(100000).optional(),
	status: z.enum(['active', 'paused']).optional()
});

export const telegramWebhookPathSchema = z.object({
	botId: z.string().uuid(),
	routeSecret: z.string().optional()
});

export const telegramWebhookUpdateSchema = z.object({
	update_id: z.number().int(),
	message: z
		.object({
			text: z.string().min(1),
			chat: z.object({
				id: z.union([z.string(), z.number()]),
				type: z.string().optional()
			})
		})
		.optional()
});
