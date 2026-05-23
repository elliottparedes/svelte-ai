export const SUMMARY_INTERVAL_DEFAULT = 15;
export const SUMMARY_HOT_TAIL_DEFAULT = 20;

/** User/assistant turns before server compacts the oldest batch beyond hot tail. */
export function compactionThreshold(
	interval = SUMMARY_INTERVAL_DEFAULT,
	hotTail = SUMMARY_HOT_TAIL_DEFAULT
): number {
	return interval + hotTail;
}
