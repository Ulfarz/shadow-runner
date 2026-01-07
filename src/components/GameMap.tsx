import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useGameStore } from '../store/useGameStore';
import * as turf from '@turf/turf';

const GameMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  // Connect to store
  const { userPosition, extractionPoint, shadowPosition, status, exploredPolygon } = useGameStore();

  // Initialize Map
  useEffect(() => {
    if (map.current) return;

    if (mapContainer.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: [2.3522, 48.8566], // Default Paris
        zoom: 14,
        attributionControl: false
      });

      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

      map.current.addControl(
        new maplibregl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          // @ts-ignore
          showUserHeading: true
        }),
        'bottom-right'
      );

      map.current.on('load', () => {
        if (!map.current) return;

        // --- Fog of War Layer (Bottom) ---
        map.current.addSource('fog', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] }
        });

        map.current.addLayer({
          id: 'fog-fill',
          type: 'fill',
          source: 'fog',
          paint: {
            'fill-color': '#000000',
            'fill-opacity': 0.95 // Very dark fog
          },
          // Ensure fog is above base map but below markers? 
          // Actually, strict Fog of War should hide *everything* except maybe UI overlays.
          // But usually we want to hide the MAP, but maybe show the extraction point if it's "known"?
          // For "Survival", you usually don't see the map.
          // Let's put it fairly high.
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
          type: 'circle',
          source: 'player',
          paint: {
            'circle-radius': 50, // Matches EXPLORATION_RADIUS_M approx in pixels/zoom
            'circle-color': '#3b82f6', // Blue-500
            'circle-opacity': 0.1,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#60a5fa',
            'circle-stroke-opacity': 0.5
          }
        });

        map.current.addLayer({
          id: 'player-marker',
          type: 'circle',
          source: 'player',
          paint: {
            'circle-radius': 6,
            'circle-color': '#3b82f6',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
          }
        });
      });
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

    const source = map.current.getSource('fog') as maplibregl.GeoJSONSource;
    if (source) {
      if (exploredPolygon) {
        try {
          // Create a mask: World minus Explored
          // mask() defaults to the world bbox if no second arg provided
          const fogPoly = turf.mask(exploredPolygon);
          source.setData(fogPoly);
        } catch (e) {
          console.error("Error generating fog mask:", e);
        }
      } else {
        // No exploration yet? Cover the world.
        // Create a polygon covering the whole world
        const worldPoly = turf.polygon([[
          [-180, -90],
          [180, -90],
          [180, 90],
          [-180, 90],
          [-180, -90]
        ]]);
        source.setData(worldPoly);
      }
    }
  }, [exploredPolygon]);

  // Sync Extraction Point
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const source = map.current.getSource('extraction') as maplibregl.GeoJSONSource;
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

  // Sync Shadow Position
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const source = map.current.getSource('shadow') as maplibregl.GeoJSONSource;
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

  // Sync Player Position
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const source = map.current.getSource('player') as maplibregl.GeoJSONSource;
    if (source) {
      if (userPosition) {
        source.setData({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [userPosition.longitude, userPosition.latitude]
          },
          properties: {}
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
      <div ref={mapContainer} className="absolute inset-0" />

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
