import assert from 'node:assert/strict';
import {
	chatLimitForTier,
	isSubscriptionTier,
	parseSubscriptionTier
} from '../src/lib/shared/subscriptionTier';
import { groupOpenRouterModelsByProvider } from '../src/lib/server/model/openRouterProviderGroups';
import type { ChatModel } from '../src/lib/server/domain/ChatProvider.interface';

assert.equal(parseSubscriptionTier('pro'), 'pro');
assert.equal(parseSubscriptionTier('bogus'), 'free');
assert.equal(chatLimitForTier('free'), 20);
assert.equal(chatLimitForTier('standard'), 500);
assert.equal(chatLimitForTier('pro'), null);
assert.ok(isSubscriptionTier('standard'));

const catalog: ChatModel[] = [
	{ id: 'deepseek/deepseek-v3', name: 'DeepSeek V3' },
	{ id: 'openai/gpt-4o', name: 'GPT-4o' },
	{ id: 'google/gemini-2.5-flash', name: 'Gemini Flash' }
];
const groups = groupOpenRouterModelsByProvider(catalog);
assert.equal(groups[0]?.label, 'OpenAI');
assert.equal(groups[1]?.label, 'Google');
assert.equal(groups[2]?.label, 'DeepSeek');

console.log('subscription-tier-test: ok');
