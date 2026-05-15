/** Parses `[Image: …]` / `[File: …]` markers out of stored user message text. */
export function parseMessageAttachments(content: string): {
	text: string;
	imageNames: string[];
	fileNames: string[];
} {
	const imageNames: string[] = [];
	const fileNames: string[] = [];
	let text = content;

	const imageRegex = /\[Image: ([^\]]+)\]/g;
	let match;
	while ((match = imageRegex.exec(content)) !== null) {
		imageNames.push(match[1]);
	}
	text = text.replace(imageRegex, '');

	const fileRegex = /\[File: ([^\]]+)\]/g;
	while ((match = fileRegex.exec(content)) !== null) {
		fileNames.push(match[1]);
	}
	text = text.replace(fileRegex, '');

	return { text: text.trim(), imageNames, fileNames };
}

export function formatMessageTime(date: Date | string | undefined): string {
	if (!date) return '';
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
