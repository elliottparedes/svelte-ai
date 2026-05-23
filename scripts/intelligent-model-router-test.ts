/**
 * Unit-style checks for IntelligentModelRouter (no Vitest in repo).
 * Usage: npm run router:test
 */
import 'dotenv/config';
import assert from 'node:assert/strict';
import { modelIdForRoutingTier } from '../src/lib/server/services/modelRoutingTierMap';
import { isModelRoutingTier } from '../src/lib/shared/modelRoutingTier';
import { IntelligentModelRouter } from '../src/lib/server/services/IntelligentModelRouter';
import { buildRoutingHistorySnippet } from '../src/lib/server/services/conversationRoutingSnippet';
import { OPENROUTER_REASONING_MODEL } from '../src/lib/server/env';

function testTierMap() {
	assert.equal(modelIdForRoutingTier('ultra_cheap'), 'z-ai/glm-4.7-flash');
	assert.ok(isModelRoutingTier('complex'));
	assert.ok(!isModelRoutingTier('invalid'));
}

async function testDeepReasoningBypass() {
	const router = new IntelligentModelRouter();
	const r = await router.route({
		userId: 'test-user',
		prompt: 'Prove the Riemann hypothesis.',
		deepReasoning: true
	});
	assert.equal(r.source, 'deep_reasoning');
	assert.equal(r.modelId, OPENROUTER_REASONING_MODEL);
}

async function testExplicitModel() {
	const router = new IntelligentModelRouter();
	const r = await router.route({
		userId: 'test-user',
		prompt: 'Hi',
		requestedModel: 'openai/gpt-4o-mini'
	});
	assert.equal(r.source, 'explicit');
	assert.equal(r.modelId, 'openai/gpt-4o-mini');
}

function testHistorySnippet() {
	const snippet = buildRoutingHistorySnippet([
		{ id: '1', role: 'user', content: 'Hello there', createdAt: new Date() },
		{ id: '2', role: 'assistant', content: 'Hi!', createdAt: new Date() }
	]);
	assert.ok(snippet?.includes('user: Hello'));
}

async function main() {
	testTierMap();
	testHistorySnippet();
	await testDeepReasoningBypass();
	await testExplicitModel();
	console.log('intelligent-model-router-test: OK');
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
