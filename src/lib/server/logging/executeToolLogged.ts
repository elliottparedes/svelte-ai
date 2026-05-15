import type { ToolCall } from '../domain/ChatProvider.interface';
import type { ToolExecutor } from '../infrastructure/ToolExecutor';
import { logger } from '../logger';
import { toolArgsForLog, toolResultForLog } from './toolLogMeta';

export async function executeToolLogged(
	executor: ToolExecutor,
	ctx: { userId: string; conversationId: string; llmTurn: number },
	call: ToolCall
): Promise<string> {
	logger.info('Tool call issued', {
		userId: ctx.userId,
		conversationId: ctx.conversationId,
		toolCallId: call.id,
		tool: call.name,
		llmTurn: ctx.llmTurn,
		args: toolArgsForLog(call.name, call.arguments)
	});
	logger.debug('Tool call raw arguments', {
		conversationId: ctx.conversationId,
		toolCallId: call.id,
		tool: call.name,
		arguments: call.arguments
	});

	const t0 = performance.now();
	const result = await executor.run(call.name, call.arguments);
	const durationMs = Math.round(performance.now() - t0);

	logger.info('Tool call finished', {
		userId: ctx.userId,
		conversationId: ctx.conversationId,
		toolCallId: call.id,
		tool: call.name,
		durationMs,
		llmTurn: ctx.llmTurn,
		...toolResultForLog(call.name, result)
	});

	return result;
}
