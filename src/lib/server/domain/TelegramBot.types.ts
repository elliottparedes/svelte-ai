export interface TelegramBot {
	id: string;
	userId: string;
	projectId: string | null;
	name: string;
	botUsername: string | null;
	tokenCiphertext: string;
	tokenHint: string;
	webhookSecret: string;
	status: string;
	defaultModelId: string | null;
	enabledToolNames: string | null;
	dailyMessageLimit: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateTelegramBotInput {
	userId: string;
	projectId?: string | null;
	name: string;
	tokenCiphertext: string;
	tokenHint: string;
	webhookSecret: string;
	defaultModelId?: string | null;
	enabledToolNames?: string | null;
	dailyMessageLimit?: number;
}

export interface UpdateTelegramBotInput {
	projectId?: string | null;
	name?: string;
	botUsername?: string | null;
	tokenCiphertext?: string;
	tokenHint?: string;
	webhookSecret?: string;
	status?: string;
	defaultModelId?: string | null;
	enabledToolNames?: string | null;
	dailyMessageLimit?: number;
}
