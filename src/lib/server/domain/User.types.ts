export interface User {
	id: string;
	email: string;
	name: string | null;
	apiKey: string | null;
	ttsVoiceId: string | null;
	/** JSON string[]; null uses must-have optional model defaults. */
	altModelIds: string | null;
	/** free | standard | pro */
	subscriptionTier: string;
	createdAt: Date;
}

export interface UserAuthRecord {
	id: string;
	email: string;
	name: string | null;
	passwordHash: string | null;
	apiKey: string | null;
	ttsVoiceId: string | null;
	/** JSON string[]; null uses must-have optional model defaults. */
	altModelIds: string | null;
	subscriptionTier: string;
	createdAt: Date;
}

export interface CreateUserInput {
	email: string;
	passwordHash: string;
	name?: string;
	apiKey?: string;
}
