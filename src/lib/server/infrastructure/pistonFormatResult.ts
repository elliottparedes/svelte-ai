type PistonStage = {
	stdout?: string;
	stderr?: string;
	code?: number | null;
	signal?: string | null;
};

export type PistonExecuteBody = {
	message?: string;
	run?: PistonStage;
	compile?: PistonStage;
};

export function formatPistonExecuteResult(body: PistonExecuteBody, maxChars: number): string {
	if (body.compile?.code !== 0 && body.compile?.code != null) {
		const err = (body.compile.stderr || body.compile.stdout || '').trim();
		return `Error: compile failed (exit ${body.compile.code})${err ? `\n${truncate(err, maxChars)}` : ''}`;
	}
	const run = body.run;
	if (!run) return 'Error: no run output from Piston';
	const parts: string[] = [];
	const out = (run.stdout || '').trimEnd();
	const err = (run.stderr || '').trimEnd();
	if (out) parts.push(out);
	if (err) parts.push(`[stderr]\n${err}`);
	if (parts.length === 0) {
		const code = run.code ?? '?';
		const sig = run.signal ? ` signal ${run.signal}` : '';
		return `Error: program exited with code ${code}${sig} (no output)`;
	}
	if (run.code !== 0 && run.code != null) {
		parts.push(`[exit code ${run.code}]`);
	}
	return truncate(parts.join('\n'), maxChars);
}

function truncate(s: string, max: number): string {
	if (s.length <= max) return s;
	return s.slice(0, max) + '\n…(output truncated)';
}
