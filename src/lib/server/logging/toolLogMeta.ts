/** Safe summaries for logs — avoid full URLs, page bodies, or long user queries. */

export function toolArgsForLog(name: string, args: Record<string, unknown>): Record<string, unknown> {
	switch (name) {
		case 'fetch_url': {
			const raw = String(args.url ?? '');
			try {
				const u = new URL(raw);
				return { host: u.hostname, protocol: u.protocol.replace(':', '') };
			} catch {
				return { host: '(invalid-url)' };
			}
		}
		case 'web_search': {
			const q = String(args.query ?? '');
			return { queryChars: q.length, queryPreview: q.slice(0, 100) };
		}
		case 'calculator':
			return { expressionChars: String(args.expression ?? '').length };
		case 'datetime':
			return {};
		default:
			return { argKeys: Object.keys(args) };
	}
}

export function toolResultForLog(tool: string, result: string): Record<string, unknown> {
	const failed = result.startsWith('Error:');
	const base: Record<string, unknown> = { ok: !failed, resultChars: result.length };
	if (failed) {
		base.errorPreview = result.slice(0, 280);
		return base;
	}
	if (tool === 'fetch_url') {
		return base;
	}
	if (tool === 'web_search') {
		const cap = 220;
		base.preview = result.length <= cap ? result : result.slice(0, cap) + '…';
		return base;
	}
	base.preview = result.slice(0, 140);
	return base;
}
