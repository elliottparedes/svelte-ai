import {
	isPistonConfigured,
	PISTON_MAX_OUTPUT_CHARS,
	PISTON_PYTHON_VERSION,
	PISTON_RUN_TIMEOUT_MS,
	PISTON_URL
} from '../env';
import { formatPistonExecuteResult, type PistonExecuteBody } from './pistonFormatResult';

type PistonRuntime = { language: string; version: string };

let cachedPythonVersion: string | null = null;

export async function executePythonOnPiston(code: string): Promise<string> {
	if (!isPistonConfigured()) {
		return 'Error: Python execution is not configured (set PISTON_URL)';
	}
	const trimmed = code.trim();
	if (!trimmed) return 'Error: empty code';

	const version = await resolvePythonVersion();
	const base = PISTON_URL.replace(/\/$/, '');

	let res: Response;
	try {
		res = await fetch(`${base}/api/v2/execute`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				language: 'python',
				version,
				files: [{ name: 'main.py', content: trimmed }],
				run_timeout: PISTON_RUN_TIMEOUT_MS
			})
		});
	} catch (e) {
		return `Error: failed to reach Piston (${String(e)})`;
	}

	const body = (await res.json().catch(() => ({}))) as PistonExecuteBody & { message?: string };
	if (!res.ok) {
		const msg = body.message ? ` — ${body.message}` : '';
		return `Error: Piston ${res.status}${msg}`;
	}
	return formatPistonExecuteResult(body, PISTON_MAX_OUTPUT_CHARS);
}

async function resolvePythonVersion(): Promise<string> {
	const configured = PISTON_PYTHON_VERSION.trim();
	if (configured) return configured;
	if (cachedPythonVersion) return cachedPythonVersion;

	const base = PISTON_URL.replace(/\/$/, '');
	const res = await fetch(`${base}/api/v2/runtimes`);
	if (!res.ok) throw new Error(`Piston runtimes ${res.status}`);
	const runtimes = (await res.json()) as PistonRuntime[];
	const py = runtimes.find((r) => r.language === 'python');
	if (!py?.version) throw new Error('no python runtime on Piston');
	cachedPythonVersion = py.version;
	return py.version;
}

/** For smoke tests — clears cached version after Piston package changes. */
export function resetPistonPythonVersionCache(): void {
	cachedPythonVersion = null;
}
