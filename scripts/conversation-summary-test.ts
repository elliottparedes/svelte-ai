/**
 * Unit-style checks for rolling conversation summaries (no Vitest in repo).
 * Usage: npm run summary:test
 */
import 'dotenv/config';
import assert from 'node:assert/strict';
import type { ChatMessage } from '../src/lib/server/domain/ChatProvider.interface';
import { assembleHistoryWithSummary } from '../src/lib/server/services/assembleHistoryWithSummary';
import {
	filterSummarizableMessages,
	messagesAfterWatermark,
	pickSummaryBatch
} from '../src/lib/server/services/conversationSummaryBatch';
import { ConversationSummaryService } from '../src/lib/server/services/ConversationSummaryService';
import { OPENROUTER_API_KEY } from '../src/lib/server/env';
import { estimateCompactionProgress } from '../src/lib/shared/estimateCompactionProgress';
import { compactionThreshold } from '../src/lib/shared/conversationSummaryConfig';

function msg(id: string, role: ChatMessage['role'], content: string): ChatMessage {
	return { id, role, content, createdAt: new Date() };
}

function testPickSummaryBatch() {
	const rows = Array.from({ length: 40 }, (_, i) =>
		msg(String(i + 1), i % 2 === 0 ? 'user' : 'assistant', `line ${i + 1}`)
	);
	const summarizable = filterSummarizableMessages(rows);
	const batch = pickSummaryBatch(summarizable, 15, 20);
	assert.equal(batch.length, 15);
	assert.equal(batch[0]?.id, '1');
	assert.equal(batch[14]?.id, '15');
	assert.deepEqual(pickSummaryBatch(summarizable, 15, 50), []);
}

function testMessagesAfterWatermark() {
	const rows = [msg('a', 'user', '1'), msg('b', 'assistant', '2'), msg('c', 'user', '3')];
	assert.equal(messagesAfterWatermark(rows, null).length, 3);
	assert.equal(messagesAfterWatermark(rows, 'b').length, 1);
	assert.equal(messagesAfterWatermark(rows, 'b')[0]?.id, 'c');
}

function testAssembleHistoryWithSummary() {
	const rows = [msg('a', 'user', 'hi'), msg('b', 'assistant', 'hello')];
	const conv = {
		id: 'c1',
		userId: 'u1',
		projectId: null,
		title: 't',
		modelId: null,
		rollingSummary: '- User greeted\n- Assistant replied',
		summaryThroughMessageId: 'a',
		createdAt: new Date(),
		updatedAt: new Date()
	};
	const assembled = assembleHistoryWithSummary(conv, rows);
	assert.equal(assembled.applied, true);
	assert.equal(assembled.history.length, 2);
	assert.equal(assembled.history[0]?.role, 'system');
	assert.ok(assembled.history[0]?.content.includes('Earlier in this conversation'));
	assert.equal(assembled.history[1]?.id, 'b');
}

function testCompactionProgress() {
	const rows = Array.from({ length: 36 }, (_, i) =>
		msg(String(i + 1), i % 2 === 0 ? 'user' : 'assistant', `line ${i + 1}`)
	);
	const before = estimateCompactionProgress(rows, null);
	assert.equal(before.threshold, compactionThreshold());
	assert.equal(before.unsummarizedCount, 36);
	assert.equal(before.pct, 100);

	const after = estimateCompactionProgress(rows, '15');
	assert.equal(after.unsummarizedCount, 21);
	assert.ok(after.pct < before.pct);
}

async function testLiveSummaryOptional() {
	if (!OPENROUTER_API_KEY?.trim()) {
		console.log('summary:test — skipping live OpenRouter call (no API key)');
		return;
	}
	const svc = new ConversationSummaryService(OPENROUTER_API_KEY, 'google/gemini-2.0-flash-lite-001', 256);
	const batch = [msg('1', 'user', 'Plan a trip to Tokyo'), msg('2', 'assistant', 'When do you want to go?')];
	const out = await svc.extend(null, batch);
	assert.ok(out && out.length > 10);
}

async function main() {
	testPickSummaryBatch();
	testMessagesAfterWatermark();
	testAssembleHistoryWithSummary();
	testCompactionProgress();
	await testLiveSummaryOptional();
	console.log('conversation-summary-test: OK');
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
