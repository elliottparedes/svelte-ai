import { z } from 'zod';

export const attachmentSchema = z.object({
	type: z.enum(['image', 'text', 'file']),
	name: z.string().min(1),
	dataUrl: z.string().max(8_000_000).optional(),
	content: z.string().max(5_000_000).optional(),
	mimeType: z.string().optional()
});

export const chatPromptSchema = z.object({
	conversationId: z.string().uuid().optional(),
	message: z.string().min(1).max(50000),
	model: z.string().min(1).optional(),
	attachments: z.array(attachmentSchema).optional(),
	projectId: z.string().uuid().optional()
});

export const conversationIdSchema = z.object({
	id: z.string().uuid()
});

export const createConversationSchema = z.object({
	title: z.string().min(1).max(200)
});

export type ChatPromptInput = z.infer<typeof chatPromptSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
