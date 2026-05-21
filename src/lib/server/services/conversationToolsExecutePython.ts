import type { ToolDefinition } from '../domain/ChatProvider.interface';

export const EXECUTE_PYTHON_TOOL: ToolDefinition = {
	name: 'execute_python',
	description:
		'Run Python 3 in a sandbox with outbound HTTP (stdlib urllib only; no requests/beautifulsoup). Use for math, logic, statistics, parsing text, and light live data: weather (wttr.in, open-meteo.com), JSON APIs, simple HTTP GET. Always print() results. For a URL the user pasted or heavy HTML pages, prefer fetch_url; for broad lookup, web_search; then execute_python to parse tool output if needed.',
	parameters: {
		type: 'object',
		properties: {
			code: { type: 'string', description: 'Python source code to execute' }
		},
		required: ['code']
	}
};
