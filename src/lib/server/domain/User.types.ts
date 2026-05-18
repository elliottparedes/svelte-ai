export interface User {
	id: string;
	email: string;
	name: string | null;
	apiKey: string | null;
	createdAt: Date;
}

export interface UserAuthRecord {
	id: string;
	email: string;
	name: string | null;
	passwordHash: string | null;
	apiKey: string | null;
	createdAt: Date;
}

export interface CreateUserInput {
	email: string;
	passwordHash: string;
	name?: string;
	apiKey?: string;
}
