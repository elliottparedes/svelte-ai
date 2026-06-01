import 'dotenv/config';
import { parseGoSseDataLine } from '../src/lib/server/infrastructure/openCodeGoParseLine';

async function main() {
	const key = process.env.OPENROUTER_API_KEY;
	if (!key) throw new Error('OPENROUTER_API_KEY missing');
	const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${key}`,
			'Content-Type': 'application/json',
			'HTTP-Referer': 'http://localhost:5173',
			'X-Title': 'Inkstream'
		},
		body: JSON.stringify({
			model: 'openai/gpt-3.5-turbo',
			stream: true,
			max_tokens: 20,
			messages: [{ role: 'user', content: 'Say hi in one word' }]
		})
	});
	const text = await res.text();
	const lines = text.split('\n').filter((l) => l.trim().startsWith('data: '));
	console.log('data lines:', lines.length);
	for (const line of lines.slice(-6)) {
		console.log('RAW:', line.slice(0, 600));
		const parsed = parseGoSseDataLine(line);
		console.log('PARSED:', parsed);
	}
}

main().catch(console.error);
