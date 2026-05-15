export interface User {
	id: string;
	email: string;
	name: string | null;
	apiKey: string | null;
	createdAt: Date;
}

export interface CreateUserInput {
	email: string;
	name?: string;
	apiKey?: string;
}
