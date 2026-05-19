import type { GeocodedPlace } from '../domain/mapRoute.types';

const LAT_LON_RE = /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/;

export class NominatimGeocoder {
	constructor(
		private readonly baseUrl: string,
		private readonly userAgent: string
	) {}

	async geocode(query: string): Promise<GeocodedPlace> {
		const trimmed = query.trim();
		if (!trimmed) throw new Error('empty query');

		const direct = LAT_LON_RE.exec(trimmed);
		if (direct) {
			const lat = Number(direct[1]);
			const lon = Number(direct[2]);
			if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('invalid coordinates');
			return { label: trimmed, lat, lon };
		}

		const params = new URLSearchParams({ q: trimmed.slice(0, 200), format: 'json', limit: '1' });
		const res = await fetch(`${this.baseUrl.replace(/\/$/, '')}/search?${params}`, {
			headers: { 'User-Agent': this.userAgent, Accept: 'application/json' }
		});
		if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);

		const rows = (await res.json()) as Array<{ lat?: string; lon?: string; display_name?: string }>;
		const hit = rows[0];
		if (!hit?.lat || !hit.lon) throw new Error(`no results for "${trimmed.slice(0, 80)}"`);

		const lat = Number(hit.lat);
		const lon = Number(hit.lon);
		if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('invalid geocode response');
		return { label: hit.display_name?.trim() || trimmed, lat, lon };
	}
}
