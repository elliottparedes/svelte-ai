import type { ChatAttachment } from '../domain/ChatProvider.interface';
import { buildAugmentedPrompt } from './conversationPrompt.util';

export type SandboxDataFile = { name: string; content: string };

const MAX_SANDBOX_BYTES = 2_000_000;

export function sanitizeSandboxFilename(name: string): string {
	const base = name.split(/[/\\]/).pop() ?? 'user_data.txt';
	const safe = base.replace(/[^\w.\-]/g, '_').slice(0, 120);
	return safe || 'user_data.txt';
}

export function sandboxFilesFromAttachments(
	attachments: readonly ChatAttachment[] | undefined
): SandboxDataFile[] {
	if (!attachments?.length) return [];
	const files: SandboxDataFile[] = [];
	for (const a of attachments) {
		if (a.type !== 'text' || !a.content?.trim()) continue;
		const name = sanitizeSandboxFilename(a.name);
		let content = a.content;
		if (content.length > MAX_SANDBOX_BYTES) {
			content = `${content.slice(0, MAX_SANDBOX_BYTES)}\n...[truncated for sandbox]`;
		}
		files.push({ name, content });
	}
	return files;
}

export function sandboxSystemHint(files: readonly SandboxDataFile[]): string {
	if (!files.length) return '';
	const first = files[0]!.name;
	const list = files.map((f) => `'${f.name}'`).join(', ');
	return (
		`User attached data preloaded in execute_python sandbox: ${list}. ` +
		`Workflow: (1) inkstream_profile('${first}') for overview, (2) inkstream_read_csv + inkstream_group_means or inkstream_show for targeted analysis. ` +
		`Do NOT paste the dataset into code.`
	);
}

export function augmentPromptForSandbox(
	prompt: string,
	attachments: readonly ChatAttachment[] | undefined,
	sandboxFiles: readonly SandboxDataFile[]
): string {
	if (!sandboxFiles.length) return buildAugmentedPrompt(prompt, attachments);
	const byName = new Map(sandboxFiles.map((f) => [f.name, f]));
	const parts: string[] = [];
	for (const a of attachments ?? []) {
		if (a.type !== 'text') continue;
		const name = sanitizeSandboxFilename(a.name);
		const file = byName.get(name);
		if (file) {
			const lines = file.content.split('\n');
			const preview = lines.slice(0, 6).join('\n');
			const more = lines.length > 6 ? `\n… (${lines.length} lines total; full file in Python sandbox as '${name}')` : '';
			parts.push(
				`--- ${a.name} ---\n${preview}${more}\n---\n[Start with execute_python: inkstream_profile('${name}'), then analyze with inkstream_group_means / inkstream_show]`
			);
			continue;
		}
		if (a.content) parts.push(`--- ${a.name} ---\n${a.content}\n---`);
	}
	if (!parts.length) return prompt;
	return `${parts.join('\n\n')}\n\n${prompt}`;
}
