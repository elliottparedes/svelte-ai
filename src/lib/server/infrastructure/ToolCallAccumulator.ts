import type { ToolCall } from '../domain/ChatProvider.interface';

interface PartialToolCall {
	id?: string;
	name?: string;
	argsBuffer: string;
}

function extractNameFromId(id: string): string | undefined {
	// Kimi sends ids like "functions.calculator:0" when function.name is null
	const match = id.match(/^functions\.([^.:]+)/);
	return match?.[1];
}

export class ToolCallAccumulator {
	private calls = new Map<number, PartialToolCall>();

	feed(deltaToolCalls: Array<{ index?: number; id?: string; type?: string; function?: { name?: string | null; arguments?: string } }>): void {
		for (const tc of deltaToolCalls) {
			const idx = tc.index ?? 0;
			let entry = this.calls.get(idx);
			if (!entry) {
				entry = { argsBuffer: '' };
				this.calls.set(idx, entry);
			}
			if (tc.id) entry.id = tc.id;
			const fnName = tc.function?.name;
			if (fnName) {
				entry.name = fnName;
			} else if (!entry.name && tc.id) {
				const extracted = extractNameFromId(tc.id);
				if (extracted) entry.name = extracted;
			}
			if (tc.function?.arguments) entry.argsBuffer += tc.function.arguments;
		}
	}

	isEmpty(): boolean {
		return this.calls.size === 0;
	}

	build(): ToolCall[] {
		const result: ToolCall[] = [];
		const indices = Array.from(this.calls.keys()).sort((a, b) => a - b);
		for (const idx of indices) {
			const c = this.calls.get(idx)!;
			if (!c.id || !c.name) continue;
			let args: Record<string, unknown> = {};
			try {
				args = JSON.parse(c.argsBuffer || '{}');
			} catch {
				args = {};
			}
			result.push({ id: c.id, name: c.name, arguments: args });
		}
		return result;
	}
}
