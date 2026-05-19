/**
 * Smoke-test Nominatim + OSRM map route path.
 * Usage: npm run map:ping -- [origin] [destination] [mode]
 */
import 'dotenv/config';
import { NominatimGeocoder } from '../src/lib/server/infrastructure/nominatimGeocoder';
import { OsrmRouter } from '../src/lib/server/infrastructure/osrmRouter';
import { MapRouteService } from '../src/lib/server/infrastructure/mapRouteService';

async function main() {
	const origin = process.argv[2] ?? 'Times Square, New York';
	const destination = process.argv[3] ?? 'Central Park, New York';
	const mode = (process.argv[4] ?? 'walking') as 'driving' | 'walking' | 'cycling';

	const baseUrl = process.env.NOMINATIM_BASE_URL ?? 'https://nominatim.openstreetmap.org';
	const osrmUrl = process.env.OSRM_BASE_URL ?? 'https://router.project-osrm.org';
	const ua = process.env.MAP_HTTP_USER_AGENT ?? 'Inkstream/1.0';

	const svc = new MapRouteService(new NominatimGeocoder(baseUrl, ua), new OsrmRouter(osrmUrl));
	console.log(`Route: ${origin} → ${destination} (${mode})`);
	const result = await svc.run(origin, destination, mode);
	if (result.startsWith('Error:')) {
		console.error(result);
		process.exit(1);
	}
	const parsed = JSON.parse(result);
	console.log(JSON.stringify(parsed, null, 2).slice(0, 1200));
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
