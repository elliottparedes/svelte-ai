import type { RequestHandler } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import { createConversationSchema } from '$lib/server/validation/conversation.schema';
import { ChatRepository } from '$lib/server/repositories/ChatRepository';
import { MessageRepository } from '$lib/server/repositories/MessageRepository';
import { TelegramChatBindingRepository } from '$lib/server/repositories/TelegramChatBindingRepository';

export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Unauthorized');

	const repo = new ChatRepository();
	const conversations = await repo.findByUserId(user.id);
	return json({ conversations });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Unauthorized');

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}

	const parseResult = createConversationSchema.safeParse(body);
	if (!parseResult.success) {
		error(400, parseResult.error.issues.map((i) => i.message).join(', '));
	}

	const repo = new ChatRepository();
	const conversation = await repo.create({
		userId: user.id,
		title: parseResult.data.title
	});

	return json({ conversation }, { status: 201 });
};

export const DELETE: RequestHandler = async ({ locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Unauthorized');

	const chatRepo = new ChatRepository();
	const messageRepo = new MessageRepository();
	const bindingRepo = new TelegramChatBindingRepository();
	const conversations = await chatRepo.findAllByUserId(user.id);

	for (const conversation of conversations) {
		await messageRepo.deleteByConversationId(conversation.id);
		await bindingRepo.deleteByConversationId(conversation.id);
		await chatRepo.delete(conversation.id);
	}

	return json({ success: true, deletedCount: conversations.length });
};
