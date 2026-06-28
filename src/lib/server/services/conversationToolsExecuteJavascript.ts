import type { ToolDefinition } from '../domain/ChatProvider.interface';

export const EXECUTE_JAVASCRIPT_TOOL: ToolDefinition = {
	name: 'execute_javascript',
	description:
		'Run browser-safe JavaScript in a Web Worker. Text and CSV attachments are preloaded as files. Helpers: listFiles(), readTextFile(name), parseCsv(name), previewRows(rows, limit), and console.log(). No DOM, no secrets, no Node APIs.',
	parameters: {
		type: 'object',
		properties: {
			code: { type: 'string', description: 'JavaScript source code to execute' }
		},
		required: ['code']
	}
};
