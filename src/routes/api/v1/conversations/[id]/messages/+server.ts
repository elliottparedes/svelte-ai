import type { RequestHandler } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import { ChatRepository } from '$lib/server/repositories/ChatRepository';
import { MessageRepository } from '$lib/server/repositories/MessageRepository';

export const GET: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Unauthorized');

	const conversationId = params.id;
	if (!conversationId) error(400, 'Missing conversation id');

	const chatRepo = new ChatRepository();
	const conv = await chatRepo.findById(conversationId);
	if (!conv || conv.userId !== user.id) error(404, 'Not found');

	const messageRepo = new MessageRepository();
	const messages = await messageRepo.findByConversationId(conversationId);
	return json({ conversation: conv, messages });
};
