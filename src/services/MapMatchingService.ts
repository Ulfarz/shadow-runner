import { MAPBOX_TOKEN } from '../utils/config';

interface MatchResponse {
    matchings: {
        geometry: {
            coordinates: number[][]; // [lng, lat]
            type: string;
        };
        confidence: number;
        duration: number;
        distance: number;
    }[];
    code: string;
    message?: string;
}

export const MapMatchingService = {
    /**
     * Snaps a sequence of coordinates to the road network using Mapbox Map Matching API.
     * @param coordinates Array of {latitude, longitude} objects (chronological order)
     * @returns Array of {latitude, longitude} objects representing the matched path (or original if failed)
     */
    async matchPath(coordinates: { latitude: number; longitude: number }[]): Promise<{ latitude: number; longitude: number }[]> {
        // Need at least 2 points to match a path
        if (coordinates.length < 2) return coordinates;

        // Mapbox limits: max 100 coordinates, max 60 requests/min (free tier mostly).
        // We select the most recent 25 points to keep the request light and relevant.
        const subset = coordinates.slice(-25);

        // Format: "lng,lat;lng,lat;..."
        const coordString = subset
            .map(c => `${c.longitude},${c.latitude}`)
            .join(';');

        // API Endpoint
        // walking profile is usually best for runners/pedestrians (avoids highways, allows paths)
        const profile = 'mapbox/walking';
        const url = `https://api.mapbox.com/matching/v5/${profile}/${coordString}?geometries=geojson&steps=false&radiuses=${subset.map(() => 20).join(';')}&access_token=${MAPBOX_TOKEN}`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                // Handle 4xx/5xx
                console.warn(`Map Matching API Error: ${response.status} ${response.statusText}`);
                return coordinates; // Fallback
            }

            const data: MatchResponse = await response.json();

            if (data.code === 'Ok' && data.matchings && data.matchings.length > 0) {
                // The first match is the "best" match
                const bestMatch = data.matchings[0];

                // Convert [lng, lat] back to {latitude, longitude}
                const matchedPath = bestMatch.geometry.coordinates.map(coord => ({
                    latitude: coord[1],
                    longitude: coord[0]
                }));

                // Keep the output aligned with the input size/intent? 
                // Map Matching might return MORE points (intermediate geometry) or FEWER.
                // We typically want the snapped equivalent of our input path.
                // But for game logic, returning the detailed geometry is actually better (curves on roads).

                return matchedPath;
            } else {
                console.debug('Map Matching code not OK:', data.code);
            }
        } catch (error) {
            console.warn('Map Matching fetch failed:', error);
        }

        // Fail-safe: return original
        return coordinates;
    }
};
