export async function parseAuthError(res: Response): Promise<string> {
	try {
		const data = await res.json();
		if (typeof data?.message === 'string') return data.message;
	} catch {
		/* ignore */
	}
	return 'Request failed';
}
