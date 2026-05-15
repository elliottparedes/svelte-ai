import { appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const LOG_DIR = join(process.cwd(), 'logs');
const LOG_FILE = join(LOG_DIR, 'app.log');

try {
	mkdirSync(LOG_DIR, { recursive: true });
} catch {
	// ignore
}

function timestamp(): string {
	return new Date().toISOString();
}

const DEBUG_ON = process.env.LOG_DEBUG === '1' || process.env.LOG_LEVEL === 'debug';

function write(level: string, message: string, meta?: Record<string, unknown>) {
	const metaStr = meta && Object.keys(meta).length > 0 ? ' ' + JSON.stringify(meta) : '';
	const line = `[${timestamp()}] [${level}] ${message}${metaStr}`;
	console.log(line);
	try {
		appendFileSync(LOG_FILE, line + '\n');
	} catch {
		// ignore file write errors
	}
}

export const logger = {
	info: (message: string, meta?: Record<string, unknown>) => write('INFO', message, meta),
	error: (message: string, meta?: Record<string, unknown>) => write('ERROR', message, meta),
	warn: (message: string, meta?: Record<string, unknown>) => write('WARN', message, meta),
	debug: (message: string, meta?: Record<string, unknown>) => {
		if (!DEBUG_ON) return;
		write('DEBUG', message, meta);
	}
};
