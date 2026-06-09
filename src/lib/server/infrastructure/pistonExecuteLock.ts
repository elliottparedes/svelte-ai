/** Shared Piston runners crash (signal 6) when hit concurrently — run one at a time. */
let chain: Promise<unknown> = Promise.resolve();

export function withPistonLock<T>(fn: () => Promise<T>): Promise<T> {
	const run = () => fn();
	const next = chain.then(run, run);
	chain = next.then(
		() => undefined,
		() => undefined
	);
	return next;
}
