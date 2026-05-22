/** Authoritative session date/time — models often wrongly assume an older year from training. */
export function buildClockSystemContent(now: Date = new Date()): string {
	const iso = now.toISOString();
	const date = iso.slice(0, 10);
	return [
		`Session clock (server, authoritative — not your training cutoff): ${iso}.`,
		`Today is ${date}. Use this for "now", "today", "current", and whether news is recent.`,
		'Never say web_search or fetch_url results are fictional, future-dated, or impossible because of your training memory.',
		'Those tools return live indexed web content as of the session clock; report them plainly and cite sources.',
		'If a result date is after your training cutoff, that is expected — trust the tool output.'
	].join(' ');
}
