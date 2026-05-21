import type { RequestHandler } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import { ChatRepository } from '$lib/server/repositories/ChatRepository';
import { MessageRepository } from '$lib/server/repositories/MessageRepository';
import { TelegramChatBindingRepository } from '$lib/server/repositories/TelegramChatBindingRepository';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Unauthorized');

	const conversationId = params.id;
	if (!conversationId) error(400, 'Missing conversation id');

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}

	const title = (body as Record<string, unknown>)?.title;
	if (typeof title !== 'string' || !title.trim()) {
		error(400, 'Title is required');
	}

	const chatRepo = new ChatRepository();
	const conv = await chatRepo.findById(conversationId);
	if (!conv || conv.userId !== user.id) error(404, 'Not found');

	const updated = await chatRepo.update(conversationId, { title: title.trim() });
	return json({ conversation: updated });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Unauthorized');

	const conversationId = params.id;
	if (!conversationId) error(400, 'Missing conversation id');

	const chatRepo = new ChatRepository();
	const conv = await chatRepo.findById(conversationId);
	if (!conv || conv.userId !== user.id) error(404, 'Not found');

	const messageRepo = new MessageRepository();
	await messageRepo.deleteByConversationId(conversationId);
	await new TelegramChatBindingRepository().deleteByConversationId(conversationId);
	await chatRepo.delete(conversationId);

	return json({ success: true });
};
