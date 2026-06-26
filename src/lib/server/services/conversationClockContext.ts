const FALLBACK_TZ = 'America/Chicago';

function validTimeZone(timeZone?: string): string | null {
	if (!timeZone) return null;
	try {
		new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
		return timeZone;
	} catch {
		return null;
	}
}

function zonedParts(now: Date, timeZone: string): Record<string, string> {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
		timeZoneName: 'short'
	}).formatToParts(now);
	return Object.fromEntries(parts.filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]));
}

export function buildClockSystemContent(now: Date = new Date(), browserTimeZone?: string): string {
	const iso = now.toISOString();
	const timeZone = validTimeZone(browserTimeZone) ?? FALLBACK_TZ;
	const local = zonedParts(now, timeZone);
	const localDate = `${local.year}-${local.month}-${local.day}`;
	const localTime = `${local.hour}:${local.minute}:${local.second}`;
	const zone = local.timeZoneName ?? timeZone;
	const source = browserTimeZone === timeZone ? 'browser' : 'server fallback';
	return [
		`Session clock (server, authoritative): ${iso}.`,
		`User local time (${source}) is ${localDate} ${localTime} ${zone} (${timeZone}).`,
		'Use the user local date/time for "now", "today", "current", deadlines, and whether news is recent.',
		'Never say web_search or fetch_url results are fictional, future-dated, or impossible because of training memory.',
		'Those tools return live indexed web content as of this session clock; report them plainly and cite sources.'
	].join(' ');
}
