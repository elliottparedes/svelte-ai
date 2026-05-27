const BRAVE_WEB = 'https://api.search.brave.com/res/v1/web/search';
const BRAVE_IMAGES = 'https://api.search.brave.com/res/v1/images/search';

function braveHeaders(apiKey: string): HeadersInit {
	return {
		Accept: 'application/json',
		'Accept-Encoding': 'gzip',
		'X-Subscription-Token': apiKey
	};
}

export async function braveWebGet(apiKey: string, params: URLSearchParams): Promise<Response> {
	return fetch(`${BRAVE_WEB}?${params}`, { headers: braveHeaders(apiKey) });
}

export async function braveImagesGet(apiKey: string, params: URLSearchParams): Promise<Response> {
	return fetch(`${BRAVE_IMAGES}?${params}`, { headers: braveHeaders(apiKey) });
}
