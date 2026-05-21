/** Convert assistant markdown to a Telegram-safe HTML subset for parse_mode=HTML. */
export function markdownToTelegramHtml(markdown: string): string {
	let text = markdown.replace(/\r\n/g, '\n');
	const htmlParts: string[] = [];
	const tag = (html: string) => {
		htmlParts.push(html);
		return `\x00${htmlParts.length - 1}\x00`;
	};

	text = text.replace(/```[\w]*\n?([\s\S]*?)```/g, (_m, code) =>
		tag(`<pre>${escapeHtml(String(code).trimEnd())}</pre>`)
	);
	text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, url) => {
		const label = alt ? String(alt) : 'Image';
		return `\n${escapeHtml(label)}: ${escapeHtml(String(url))}\n`;
	});
	text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, url) =>
		tag(`<a href="${escapeHtmlAttr(String(url))}">${escapeHtml(String(label))}</a>`)
	);
	text = text.replace(/^#{1,6}\s+(.+)$/gm, (_m, title) => tag(`<b>${escapeHtml(String(title))}</b>\n`));
	text = text.replace(/\*\*([^*]+)\*\*/g, (_m, inner) => tag(`<b>${escapeHtml(String(inner))}</b>`));
	text = text.replace(/__([^_]+)__/g, (_m, inner) => tag(`<b>${escapeHtml(String(inner))}</b>`));
	text = text.replace(/`([^`]+)`/g, (_m, inner) => tag(`<code>${escapeHtml(String(inner))}</code>`));
	text = text.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, (_m, inner) =>
		tag(`<i>${escapeHtml(String(inner))}</i>`)
	);
	text = text.replace(/^[ \t]*[-*]\s+/gm, '• ');
	text = text.replace(/\n{3,}/g, '\n\n');
	text = escapeHtml(text);
	return text.replace(/\x00(\d+)\x00/g, (_m, index) => htmlParts[Number(index)] ?? '');
}

function escapeHtml(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeHtmlAttr(value: string): string {
	return escapeHtml(value).replace(/"/g, '&quot;');
}
