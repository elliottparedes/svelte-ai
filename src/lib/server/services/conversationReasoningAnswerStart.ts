const ANSWER_START =
	/(?:^|[\n.!?]\s*)(?:[#>*_\-\s]*)(Yes\b|No\b|Based on\b|According to\b|Here(?:'s| is)\b|In short\b|The short answer\b|The answer is\b|I found\b)/i;

export function findReasoningAnswerStart(text: string): number | null {
	const match = ANSWER_START.exec(text);
	if (!match?.[1]) return null;
	return match.index + match[0].indexOf(match[1]);
}
