export type RouteMode = 'driving' | 'walking' | 'cycling';

export interface GeocodedPlace {
	label: string;
	lat: number;
	lon: number;
}

export interface GeoJsonLineString {
	type: 'LineString';
	coordinates: [number, number][];
}

export interface MapRouteBounds {
	south: number;
	west: number;
	north: number;
	east: number;
}

export interface MapRouteToolPayload {
	v: 1;
	origin: GeocodedPlace;
	destination: GeocodedPlace;
	mode: RouteMode;
	route: {
		distanceKm: number;
		durationMinutes: number;
		geometry: GeoJsonLineString;
	};
	bounds: MapRouteBounds;
}
