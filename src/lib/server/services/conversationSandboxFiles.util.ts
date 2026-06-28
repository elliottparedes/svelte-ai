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
	return attachments
		.filter((a) => a.type === 'text' && a.content?.trim())
		.map((a) => ({
			name: sanitizeSandboxFilename(a.name),
			content:
				a.content!.length > MAX_SANDBOX_BYTES
					? `${a.content!.slice(0, MAX_SANDBOX_BYTES)}\n...[truncated for sandbox]`
					: a.content!
		}));
}

export function sandboxSystemHint(files: readonly SandboxDataFile[]): string {
	if (!files.length) return '';
	const first = files[0]!.name;
	const list = files.map((f) => `'${f.name}'`).join(', ');
	return `User attached data preloaded in execute_javascript sandbox: ${list}. Workflow: (1) listFiles(), (2) parseCsv('${first}') or readTextFile('${first}'), (3) previewRows(...) for inspection. Do NOT paste the dataset into code.`;
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
		if (!file) {
			if (a.content) parts.push(`--- ${a.name} ---\n${a.content}\n---`);
			continue;
		}
		const lines = file.content.split('\n');
		const preview = lines.slice(0, 6).join('\n');
		const more = lines.length > 6 ? `\n... (${lines.length} lines total; full file as '${name}')` : '';
		parts.push(
			`--- ${a.name} ---\n${preview}${more}\n---\n[Start with execute_javascript: const rows = parseCsv('${name}'); console.log(previewRows(rows));]`
		);
	}
	return parts.length ? `${parts.join('\n\n')}\n\n${prompt}` : prompt;
}
