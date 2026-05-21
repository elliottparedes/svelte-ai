export interface TelegramChatBinding {
	id: string;
	botId: string;
	telegramChatId: string;
	conversationId: string;
	lastUpdateId: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateTelegramChatBindingInput {
	botId: string;
	telegramChatId: string;
	conversationId: string;
	lastUpdateId?: string | null;
}

export interface UpdateTelegramChatBindingInput {
	conversationId?: string;
	lastUpdateId?: string | null;
}
