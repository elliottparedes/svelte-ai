import type { SandboxDataFile } from '$lib/shared/clientTool';

type WorkerSuccess = { type: 'result'; output: string };
type WorkerError = { type: 'error'; message: string };

const TOOL_TIMEOUT_MS = 15_000;

export async function runClientCodeTool(
	code: string,
	sandboxFiles: readonly SandboxDataFile[]
): Promise<string> {
	const worker = new Worker(new URL('./workers/chatCodeTool.worker.ts', import.meta.url), {
		type: 'module'
	});
	return await new Promise<string>((resolve) => {
		const timer = setTimeout(() => {
			worker.terminate();
			resolve('Error: browser worker timed out.');
		}, TOOL_TIMEOUT_MS);
		worker.onmessage = (event: MessageEvent<WorkerSuccess | WorkerError>) => {
			clearTimeout(timer);
			worker.terminate();
			resolve(
				event.data.type === 'result'
					? event.data.output || '(no output)'
					: `Error: ${event.data.message || 'browser worker failed.'}`
			);
		};
		worker.onerror = (event) => {
			clearTimeout(timer);
			worker.terminate();
			resolve(`Error: ${event.message || 'browser worker crashed.'}`);
		};
		worker.postMessage({ code, sandboxFiles });
	});
}
