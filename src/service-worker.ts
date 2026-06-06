/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

const worker = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `inkstream-${version}`;
const APP_SHELL = [...build, ...files, '/'];

worker.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(APP_SHELL))
			.then(() => worker.skipWaiting())
	);
});

worker.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
			.then(() => worker.clients.claim())
	);
});

worker.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;

	const url = new URL(request.url);
	if (url.origin === location.origin && url.pathname.startsWith('/api/')) return;

	if (request.mode === 'navigate') {
		event.respondWith(fetch(request).catch(() => caches.match('/').then((res) => res ?? Response.error())));
		return;
	}

	if (['font', 'image', 'manifest', 'script', 'style'].includes(request.destination)) {
		event.respondWith(cacheFirst(request));
	}
});

async function cacheFirst(request: Request): Promise<Response> {
	const cached = await caches.match(request);
	if (cached) return cached;
	const response = await fetch(request);
	if (response.ok) {
		const cache = await caches.open(CACHE);
		cache.put(request, response.clone());
	}
	return response;
}
