import assert from 'node:assert/strict';
import { filterModelPickerGroups } from '../src/lib/client/filterModelPickerGroups';

const groups = [
	{ label: 'OpenAI', models: [{ id: 'openai/gpt-4o', name: 'GPT-4o' }] },
	{ label: 'Google', models: [{ id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' }] }
];

assert.equal(filterModelPickerGroups(groups, '').length, 2);
assert.equal(filterModelPickerGroups(groups, 'gemini')[0]?.label, 'Google');
assert.equal(filterModelPickerGroups(groups, 'openai')[0]?.models[0]?.id, 'openai/gpt-4o');
assert.equal(filterModelPickerGroups(groups, 'nope').length, 0);

console.log('filter-model-picker-test: ok');
