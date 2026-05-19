import type { MapRouteToolPayload } from './mapRoute.types';

export type { MapRouteToolPayload };

export function parseMapRouteToolResult(result: string | undefined): MapRouteToolPayload | null {
	if (!result?.trim() || result.startsWith('Error:')) return null;
	try {
		const data = JSON.parse(result) as MapRouteToolPayload;
		if (data.v !== 1 || !data.origin || !data.destination || !data.route?.geometry) return null;
		return data;
	} catch {
		return null;
	}
}
