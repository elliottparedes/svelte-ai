<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type { MapRouteToolPayload } from '$lib/shared/mapRoute.types';
	import 'leaflet/dist/leaflet.css';

	let { data } = $props<{ data: MapRouteToolPayload }>();

	let mapEl = $state<HTMLDivElement | null>(null);

	onMount(() => {
		if (!browser || !mapEl) return;

		let cancelled = false;
		let observer: ResizeObserver | undefined;
		let map: import('leaflet').Map | undefined;

		void import('leaflet').then((L) => {
			if (cancelled || !mapEl) return;

			const b = data.bounds;
			const bounds = L.latLngBounds([b.south, b.west], [b.north, b.east]);

			map = L.map(mapEl, { zoomControl: true, attributionControl: true });
			L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
				maxZoom: 19,
				attribution:
					'&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
			}).addTo(map);

			const pin = (label: string, color: string) =>
				L.divIcon({
					className: 'map-route-pin',
					html: `<span style="background:${color}">${label}</span>`,
					iconSize: [22, 22],
					iconAnchor: [11, 11]
				});

			L.marker([data.origin.lat, data.origin.lon], { icon: pin('A', '#89b4fa') }).addTo(map);
			L.marker([data.destination.lat, data.destination.lon], { icon: pin('B', '#f38ba8') }).addTo(map);

			const latLngs = data.route.geometry.coordinates.map((c: [number, number]) =>
				L.latLng(c[1], c[0])
			);
			L.polyline(latLngs, { color: '#89b4fa', weight: 4, opacity: 0.85 }).addTo(map);

			const refit = () => {
				map?.invalidateSize({ pan: false });
				map?.fitBounds(bounds, { padding: [28, 28] });
			};
			refit();
			requestAnimationFrame(refit);
			window.setTimeout(refit, 120);

			observer = new ResizeObserver(refit);
			observer.observe(mapEl);
		});

		return () => {
			cancelled = true;
			observer?.disconnect();
			map?.remove();
		};
	});
</script>

<div class="map-wrap" bind:this={mapEl} role="img" aria-label="Route map preview"></div>

<style>
	.map-wrap {
		width: 100%;
		min-width: 0;
		height: 280px;
		border-radius: 8px;
		border: 1px solid #252537;
		background: #11111b;
		overflow: hidden;
	}
	:global(.map-route-pin) {
		background: transparent;
		border: none;
	}
	:global(.map-route-pin span) {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		font-size: 0.65rem;
		font-weight: 700;
		color: #11111b;
		border: 2px solid #cdd6f4;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
	}
</style>
