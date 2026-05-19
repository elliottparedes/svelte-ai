import type { GeocodedPlace, MapRouteBounds, MapRouteToolPayload, RouteMode } from '../domain/mapRoute.types';
import { NominatimGeocoder } from './nominatimGeocoder';
import { OsrmRouter } from './osrmRouter';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const GEOCODE_DELAY_MS = 1100;

type CacheEntry = { place: GeocodedPlace; at: number };

export class MapRouteService {
	private readonly cache = new Map<string, CacheEntry>();
	private lastGeocodeAt = 0;

	constructor(
		private readonly geocoder: NominatimGeocoder,
		private readonly router: OsrmRouter
	) {}

	async run(origin: string, destination: string, mode: RouteMode = 'driving'): Promise<string> {
		const o = origin.trim();
		const d = destination.trim();
		if (!o || !d) return 'Error: origin and destination are required';

		try {
			const originPlace = await this.geocodeCached(o);
			await this.rateLimitPause();
			const destPlace = await this.geocodeCached(d);
			const routed = await this.router.route(originPlace, destPlace, mode);

			const payload: MapRouteToolPayload = {
				v: 1,
				origin: originPlace,
				destination: destPlace,
				mode,
				route: {
					distanceKm: Math.round((routed.distanceM / 1000) * 10) / 10,
					durationMinutes: Math.round(routed.durationS / 60),
					geometry: routed.geometry
				},
				bounds: boundsFor(originPlace, destPlace, routed.geometry.coordinates)
			};
			return JSON.stringify(payload);
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'map route failed';
			return `Error: ${msg}`;
		}
	}

	private async geocodeCached(query: string) {
		const key = query.toLowerCase();
		const hit = this.cache.get(key);
		if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.place;
		await this.rateLimitPause();
		const place = await this.geocoder.geocode(query);
		this.cache.set(key, { place, at: Date.now() });
		return place;
	}

	private async rateLimitPause() {
		const wait = this.lastGeocodeAt + GEOCODE_DELAY_MS - Date.now();
		if (wait > 0) await new Promise((r) => setTimeout(r, wait));
		this.lastGeocodeAt = Date.now();
	}
}

function boundsFor(
	a: { lat: number; lon: number },
	b: { lat: number; lon: number },
	line: [number, number][]
): MapRouteBounds {
	let south = Math.min(a.lat, b.lat);
	let north = Math.max(a.lat, b.lat);
	let west = Math.min(a.lon, b.lon);
	let east = Math.max(a.lon, b.lon);
	for (const [lon, lat] of line) {
		south = Math.min(south, lat);
		north = Math.max(north, lat);
		west = Math.min(west, lon);
		east = Math.max(east, lon);
	}
	return { south, west, north, east };
}
