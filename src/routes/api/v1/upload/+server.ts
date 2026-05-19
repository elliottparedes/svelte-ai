import type { RequestHandler } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']);
const ALLOWED_PDF = new Set(['application/pdf']);
const ALLOWED_TEXT = new Set([
	'text/plain', 'text/markdown', 'text/x-markdown',
	'application/json', 'text/json',
	'text/csv', 'text/tab-separated-values',
	'text/javascript', 'application/javascript',
	'text/typescript', 'application/typescript',
	'text/html', 'text/css', 'text/xml', 'text/yaml',
	'application/x-sh', 'text/x-sh',
	'text/x-python', 'text/x-java', 'text/x-c', 'text/x-c++',
	'text/x-go', 'text/x-rust',
	// Common code mime types and fallback
]);

function isTextFile(name: string, type: string): boolean {
	if (ALLOWED_TEXT.has(type)) return true;
	const ext = name.split('.').pop()?.toLowerCase();
	if (!ext) return false;
	const codeExts = new Set([
		'txt', 'md', 'markdown', 'json', 'csv', 'tsv', 'yaml', 'yml',
		'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'sass',
		'py', 'java', 'c', 'cpp', 'cc', 'h', 'hpp', 'cs', 'go', 'rs',
		'rb', 'php', 'swift', 'kt', 'scala', 'r', 'sql', 'sh', 'bash',
		'zsh', 'fish', 'ps1', 'bat', 'cmd', 'dockerfile', 'makefile',
		'graphql', 'gql', 'proto', 'toml', 'ini', 'cfg', 'conf',
		'env', 'lock', 'log', 'diff', 'patch', 'svg'
	]);
	return codeExts.has(ext);
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Unauthorized');

	const form = await request.formData();
	const file = form.get('file');

	if (!file || !(file instanceof File)) {
		error(400, 'No file provided');
	}

	if (file.size > MAX_SIZE) {
		error(413, 'File too large (max 10MB)');
	}

	const buffer = Buffer.from(await file.arrayBuffer());

	if (ALLOWED_IMAGE.has(file.type)) {
		const dataUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
		return json({
			type: 'image',
			name: file.name,
			dataUrl,
			mimeType: file.type
		});
	}

	if (ALLOWED_PDF.has(file.type) || file.name.toLowerCase().endsWith('.pdf')) {
		const dataUrl = `data:application/pdf;base64,${buffer.toString('base64')}`;
		return json({
			type: 'file',
			name: file.name,
			dataUrl,
			mimeType: 'application/pdf'
		});
	}

	if (isTextFile(file.name, file.type)) {
		return json({
			type: 'text',
			name: file.name,
			content: buffer.toString('utf-8'),
			mimeType: file.type || 'text/plain'
		});
	}

	error(415, 'Unsupported file type');
};
