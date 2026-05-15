import { error } from '@sveltejs/kit';

export class DomainError extends Error {
	constructor(
		message: string,
		public readonly status: number = 500
	) {
		super(message);
		this.name = 'DomainError';
	}
}

export function handleDomainError(err: unknown): never {
	if (err instanceof DomainError) {
		error(err.status, err.message);
	}
	throw err;
}
