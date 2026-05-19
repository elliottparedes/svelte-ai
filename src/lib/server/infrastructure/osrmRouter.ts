import type { GeocodedPlace, GeoJsonLineString, RouteMode } from '../domain/mapRoute.types';

const PROFILE: Record<RouteMode, string> = {
	driving: 'driving',
	walking: 'foot',
	cycling: 'bike'
};

export interface OsrmRouteResult {
	distanceM: number;
	durationS: number;
	geometry: GeoJsonLineString;
}

export class OsrmRouter {
	constructor(private readonly baseUrl: string) {}

	async route(origin: GeocodedPlace, destination: GeocodedPlace, mode: RouteMode): Promise<OsrmRouteResult> {
		const profile = PROFILE[mode];
		const coords = `${origin.lon},${origin.lat};${destination.lon},${destination.lat}`;
		const params = new URLSearchParams({ overview: 'full', geometries: 'geojson' });
		const url = `${this.baseUrl.replace(/\/$/, '')}/route/v1/${profile}/${coords}?${params}`;

		const res = await fetch(url, { headers: { Accept: 'application/json' } });
		if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);

		const data = (await res.json()) as {
			code?: string;
			routes?: Array<{ distance?: number; duration?: number; geometry?: GeoJsonLineString }>;
		};
		if (data.code !== 'Ok' || !data.routes?.[0]) {
			throw new Error(data.code === 'NoRoute' ? 'no route found' : 'routing failed');
		}

		const r = data.routes[0];
		const geometry = r.geometry;
		if (!geometry?.coordinates?.length) throw new Error('empty route geometry');

		return {
			distanceM: r.distance ?? 0,
			durationS: r.duration ?? 0,
			geometry: simplifyLine(geometry, 500)
		};
	}
}

function simplifyLine(geometry: GeoJsonLineString, maxPoints: number): GeoJsonLineString {
	const coords = geometry.coordinates;
	if (coords.length <= maxPoints) return geometry;
	const step = Math.ceil(coords.length / maxPoints);
	const out: [number, number][] = [];
	for (let i = 0; i < coords.length; i += step) out.push(coords[i]);
	const last = coords[coords.length - 1];
	if (out[out.length - 1] !== last) out.push(last);
	return { type: 'LineString', coordinates: out };
}
