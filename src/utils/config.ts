// Get Mapbox token from environment variable
// For development, you can create a .env file with: VITE_MAPBOX_TOKEN=your_token_here
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

if (!MAPBOX_TOKEN) {
  console.error('⚠️ MAPBOX_TOKEN not found. Please set VITE_MAPBOX_TOKEN in your .env file');
}
