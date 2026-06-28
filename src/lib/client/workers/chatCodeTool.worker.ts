type SandboxFile = { name: string; content: string };

function parseCsvText(text: string): Record<string, string>[] {
	const lines = text.replace(/\r/g, '').split('\n').filter(Boolean);
	if (lines.length < 2) return [];
	const headers = lines[0]!.split(',').map((x) => x.trim());
	return lines.slice(1).map((line) => {
		const values = line.split(',');
		return Object.fromEntries(headers.map((h, i) => [h, (values[i] ?? '').trim()]));
	});
}

self.onmessage = async (event: MessageEvent<{ code: string; sandboxFiles: SandboxFile[] }>) => {
	const files = new Map(event.data.sandboxFiles.map((file) => [file.name, file.content]));
	const logs: string[] = [];
	const api = {
		listFiles: () => [...files.keys()],
		readTextFile: (name: string) => {
			if (!files.has(name)) throw new Error(`Missing file: ${name}`);
			return files.get(name)!;
		},
		parseCsv: (name: string) => parseCsvText(api.readTextFile(name)),
		previewRows: (rows: unknown[], limit = 20) => JSON.stringify(rows.slice(0, limit), null, 2)
	};
	const consoleLike = {
		log: (...args: unknown[]) => logs.push(args.map((x) => String(typeof x === 'string' ? x : JSON.stringify(x))).join(' '))
	};
	try {
		const fn = new Function(
			'console',
			'listFiles',
			'readTextFile',
			'parseCsv',
			'previewRows',
			`"use strict"; return (async () => { ${event.data.code}\n})();`
		);
		await fn(consoleLike, api.listFiles, api.readTextFile, api.parseCsv, api.previewRows);
		self.postMessage({ type: 'result', output: logs.join('\n').slice(0, 200000) });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		self.postMessage({ type: 'error', message });
	}
};
