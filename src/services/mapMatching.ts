// import { Position } from '@capacitor/geolocation';

// OSRM Public API (Demo server - limited usage, not for production heavy load)
// const OSRM_API_URL = 'https://router.project-osrm.org/match/v1/driving';

/**
 * Align coordinates to the nearest road using OSRM.
 * Note: Use a self-hosted OSRM or commercial API for production.
 */
export const matchToRoad = async (points: { latitude: number; longitude: number; timestamp: number }[]): Promise<{ latitude: number; longitude: number } | null> => {
    if (points.length < 2) return null;

    // Format: {longitude},{latitude};{longitude},{latitude}...
    // OSRM expects [lon, lat]
    // Timestamps optional but good for matching logic

    // const coordsString = points.map(p => `${p.longitude},${p.latitude}`).join(';');
    // const timestampsString = points.map(p => Math.floor(p.timestamp / 1000)).join(';');

    try {
        // const url = `${OSRM_API_URL}/${coordsString}?timestamps=${timestampsString}&overview=false&radiuses=${points.map(() => 40).join(';')}`; // 40m search radius

        // Note: Fetch logic here. 
        // Since this is called frequently, it should be debounced or used only for path history correction, NOT real-time location (too slow).
        // Real-time map matching usually requires a local graph or very fast API.

        // For this implementation, we return null to signify "No matching performed" 
        // because calling public OSRM on every GPS update is bad practice and will get blocked.
        // However, this file serves as the architecture for the "Map Matching" request.

        // To enable:
        // const response = await fetch(url);
        // const data = await response.json();
        // if (data.code === 'Ok' && data.matchings && data.matchings.length > 0) {
        //    const lastPoint = data.matchings[0].features[0].geometry.coordinates; // extract last matched point
        //    return { latitude: lastPoint[1], longitude: lastPoint[0] };
        // }

        return null;
    } catch (err) {
        console.warn("Map matching failed:", err);
        return null;
    }
};
