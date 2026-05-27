const UA =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function looksLikeImageContentType(ct: string): boolean {
	const t = ct.toLowerCase();
	return t.startsWith('image/') || t.includes('octet-stream');
}

async function probe(method: 'HEAD' | 'GET', url: string, signal: AbortSignal): Promise<boolean> {
	const headers: Record<string, string> = {
		'User-Agent': UA,
		Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
	};
	if (method === 'GET') headers.Range = 'bytes=0-512';
	const res = await fetch(url, { method, headers, signal, redirect: 'follow' });
	if (!res.ok) return false;
	return looksLikeImageContentType(res.headers.get('content-type') ?? '');
}

/** Best-effort check that an image URL responds before showing it in chat. */
export async function isImageUrlLoadable(url: string, timeoutMs = 2500): Promise<boolean> {
	const ctrl = new AbortController();
	const timer = setTimeout(() => ctrl.abort(), timeoutMs);
	try {
		try {
			if (await probe('HEAD', url, ctrl.signal)) return true;
		} catch {
			// HEAD often blocked — fall through to GET
		}
		return await probe('GET', url, ctrl.signal);
	} catch {
		return false;
	} finally {
		clearTimeout(timer);
	}
}
