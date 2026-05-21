import type { ToolDefinition } from '../domain/ChatProvider.interface';

export const EXECUTE_PYTHON_TOOL: ToolDefinition = {
	name: 'execute_python',
	description:
		'Run Python 3.12 in a sandbox. Preinstalled: numpy, pandas, scipy, sympy (+ stdlib urllib for HTTP). NOT available: requests, beautifulsoup4, matplotlib, sklearn. Use for math, dataframes, CSV-like parsing, stats, simulations, weather APIs (wttr.in, open-meteo), JSON via urllib. Always print() results. For HTML pages use fetch_url then pandas/read_csv on text; for discovery use web_search.',
	parameters: {
		type: 'object',
		properties: {
			code: { type: 'string', description: 'Python source code to execute' }
		},
		required: ['code']
	}
};
