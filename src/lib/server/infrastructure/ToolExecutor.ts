import { SEARXNG_URL, MAP_HTTP_USER_AGENT, NOMINATIM_BASE_URL, OSRM_BASE_URL } from '../env';
import { MapRouteService } from './mapRouteService';
import { NominatimGeocoder } from './nominatimGeocoder';
import { OsrmRouter } from './osrmRouter';
import { searxngWebSearch, searxngImageSearch } from './searxngClient';
import type { RouteMode } from '../domain/mapRoute.types';

export class ToolExecutor {
	private readonly mapRouteService: MapRouteService;

	constructor(private readonly searxngUrl: string = SEARXNG_URL) {
		this.mapRouteService = new MapRouteService(
			new NominatimGeocoder(NOMINATIM_BASE_URL, MAP_HTTP_USER_AGENT),
			new OsrmRouter(OSRM_BASE_URL)
		);
	}

	async run(name: string, args: Record<string, unknown>): Promise<string> {
		switch (name) {
			case 'calculator':
				return this.runCalculator(String(args.expression ?? ''));
			case 'datetime':
				return this.runDatetime();
			case 'fetch_url':
				return await this.runFetchUrl(String(args.url ?? ''));
			case 'web_search':
				return await searxngWebSearch(this.searxngUrl, String(args.query ?? ''));
			case 'image_search':
				return await searxngImageSearch(this.searxngUrl, String(args.query ?? ''));
			case 'map_route':
				return await this.runMapRoute(args);
			default:
				return `Error: unknown tool ${name}`;
		}
	}

	private async runMapRoute(args: Record<string, unknown>): Promise<string> {
		const mode = String(args.mode ?? 'driving') as RouteMode;
		const valid: RouteMode[] = ['driving', 'walking', 'cycling'];
		const m = valid.includes(mode) ? mode : 'driving';
		return this.mapRouteService.run(String(args.origin ?? ''), String(args.destination ?? ''), m);
	}

	private runCalculator(expression: string): string {
		const safe = expression.replace(/[^0-9+\-*/().\s]/g, '');
		if (!safe) return 'Error: invalid expression';
		try {
			return String(new Function(`return (${safe})`)());
		} catch {
			return 'Error: evaluation failed';
		}
	}

	private runDatetime(): string {
		return new Date().toISOString();
	}

	private async runFetchUrl(url: string): Promise<string> {
		try {
			const res = await fetch(url, {
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
					Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
				}
			});
			if (!res.ok) return `Error: HTTP ${res.status}`;
			const html = await res.text();
			return this.htmlToText(html).slice(0, 8000);
		} catch {
			return 'Error: failed to fetch URL';
		}
	}

	private htmlToText(html: string): string {
		return html
			.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
			.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
			.replace(/<[^>]+>/g, ' ')
			.replace(/&nbsp;/g, ' ')
			.replace(/&#[0-9]+;/g, ' ')
			.replace(/&[a-z]+;/gi, ' ')
			.replace(/\s+/g, ' ')
			.trim();
	}
}
