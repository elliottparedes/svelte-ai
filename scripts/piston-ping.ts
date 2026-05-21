/**
 * Smoke-test Piston Python execution.
 * Usage: npm run piston:ping
 */
import 'dotenv/config';
import { executePythonOnPiston, resetPistonPythonVersionCache } from '../src/lib/server/infrastructure/pistonClient';

async function main() {
	if (!process.env.PISTON_URL?.trim()) {
		console.error('Set PISTON_URL in .env (e.g. https://piston.paredes.cloud)');
		process.exit(1);
	}
	resetPistonPythonVersionCache();
	const code = process.argv[2] ?? 'print(2**100)\nprint(sum(range(1, 101)))';
	console.log('Piston URL:', process.env.PISTON_URL);
	console.log('Code:\n', code);
	const result = await executePythonOnPiston(code);
	console.log('---\n', result);
	if (result.startsWith('Error:')) process.exit(1);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
