import type { ToolDefinition } from '../domain/ChatProvider.interface';

export const EXECUTE_PYTHON_TOOL: ToolDefinition = {
	name: 'execute_python',
	description:
		'Run Python 3.12 in a sandbox with inkstream_sandbox helpers (always available): inkstream_profile(path) for EDA overview; inkstream_read_csv(path) to load CSV with numeric coercion; inkstream_group_means(df, by, [cols], top=20) for safe group summaries; inkstream_show(df) to print head(25). Attachments are preloaded as files — never embed raw data in code. Always print(); avoid numpy unless needed.',
	parameters: {
		type: 'object',
		properties: {
			code: { type: 'string', description: 'Python source code to execute' }
		},
		required: ['code']
	}
};
