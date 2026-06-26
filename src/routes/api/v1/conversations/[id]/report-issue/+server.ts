import type { RequestHandler } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import {
	reportConversationIssueSchema
} from '$lib/server/validation/conversation.schema';
import { ChatRepository } from '$lib/server/repositories/ChatRepository';
import { MessageRepository } from '$lib/server/repositories/MessageRepository';
import { ConversationTurnRepository } from '$lib/server/repositories/ConversationTurnRepository';
import { ConversationIssueReportRepository } from '$lib/server/repositories/ConversationIssueReportRepository';
import { ConversationIssueReportService } from '$lib/server/services/ConversationIssueReportService';
import { handleDomainError } from '$lib/server/domain/DomainError';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Unauthorized');
	const conversationId = params.id;
	if (!conversationId) error(400, 'Missing conversation id');
	let body: unknown = {};
	try {
		body = await request.json();
	} catch {
		// optional body
	}
	const parsed = reportConversationIssueSchema.safeParse(body);
	if (!parsed.success) error(400, parsed.error.issues.map((i) => i.message).join(', '));
	try {
		const out = await new ConversationIssueReportService(
			new ChatRepository(),
			new ConversationTurnRepository(),
			new MessageRepository(),
			new ConversationIssueReportRepository()
		).report(user.id, conversationId, parsed.data.clientContext);
		return json({ ok: true, ...out });
	} catch (err) {
		handleDomainError(err);
	}
};
