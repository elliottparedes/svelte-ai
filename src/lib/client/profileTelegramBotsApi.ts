export type TelegramBotView = {
	id: string;
	name: string;
	botUsername: string | null;
	tokenHint: string;
	status: string;
	defaultModelId: string | null;
	dailyMessageLimit: number;
	expectedWebhookUrl: string | null;
	webhookBaseConfigured: boolean;
};

export type TelegramWebhookStatus = {
	registered: boolean;
	expectedUrl: string;
	actualUrl: string;
	pendingUpdateCount: number;
	lastErrorMessage: string | null;
};

export type TelegramSetupInfo = {
	webhookBaseConfigured: boolean;
	docs: { tutorial: string; api: string; webhooks: string };
	botFatherSteps: string[];
	webhookChecklist: string[];
	tips: string[];
};

export type ChatModelLite = { id: string; name: string };

async function readJson<T>(res: Response): Promise<T> {
	if (!res.ok) {
		let message = 'Request failed';
		try {
			const body = (await res.json()) as { message?: string };
			if (body.message) message = body.message;
		} catch {
			// ignore
		}
		throw new Error(message);
	}
	return (await res.json()) as T;
}

export async function listTelegramBots(): Promise<TelegramBotView[]> {
	const res = await fetch('/api/v1/telegram/bots');
	const data = await readJson<{ bots: TelegramBotView[] }>(res);
	return data.bots;
}

export async function createTelegramBot(input: {
	name: string;
	token: string;
	defaultModelId?: string | null;
	dailyMessageLimit?: number;
}): Promise<void> {
	const res = await fetch('/api/v1/telegram/bots', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input)
	});
	if (!res.ok) throw new Error('Create failed');
}

export async function updateTelegramBot(
	id: string,
	input: { status?: 'active' | 'paused' }
): Promise<void> {
	const res = await fetch(`/api/v1/telegram/bots/${id}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input)
	});
	if (!res.ok) throw new Error('Update failed');
}

export async function deleteTelegramBot(id: string): Promise<void> {
	const res = await fetch(`/api/v1/telegram/bots/${id}`, { method: 'DELETE' });
	if (!res.ok) throw new Error('Delete failed');
}

export async function getTelegramSetupInfo(): Promise<TelegramSetupInfo> {
	const res = await fetch('/api/v1/telegram/setup');
	return readJson<TelegramSetupInfo>(res);
}

export async function syncTelegramBotWebhook(
	id: string
): Promise<TelegramWebhookStatus> {
	const res = await fetch(`/api/v1/telegram/bots/${id}/sync-webhook`, { method: 'POST' });
	const data = await readJson<{ webhook: TelegramWebhookStatus }>(res);
	return data.webhook;
}

export async function listTelegramModels(): Promise<ChatModelLite[]> {
	const res = await fetch('/api/v1/models');
	const data = await readJson<{ models: ChatModelLite[] }>(res);
	return data.models;
}
