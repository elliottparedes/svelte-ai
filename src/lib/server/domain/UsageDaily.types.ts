export interface UsageDaily {
	id: string;
	userId: string;
	botId: string | null;
	modelId: string;
	usageDate: string;
	messagesIn: number;
	messagesOut: number;
	toolCalls: number;
	inputChars: number;
	outputChars: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface UsageDelta {
	userId: string;
	botId?: string | null;
	modelId: string;
	usageDate: string;
	messagesIn?: number;
	messagesOut?: number;
	toolCalls?: number;
	inputChars?: number;
	outputChars?: number;
}
