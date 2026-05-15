/// <reference types="@sveltejs/kit" />

declare global {
	namespace App {
		interface Locals {
			user: import('$lib/server/domain/User.types').User | null;
		}
		interface Error {
			message: string;
		}
	}
}

export {};
