const NOISE =
	/<(?:nav|header|footer|aside|noscript|iframe|svg|form)\b[^>]*>[\s\S]*?<\/(?:nav|header|footer|aside|noscript|iframe|svg|form)>/gi;

function pickMainHtml(html: string): string {
	const patterns = [
		/<main\b[^>]*>([\s\S]*?)<\/main>/i,
		/<article\b[^>]*>([\s\S]*?)<\/article>/i,
		/<div[^>]+class="[^"]*\b(?:post-content|article-body|entry-content|markdown-body|story-body)\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i
	];
	for (const re of patterns) {
		const m = html.match(re);
		if (m?.[1] && m[1].length > 200) return m[1];
	}
	return html;
}

function stripTags(html: string): string {
	return html
		.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
		.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
		.replace(NOISE, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/&#[0-9]+;/g, ' ')
		.replace(/&[a-z]+;/gi, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/** HTML → plain text, preferring main/article content over nav chrome. */
export function htmlToPageText(html: string): string {
	return stripTags(pickMainHtml(html));
}
