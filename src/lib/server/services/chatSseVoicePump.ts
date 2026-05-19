import type { ConversationProcessEvent } from './conversationProcess.types';
import type { ChatStreamVoiceRelay } from './ChatStreamVoiceRelay';

export async function pumpChatSseWithVoice(
	chunks: AsyncIterable<ConversationProcessEvent>,
	writeLine: (sseDataLine: string) => void,
	voice: ChatStreamVoiceRelay | null
): Promise<string | undefined> {
	let conversationId: string | undefined;
	for await (const chunk of chunks) {
		if (chunk.type === 'done') conversationId = chunk.conversationId;
		if (chunk.type === 'chunk' && voice) voice.feedText(chunk.content);
		writeLine(`data: ${JSON.stringify(chunk)}\n\n`);
	}
	if (voice) await voice.finish();
	return conversationId;
}
