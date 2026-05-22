/** Extract one reasoning delta from an OpenRouter stream chunk (avoid double-counting aliases). */
export function reasoningFromOpenRouterDelta(
	delta: Record<string, unknown> | undefined
): string {
	if (!delta) return '';

	const details = delta.reasoning_details;
	if (Array.isArray(details) && details.length > 0) {
		let text = '';
		for (const item of details) {
			if (!item || typeof item !== 'object') continue;
			const d = item as Record<string, unknown>;
			const type = typeof d.type === 'string' ? d.type : '';
			if (type === 'reasoning.summary' && typeof d.summary === 'string') {
				text += d.summary;
			} else if (typeof d.text === 'string') {
				text += d.text;
			}
		}
		if (text) return text;
	}

	if (typeof delta.reasoning_content === 'string') return delta.reasoning_content;
	if (typeof delta.reasoning === 'string') return delta.reasoning;
	return '';
}

/** Heuristic when catalog lacks `reasoning` in supported_parameters. */
export function modelIdImpliesReasoning(modelId: string): boolean {
	const id = modelId.toLowerCase();
	return (
		id.startsWith('deepseek/') ||
		id.includes('moonshotai/kimi') ||
		id.includes('kimi-k2') ||
		id.includes('reasoner') ||
		id.includes('thinking') ||
		id.includes('/r1') ||
		id.includes('qwen3') ||
		id.includes('glm-4.5') ||
		/\b(o1|o3|gpt-5)[-/_]/.test(id)
	);
}
