import { Scribe, RealtimeEvents, CommitStrategy } from '@elevenlabs/client';

export type ScribeCallbacks = {
	onPartial: (text: string) => void;
	onCommit: (text: string) => void;
	onError: (msg: string) => void;
	onConnected: () => void;
	onDisconnected: () => void;
};

export type ScribeConnection = { close(): void };

export async function connectScribe(callbacks: ScribeCallbacks): Promise<ScribeConnection> {
	console.log('[Scribe] fetching single-use token…');
	const resp = await fetch('/api/v1/stt/token', { method: 'POST' });
	if (!resp.ok) throw new Error(`Token fetch failed: ${resp.status} ${await resp.text()}`);
	const { token } = (await resp.json()) as { token: string };
	console.log('[Scribe] token ok, connecting WebSocket…');

	const conn = Scribe.connect({
		token,
		modelId: 'scribe_v2_realtime',
		commitStrategy: CommitStrategy.VAD,
		vadSilenceThresholdSecs: 1.0,
		microphone: {
			echoCancellation: true,
			noiseSuppression: true,
			autoGainControl: true
		}
	});

	conn.on(RealtimeEvents.OPEN, () => {
		console.log('[Scribe] WebSocket OPEN');
		callbacks.onConnected();
	});
	conn.on(RealtimeEvents.CLOSE, () => {
		console.log('[Scribe] WebSocket CLOSED');
		callbacks.onDisconnected();
	});
	conn.on(RealtimeEvents.SESSION_STARTED, (d: unknown) => {
		console.log('[Scribe] session started', d);
	});
	conn.on(RealtimeEvents.PARTIAL_TRANSCRIPT, (d: { text: string }) => {
		console.log('[Scribe] partial:', d.text);
		callbacks.onPartial(d.text);
	});
	conn.on(RealtimeEvents.COMMITTED_TRANSCRIPT, (d: unknown) => {
		const text = (d as { text?: string })?.text ?? '';
		console.log('[Scribe] committed raw:', d, '| trimmed:', JSON.stringify(text.trim()));
		try {
			callbacks.onCommit(text.trim());
		} catch (e) {
			console.error('[Scribe] onCommit callback threw:', e);
		}
	});
	conn.on(RealtimeEvents.ERROR, (e: unknown) => {
		const msg = e instanceof Error ? e.message : String(e);
		console.error('[Scribe] ERROR:', msg, e);
		callbacks.onError(msg);
	});

	return { close: () => { console.log('[Scribe] closing connection'); conn.close(); } };
}
