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
	if (err.includes('fatal signal') || err.includes('Sandbox keeper')) {
		return (
			'Error: Piston sandbox crashed (memory limit or overloaded shared runner). ' +
			'Retry with: inkstream_profile("file.csv") only, then inkstream_group_means with top=15. ' +
			'Avoid numpy and printing full DataFrames. ' +
			`Details: ${truncate(err, 400)}`
		);
	}
	if (out) parts.push(out);
	if (err && !err.includes('fatal signal')) {
		let hint = '';
		if (err.includes('KeyError') || err.includes('missing columns')) {
			hint = '\nHint: run inkstream_profile(path) first to list exact column names.';
		} else if (err.includes('_agg_py_fallback') || err.includes('Could not convert')) {
			hint = '\nHint: use inkstream_read_csv(path) so numeric columns are coerced.';
		}
		parts.push(`[stderr]\n${err}${hint}`);
	}
	if (parts.length === 0) {
		const code = run.code ?? '?';
		const sig = run.signal ? ` signal ${run.signal}` : '';
		if (code === 0) {
			return (
				'(no stdout)\n' +
				'Program finished but printed nothing. Use inkstream_show(df), inkstream_profile(path), or print(df.head()).'
			);
		}
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
