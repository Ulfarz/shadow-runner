import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useGameStore } from '../store/useGameStore';
import * as turf from '@turf/turf';
import { MAPBOX_TOKEN } from '../utils/config';

// Set Mapbox Access Token and disable telemetry
mapboxgl.accessToken = MAPBOX_TOKEN;

// Disable Mapbox telemetry/analytics to prevent network errors
// @ts-ignore - telemetry is not in TypeScript types but exists
if (mapboxgl.prewarm) mapboxgl.prewarm();
// @ts-ignore
mapboxgl.setTelemetryEnabled && mapboxgl.setTelemetryEnabled(false);

// Helper to generate a simple arrow image
const createArrowImage = (width: number, height: number): HTMLImageElement => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0); // Top
    ctx.lineTo(width, height); // Bottom right
    ctx.lineTo(width / 2, height * 0.7); // Inner bottom center
    ctx.lineTo(0, height); // Bottom left
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  const img = new Image();
  img.src = canvas.toDataURL();
  return img;
};

const GameMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const hasCentered = useRef(false);

  // Connect to store
  const { userPosition, extractionPoint, shadowPosition, status, exploredPolygon, routeCoordinates, pathHistory, checkpoint, checkpointReached, setCenterOnPlayer } = useGameStore();

  // Register centerOnPlayer callback
  useEffect(() => {
    setCenterOnPlayer(() => {
      if (map.current && userPosition) {
        map.current.flyTo({
          center: [userPosition.longitude, userPosition.latitude],
          zoom: 17,
          duration: 500
        });
      }
    });
    return () => setCenterOnPlayer(null);
  }, [userPosition, setCenterOnPlayer]);

  // Auto-center on player when position is first found
  useEffect(() => {
    if (map.current && userPosition && !hasCentered.current) {
        map.current.flyTo({
            center: [userPosition.longitude, userPosition.latitude],
            zoom: 17,
            duration: 2000 // Smooth fly to user
        });
        hasCentered.current = true;
    }
  }, [userPosition]);

  // Initialize Map
  useEffect(() => {
    if (map.current) return;

    if (mapContainer.current) {
      try {
        console.log("Initializing GameMap with Mapbox...");
        
        // Check if we already have a position to start with
        const initialPos = useGameStore.getState().userPosition;
        const startCenter: [number, number] = initialPos 
            ? [initialPos.longitude, initialPos.latitude] 
            : [2.3522, 48.8566]; // Default Paris

        if (initialPos) {
            hasCentered.current = true;
        }

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/dark-v11', // Dark style for better gaming feel
          center: startCenter,
          zoom: 16, // Closer zoom for gameplay
          attributionControl: false, // Hide Mapbox attribution
          logoPosition: 'bottom-left', // Move logo to less intrusive position
          pitchWithRotate: false, // Disable pitch with rotate for cleaner mobile UX
          dragRotate: false, // Disable rotation for simpler UX
          touchZoomRotate: true, // Keep pinch zoom
          doubleClickZoom: false, // Disable double-click zoom
          fadeDuration: 0, // No fade for snappier tile loading
        });

        // GeolocateControl for centering on user (no visible button needed, triggered programmatically)
        const geolocateControl = new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserLocation: false, // We draw our own player marker
          showUserHeading: false
        });
        map.current.addControl(geolocateControl, 'bottom-right');

        // Hide the geolocate button with CSS - we track automatically
        const geolocateBtn = document.querySelector('.mapboxgl-ctrl-geolocate');
        if (geolocateBtn) (geolocateBtn as HTMLElement).style.display = 'none';

        map.current.on('error', (e) => {
          console.error("Mapbox Error:", e);
        });

        map.current.on('load', () => {
          console.log("Map style loaded");
          if (!map.current) return;

          // --- Atmospheric Fog removed for visibility test ---

          // --- Load Fog Texture ---
          if (!map.current.hasImage('fog-texture')) {
            map.current.loadImage('/fog-texture.png', (error, image) => {
              if (error) {
                console.error("Failed to load fog texture:", error);
                return;
              }
              if (!map.current) return;
              if (image && !map.current.hasImage('fog-texture')) {
                map.current.addImage('fog-texture', image);

                // Update fog layer to use texture after loading
                if (map.current.getLayer('fog-fill')) {
                  map.current.setPaintProperty('fog-fill', 'fill-pattern', 'fog-texture');
                  map.current.setPaintProperty('fog-fill', 'fill-opacity', 1); // Full opacity for the pattern
                  map.current.setPaintProperty('fog-fill', 'fill-color', "rgba(0,0,0,0)"); // Remove solid color
                }
              }
            });
          }
          
          // --- Add Heading Arrow Image ---
          if (!map.current.hasImage('player-arrow')) {
             const arrowImg = createArrowImage(48, 48);
             arrowImg.onload = () => {
                 if (!map.current) return;
                 if (!map.current.hasImage('player-arrow')) {
                    map.current.addImage('player-arrow', arrowImg);
                 }
             };
          }

          // --- Route Source & Layer ---
          map.current.addSource('route', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
          });

          map.current.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#fbbf24', // Amber-400
              'line-width': 4,
              'line-opacity': 0.8,
              'line-dasharray': [2, 2] // Dashed
            }
          });

          // --- Path History Source & Layer ---
          map.current.addSource('path-history', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
          });

          map.current.addLayer({
            id: 'path-history-line',
            type: 'line',
            source: 'path-history',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#06b6d4', // Cyan-500
              'line-width': 4,
              'line-opacity': 0.8
            }
          });

          // --- Fog of War Layer (Above map tiles, below game elements) ---
          map.current.addSource('fog', {
            type: 'geojson',
            data: turf.polygon([[[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]]]) // Start fully obscured
          });

          map.current.addLayer({
            id: 'fog-fill',
            type: 'fill',
            source: 'fog',
            paint: {
              'fill-color': '#202020', // Fallback color while texture loads
              'fill-opacity': 0.95
            }
          });

          // --- Extraction Point Source & Layer ---
          map.current.addSource('extraction', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
          });

          map.current.addLayer({
            id: 'extraction-glow',
            type: 'circle',
            source: 'extraction',
            paint: {
              'circle-radius': 40,
              'circle-color': '#10b981', // Emerald-500
              'circle-opacity': 0.3,
              'circle-blur': 0.5
            }
          });

          map.current.addLayer({
            id: 'extraction-core',
            type: 'circle',
            source: 'extraction',
            paint: {
              'circle-radius': 10,
              'circle-color': '#34d399', // Emerald-400
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff'
            }
          });

          // --- Checkpoint Source & Layer ---
          map.current.addSource('checkpoint', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
          });

          map.current.addLayer({
            id: 'checkpoint-glow',
            type: 'circle',
            source: 'checkpoint',
            paint: {
              'circle-radius': 30,
              'circle-color': '#f59e0b', // Amber-500
              'circle-opacity': 0.3,
              'circle-blur': 0.5
            }
          });

          map.current.addLayer({
            id: 'checkpoint-core',
            type: 'circle',
            source: 'checkpoint',
            paint: {
              'circle-radius': 8,
              'circle-color': '#fbbf24', // Amber-400
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff'
            }
          });

          // --- Shadow Source & Layer ---
          map.current.addSource('shadow', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
          });

          map.current.addLayer({
            id: 'shadow-glow',
            type: 'circle',
            source: 'shadow',
            paint: {
              'circle-radius': 50,
              'circle-color': '#ef4444', // Red-500
              'circle-opacity': 0.2,
              'circle-blur': 0.4
            }
          });

          map.current.addLayer({
            id: 'shadow-core',
            type: 'circle',
            source: 'shadow',
            paint: {
              'circle-radius': 8,
              'circle-color': '#dc2626', // Red-600
              'circle-stroke-width': 2,
              'circle-stroke-color': '#7f1d1d'
            }
          });

          // --- Player Source & Layer (Visual Position) ---
          map.current.addSource('player', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
          });

          map.current.addLayer({
            id: 'player-radius',
            type: 'fill',
            source: 'player',
            filter: ['==', 'type', 'radius'],
            paint: {
              'fill-color': '#3b82f6', // Blue-500
              'fill-opacity': 0.15,
              'fill-outline-color': '#60a5fa'
            }
          });

          map.current.addLayer({
            id: 'player-radius-outline',
            type: 'line',
            source: 'player',
            filter: ['==', 'type', 'radius'],
            paint: {
              'line-color': '#60a5fa',
              'line-width': 1,
              'line-opacity': 0.5
            }
          });

          map.current.addLayer({
            id: 'player-marker',
            type: 'circle',
            source: 'player',
            filter: ['==', 'type', 'point'],
            paint: {
              'circle-radius': 6,
              'circle-color': '#3b82f6',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff'
            }
          });

          // --- Player Heading Arrow Layer ---
          map.current.addLayer({
            id: 'player-heading',
            type: 'symbol',
            source: 'player',
            filter: ['==', 'type', 'point'],
            layout: {
              'icon-image': 'player-arrow',
              'icon-size': 0.5,
              'icon-rotate': ['get', 'heading'],
              'icon-rotation-alignment': 'map',
              'icon-allow-overlap': true,
              'icon-ignore-placement': true
            },
            paint: {
              'icon-opacity': ['case', ['==', ['get', 'heading'], null], 0, 1] // Hide if heading is null
            }
          });
        });
      } catch (err) {
        console.error("Failed to initialize map:", err);
      }
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Sync Fog of War
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const source = map.current.getSource('fog') as mapboxgl.GeoJSONSource;
    if (source) {
      if (exploredPolygon) {
        try {
          // Create a mask: World minus Explored (hides everything except explored areas)
          const fogPoly = turf.mask(exploredPolygon);
          source.setData(fogPoly);
        } catch (e) {
          console.error("Error generating fog mask:", e);
        }
      } else {
        // No exploration yet: show full fog (blackout)
        const worldMask = turf.polygon([[[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]]]);
        source.setData(worldMask);
      }
    }
  }, [exploredPolygon]);

  // Sync Route
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const source = map.current.getSource('route') as mapboxgl.GeoJSONSource;
    if (source) {
      if (routeCoordinates) {
        source.setData({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: routeCoordinates
          },
          properties: {}
        });
      } else {
        source.setData({ type: 'FeatureCollection', features: [] });
      }
    }
  }, [routeCoordinates]);

  // Sync Path History
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const source = map.current.getSource('path-history') as mapboxgl.GeoJSONSource;
    if (source) {
      if (pathHistory && pathHistory.length > 0) {
        source.setData({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: pathHistory
          },
          properties: {}
        });
      } else {
        source.setData({ type: 'FeatureCollection', features: [] });
      }
    }
  }, [pathHistory]);

  // Sync Extraction Point
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const source = map.current.getSource('extraction') as mapboxgl.GeoJSONSource;
    if (source) {
      if (extractionPoint) {
        source.setData({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [extractionPoint.longitude, extractionPoint.latitude]
          },
          properties: {}
        });
      } else {
        source.setData({ type: 'FeatureCollection', features: [] });
      }
    }
  }, [extractionPoint]);

  // Sync Checkpoint
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const source = map.current.getSource('checkpoint') as mapboxgl.GeoJSONSource;
    if (source) {
      if (checkpoint && !checkpointReached) {
        source.setData({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [checkpoint.longitude, checkpoint.latitude]
          },
          properties: {}
        });
      } else {
        source.setData({ type: 'FeatureCollection', features: [] });
      }
    }
  }, [checkpoint, checkpointReached]);

  // Sync Shadow Position
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const source = map.current.getSource('shadow') as mapboxgl.GeoJSONSource;
    if (source) {
      if (shadowPosition) {
        source.setData({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [shadowPosition.longitude, shadowPosition.latitude]
          },
          properties: {}
        });
      } else {
        source.setData({ type: 'FeatureCollection', features: [] });
      }
    }
  }, [shadowPosition]);

  // Sync Player Position & Radius
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const source = map.current.getSource('player') as mapboxgl.GeoJSONSource;
    if (source) {
      if (userPosition) {
        const point = turf.point([userPosition.longitude, userPosition.latitude]);
        // Create 50m radius circle for visual representation
        const radiusPoly = turf.circle(point, 0.05, { units: 'kilometers', steps: 64 });

        source.setData({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: point.geometry,
              properties: { 
                type: 'point',
                heading: userPosition.heading 
              }
            },
            {
              type: 'Feature',
              geometry: radiusPoly.geometry,
              properties: { type: 'radius' }
            }
          ]
        });
      } else {
        source.setData({ type: 'FeatureCollection', features: [] });
      }
    }
  }, [userPosition]);

  // Calculate hazard opacity based on distance (start showing at 500m, max at 20m)
  const getHazardOpacity = (shadowDistance: number | null) => {
    if (!shadowDistance && shadowDistance !== 0) return 0;
    if (status === 'CAUGHT') return 0.8; // Max intensity

    const MAX_DIST = 500;
    const MIN_DIST = 20; // Catch radius

    if (shadowDistance > MAX_DIST) return 0;

    // Normalize 0 to 1
    // (500 - 20) = 480 range
    // if dist = 260, (500-260)/480 = 0.5
    const intensity = (MAX_DIST - Math.max(shadowDistance, MIN_DIST)) / (MAX_DIST - MIN_DIST);
    return Math.min(Math.max(intensity, 0), 0.8); // Cap at 0.8
  };

  const hazardOpacity = useGameStore((state) => getHazardOpacity(state.shadowDistance));

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950">
      <div ref={mapContainer} className="absolute inset-0" style={{ width: '100%', height: '100%' }} />

      {/* Title */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h1 className="text-2xl font-black text-white tracking-tighter uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
          Shadow <span className="text-red-600">Runner</span>
        </h1>
        {status !== 'IDLE' && (
          <div className={`text-xs font-mono font-bold mt-1 ${status === 'ACTIVE' ? 'text-emerald-400' :
            status === 'CAUGHT' ? 'text-red-500' :
              status === 'EXTRACTED' ? 'text-blue-400' : 'text-slate-500'
            }`}>
            STATUS: {status}
          </div>
        )}
      </div>

      {/* Proximity Hazard Pulse */}
      {(status === 'ACTIVE' || status === 'CAUGHT') && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500 ease-in-out"
          style={{
            boxShadow: `inset 0 0 100px 50px rgba(220, 38, 38, ${hazardOpacity})`,
            zIndex: 5
          }}
        />
      )}

      {/* Explicit Border for End States */}
      {status === 'CAUGHT' && (
        <div className="absolute inset-0 border-[20px] border-red-600/50 pointer-events-none animate-pulse z-10" />
      )}
      {status === 'EXTRACTED' && (
        <div className="absolute inset-0 border-[20px] border-emerald-600/50 pointer-events-none z-10" />
      )}
    </div>
  );
};

export default GameMap;
