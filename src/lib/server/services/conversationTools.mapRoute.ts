import type { ToolDefinition } from '../domain/ChatProvider.interface';

/** MAP_ROUTE_DISABLED — uncomment and add to TOOLS when re-enabling map_route. */
export const MAP_ROUTE_TOOL: ToolDefinition = {
	name: 'map_route',
	description:
		'Geocode two places and compute a route (driving, walking, or cycling). Returns distance, duration, and route geometry for map display.',
	parameters: {
		type: 'object',
		properties: {
			origin: { type: 'string', description: 'Start place name, address, or "lat,lon"' },
			destination: { type: 'string', description: 'End place name, address, or "lat,lon"' },
			mode: {
				type: 'string',
				enum: ['driving', 'walking', 'cycling'],
				description: 'Travel mode (default driving)'
			}
		},
		required: ['origin', 'destination']
	}
};
