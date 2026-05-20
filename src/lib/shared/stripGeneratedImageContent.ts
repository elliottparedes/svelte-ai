import { IMAGE_GENERATION_REPLY } from './imageGenerationToolResult';

/** Remove generated-image markup before sending history to the LLM (keeps DB/UI content intact). */
export function stripGeneratedImageFromAssistantContent(content: string): string {
	let c = content.replace(/<figure class="chat-gen-image">[\s\S]*?<\/figure>\s*/gi, '');
	c = c.replace(/!\[[^\]]*\]\([^)]+\)\s*/g, '');
	c = c.trim();
	return c || IMAGE_GENERATION_REPLY;
}

export function isPersistedImageGenToolAck(content: string): boolean {
	if (!content.trim().startsWith('{')) return false;
	try {
		const j = JSON.parse(content) as { ok?: boolean; note?: string };
		return j.ok === true && typeof j.note === 'string' && j.note.includes('Image was generated');
	} catch {
		return false;
	}
}
