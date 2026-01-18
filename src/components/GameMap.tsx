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

// Helper to generate a flag/target image data (Synchronous)
const createFlagData = (width: number, height: number): ImageData | null => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Draw Flag Pole
  ctx.strokeStyle = '#f59e0b'; // Amber-500
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(width * 0.3, height);
  ctx.lineTo(width * 0.3, height * 0.2);
  ctx.stroke();

  // Draw Flag Banner
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.moveTo(width * 0.3, height * 0.2);
  ctx.lineTo(width * 0.9, height * 0.35);
  ctx.lineTo(width * 0.3, height * 0.5);
  ctx.fill();

  return ctx.getImageData(0, 0, width, height);
};

// Helper to generate a simple arrow image data (Synchronous)
const createArrowData = (width: number, height: number): ImageData | null => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(width / 2, 0); // Top
  ctx.lineTo(width, height); // Bottom right
  ctx.lineTo(width / 2, height * 0.75); // Inner bottom center
  ctx.lineTo(0, height); // Bottom left
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  return ctx.getImageData(0, 0, width, height);
};

const GameMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const hasCentered = useRef(false);
  const followingUser = useRef(true);

  // Animation Refs
  const lastRenderedPos = useRef<{ lat: number; lng: number; heading: number | null } | null>(null);
  const startPos = useRef<{ lat: number; lng: number; heading: number | null } | null>(null);
  const targetPos = useRef<{ lat: number; lng: number; heading: number | null } | null>(null);
  const animationStartTime = useRef<number>(0);
  const animationFrameId = useRef<number>();

  const [isMapLoaded, setIsMapLoaded] = React.useState(false);

  // Connect to store
  const { userPosition, extractionPoint, shadowPosition, status, checkpoint, checkpointReached, pathHistory, shadowDistance, setCenterOnPlayer, setCenterOnExtraction } = useGameStore();

  // --- Animation Helpers ---
  const lerp = (start: number, end: number, t: number) => start + (end - start) * t;
  const lerpAngle = (start: number, end: number, t: number) => {
    const delta = ((end - start + 540) % 360) - 180;
    return start + delta * t;
  };

  // --- Effects ---

  // 1. Register centerOnPlayer callback
  useEffect(() => {
    setCenterOnPlayer(() => {
      if (map.current && userPosition) {
        followingUser.current = true;
        if (status !== 'GAME_OVER' && status !== 'VICTORY') {
          map.current.flyTo({
            center: [userPosition.longitude, userPosition.latitude],
            zoom: 17,
            duration: 500
          });
        }
      }
    });
    return () => setCenterOnPlayer(null);
  }, [userPosition, setCenterOnPlayer, status]);

  // 1b. Register centerOnExtraction callback
  useEffect(() => {
    setCenterOnExtraction(() => {
      if (map.current && extractionPoint) {
        followingUser.current = false; // Stop following user
        map.current.flyTo({
          center: [extractionPoint.longitude, extractionPoint.latitude],
          zoom: 16,
          pitch: 60, // Cinematic angle
          duration: 2000
        });
      }
    });
    return () => setCenterOnExtraction(null);
  }, [extractionPoint, setCenterOnExtraction]);

  // 2. Update Target for Animation
  useEffect(() => {
    if (!userPosition) return;
    const newTarget = {
      lat: userPosition.latitude,
      lng: userPosition.longitude,
      heading: userPosition.heading
    };

    if (!lastRenderedPos.current) {
      lastRenderedPos.current = newTarget;
      startPos.current = newTarget;
      targetPos.current = newTarget;
      animationStartTime.current = performance.now();
    } else {
      startPos.current = { ...lastRenderedPos.current };
      targetPos.current = newTarget;
      animationStartTime.current = performance.now();
    }
  }, [userPosition]);

  // 3. Animation Loop
  useEffect(() => {
    const animate = (time: number) => {
      animationFrameId.current = requestAnimationFrame(animate);

      if (!isMapLoaded || !map.current || !startPos.current || !targetPos.current || !lastRenderedPos.current) return;

      const duration = 1000;
      const elapsed = time - animationStartTime.current;
      const t = Math.min(Math.max(elapsed / duration, 0), 1);

      const currentLat = lerp(startPos.current.lat, targetPos.current.lat, t);
      const currentLng = lerp(startPos.current.lng, targetPos.current.lng, t);

      let currentHeading = lastRenderedPos.current.heading;
      if (startPos.current.heading !== null && targetPos.current.heading !== null) {
        currentHeading = lerpAngle(startPos.current.heading, targetPos.current.heading, t);
      }

      lastRenderedPos.current = { lat: currentLat, lng: currentLng, heading: currentHeading };

      // Update Player Marker
      const source = map.current.getSource('player') as mapboxgl.GeoJSONSource;
      if (source) {
        const point = turf.point([currentLng, currentLat]);
        const radiusPoly = turf.circle(point, 0.05, { units: 'kilometers', steps: 64 });
        source.setData({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: point.geometry,
              properties: { type: 'point', heading: currentHeading }
            },
            {
              type: 'Feature',
              geometry: radiusPoly.geometry,
              properties: { type: 'radius' }
            }
          ]
        });
      }

      // Update Camera (Auto-follow)
      if (followingUser.current) {
        map.current.jumpTo({ center: [currentLng, currentLat] });
      }
    };

    animationFrameId.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isMapLoaded]);

  // 4. Initial Center
  useEffect(() => {
    if (isMapLoaded && map.current && userPosition && !hasCentered.current) {
      followingUser.current = true;
      map.current.jumpTo({
        center: [userPosition.longitude, userPosition.latitude],
        zoom: 17
      });
      hasCentered.current = true;
    }
  }, [userPosition, isMapLoaded]);

  // 5. Initialize Map
  useEffect(() => {
    if (map.current) return;
    if (mapContainer.current) {
      try {
        const initialPos = useGameStore.getState().userPosition;
        const startCenter: [number, number] = initialPos
          ? [initialPos.longitude, initialPos.latitude]
          : [2.3522, 48.8566];

        if (initialPos) hasCentered.current = true;

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/standard',
          center: startCenter,
          zoom: 16,
          attributionControl: false,
          logoPosition: 'bottom-left',
          pitchWithRotate: false,
          dragRotate: false,
          touchZoomRotate: true,
          doubleClickZoom: false,
          fadeDuration: 0,
        });

        const geolocateControl = new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserLocation: false,
          showUserHeading: false
        });
        map.current.addControl(geolocateControl, 'bottom-right');

        const geolocateBtn = document.querySelector('.mapboxgl-ctrl-geolocate');
        if (geolocateBtn) (geolocateBtn as HTMLElement).style.display = 'none';

        map.current.on('error', (e) => console.error("Mapbox Error:", e));

        const stopFollowing = () => {
          if (followingUser.current) {
            console.log("User interaction detected, stopping auto-follow");
            followingUser.current = false;
          }
        };
        map.current.on('dragstart', stopFollowing);
        map.current.on('touchstart', stopFollowing);
        map.current.on('wheel', stopFollowing);

        map.current.on('load', () => {
          console.log("Map style loaded");
          if (!map.current) return;

          // Lighting Init
          try {
            const hour = new Date().getHours();
            let preset = 'day';
            if (hour >= 5 && hour < 7) preset = 'dawn';
            else if (hour >= 7 && hour < 17) preset = 'day';
            else if (hour >= 17 && hour < 19) preset = 'dusk';
            else preset = 'night';
            map.current.setConfigProperty('basemap', 'lightPreset', preset);
          } catch (e) { console.debug("Initial lighting set failed", e); }

          // --- 0. FOG MASK (Black Overlay) ---
          map.current.addSource('fog-source', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
          });
          map.current.addLayer({
            id: 'fog-layer',
            type: 'fill',
            source: 'fog-source',
            paint: {
              'fill-color': '#000000',
              'fill-opacity': 0.98 // Almost pitch black, but let a tiny bit of street data bleed if needed, or 1.0 for total darkness
            }
          });

          // --- 1. TACTICAL REVEAL LAYERS ---
          map.current.addSource('reveal-source', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
          });
          map.current.addLayer({
            id: 'trail-glow-layer',
            type: 'line',
            source: 'reveal-source',
            filter: ['==', 'type', 'history'],
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
              'line-color': '#00FFCC',
              'line-width': ['interpolate', ['exponential', 2], ['zoom'], 12, 10, 20, 100],
              'line-blur': 20,
              'line-opacity': 0.5
            }
          });
          map.current.addLayer({
            id: 'current-pos-glow-layer',
            type: 'circle',
            source: 'reveal-source',
            filter: ['==', 'type', 'current'],
            paint: {
              'circle-radius': 50,
              'circle-color': '#00FFCC',
              'circle-blur': 0.8,
              'circle-opacity': 0.6
            }
          });
          // Move fog layer to top of stack, then add glow layers above it
          // This ensures fog covers the entire base map (including labels)
          try {
            map.current.moveLayer('fog-layer'); // Move to top
            map.current.moveLayer('current-pos-glow-layer'); // Above fog
            map.current.moveLayer('trail-glow-layer'); // Above current glow
          } catch (e) {
            console.debug('Layer ordering fallback:', e);
          }

          // --- 2. GAME LAYERS ---
          if (!map.current.hasImage('player-arrow')) {
            const arrowData = createArrowData(64, 64);
            if (arrowData) map.current.addImage('player-arrow', arrowData);
          }
          if (!map.current.hasImage('checkpoint-flag')) {
            const flagData = createFlagData(64, 64);
            if (flagData) map.current.addImage('checkpoint-flag', flagData);
          }

          map.current.addSource('route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
          map.current.addLayer({
            id: 'route-line', type: 'line', source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#fbbf24', 'line-width': 2, 'line-opacity': 0.4, 'line-dasharray': [2, 4] }
          });
          map.current.moveLayer('route-line', 'trail-glow-layer'); // Route above trails? Or below? Let's keep it visible.

          map.current.addSource('extraction', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
          map.current.addLayer({
            id: 'extraction-glow', type: 'circle', source: 'extraction',
            paint: {
              'circle-radius': 60, // Much larger glow
              'circle-color': '#34d399', // Emerald-400 (Brighter)
              'circle-opacity': 0.4,
              'circle-blur': 0.6
            }
          });
          map.current.addLayer({
            id: 'extraction-core', type: 'circle', source: 'extraction',
            paint: {
              'circle-radius': 15,
              'circle-color': '#10b981', // Emerald-500
              'circle-stroke-width': 4, // Thicker border
              'circle-stroke-color': '#ecfdf5' // Emerald-50 (Near white)
            }
          });
          // Add a pulsating ring effect (simulated with a second transparent larger circle)
          map.current.addLayer({
            id: 'extraction-ring', type: 'circle', source: 'extraction',
            paint: {
              'circle-radius': 80,
              'circle-color': '#059669', // Emerald-600
              'circle-opacity': 0.15,
              'circle-stroke-width': 1,
              'circle-stroke-color': '#34d399'
            }
          });

          map.current.addSource('checkpoint', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
          map.current.addLayer({ id: 'checkpoint-glow', type: 'circle', source: 'checkpoint', paint: { 'circle-radius': 30, 'circle-color': '#f59e0b', 'circle-opacity': 0.3, 'circle-blur': 0.5 } });
          map.current.addLayer({ id: 'checkpoint-core', type: 'circle', source: 'checkpoint', paint: { 'circle-radius': 8, 'circle-color': '#fbbf24', 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff' } });
          map.current.addLayer({ id: 'checkpoint-flag', type: 'symbol', source: 'checkpoint', layout: { 'icon-image': 'checkpoint-flag', 'icon-size': 0.8, 'icon-anchor': 'bottom-left', 'icon-allow-overlap': true } });

          map.current.addSource('shadow', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
          map.current.addLayer({ id: 'shadow-glow', type: 'circle', source: 'shadow', paint: { 'circle-radius': 50, 'circle-color': '#ef4444', 'circle-opacity': 0.2, 'circle-blur': 0.4 } });
          map.current.addLayer({ id: 'shadow-core', type: 'circle', source: 'shadow', paint: { 'circle-radius': 8, 'circle-color': '#dc2626', 'circle-stroke-width': 2, 'circle-stroke-color': '#7f1d1d' } });

          map.current.addSource('player', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
          map.current.addLayer({ id: 'player-marker-precision', type: 'circle', source: 'player', filter: ['==', 'type', 'point'], paint: { 'circle-radius': 4, 'circle-color': '#ffffff', 'circle-opacity': 0.9 } });
          map.current.addLayer({ id: 'player-heading', type: 'symbol', source: 'player', filter: ['==', 'type', 'point'], layout: { 'icon-image': 'player-arrow', 'icon-size': 0.5, 'icon-rotate': ['get', 'heading'], 'icon-rotation-alignment': 'map', 'icon-allow-overlap': true }, paint: { 'icon-opacity': 1 } });

          // --- 3. FINAL LAYER REORDERING ---
          // Explicitly enforce z-index stack (Bottom -> Top)
          const orderedLayers = [
            'fog-layer',                // Bottom: Fog Mask
            'trail-glow-layer',         // Reveal History
            'current-pos-glow-layer',   // Reveal Current
            'route-line',               // Route
            'extraction-glow',          // Extraction Base
            'extraction-ring',          // Extraction Ring
            'extraction-core',          // Extraction Center
            'checkpoint-glow', 'checkpoint-core', 'checkpoint-flag',
            'shadow-glow', 'shadow-core',
            'player-marker-precision', 'player-heading' // Top: Player
          ];

          orderedLayers.forEach(id => {
            try {
              if (map.current?.getLayer(id)) map.current.moveLayer(id);
            } catch (e) {
              console.debug(`Failed to move layer ${id}:`, e);
            }
          });

          setIsMapLoaded(true);
        });

      } catch (err) { console.error("Failed to initialize map:", err); }
    }
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // 6. Dynamic Lighting Interval
  useEffect(() => {
    if (!isMapLoaded || !map.current) return;
    const updateLightPreset = () => {
      if (!map.current) return;
      const hour = new Date().getHours();
      let preset = 'day';
      if (hour >= 5 && hour < 7) preset = 'dawn';
      else if (hour >= 7 && hour < 17) preset = 'day';
      else if (hour >= 17 && hour < 19) preset = 'dusk';
      else preset = 'night';
      try { map.current.setConfigProperty('basemap', 'lightPreset', preset); } catch (e) { }
    };
    const intervalId = setInterval(updateLightPreset, 60000);
    return () => clearInterval(intervalId);
  }, [isMapLoaded]);

  // 7. Sync Tactical Reveal & Fog Mask
  useEffect(() => {
    if (!isMapLoaded || !map.current || !map.current.isStyleLoaded()) return;

    const fogSource = map.current.getSource('fog-source') as mapboxgl.GeoJSONSource;
    const revealSource = map.current.getSource('reveal-source') as mapboxgl.GeoJSONSource;

    // When game is NOT active, clear the fog (show full map for menu)
    if (status !== 'ACTIVE') {
      if (fogSource) fogSource.setData({ type: 'FeatureCollection', features: [] });
      if (revealSource) revealSource.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    // --- GAME IS ACTIVE: Apply Fog of War ---

    // A. Update Glow Sources (Trail + Current Position)
    if (revealSource) {
      const features: any[] = [];
      let pathLineString: any = null;
      let currentPoint: any = null;

      if (pathHistory && pathHistory.length > 1) {
        // pathHistory is [lat, lng], Mapbox needs [lng, lat]
        const swappedCoords = pathHistory.map(p => [p[1], p[0]]);
        pathLineString = { type: 'LineString', coordinates: swappedCoords };
        features.push({ type: 'Feature', properties: { type: 'history' }, geometry: pathLineString });
      }
      if (userPosition) {
        currentPoint = { type: 'Point', coordinates: [userPosition.longitude, userPosition.latitude] };
        features.push({ type: 'Feature', properties: { type: 'current' }, geometry: currentPoint });
      }
      revealSource.setData({ type: 'FeatureCollection', features: features });

      // B. Update Fog Mask (Subtractive - The "Inverted Mask")
      if (fogSource) {
        try {
          // 1. World Polygon (Black Box covering visible area)
          // Using a smaller box around player for performance instead of whole world
          let worldBounds: any;
          if (userPosition) {
            const center = [userPosition.longitude, userPosition.latitude];
            // Create a ~100km box around player (0.5 degrees ≈ 55km in each direction)
            // This ensures fog coverage at all zoom levels
            worldBounds = turf.polygon([[
              [center[0] - 0.5, center[1] + 0.5],
              [center[0] + 0.5, center[1] + 0.5],
              [center[0] + 0.5, center[1] - 0.5],
              [center[0] - 0.5, center[1] - 0.5],
              [center[0] - 0.5, center[1] + 0.5]
            ]]);
          } else {
            // Fallback: full world
            worldBounds = turf.polygon([[
              [-180, 90], [180, 90], [180, -90], [-180, -90], [-180, 90]
            ]]);
          }

          // 2. Calculate Revealed Area (50m buffer around path + current position)
          let revealed: any = null;

          // Buffer the path (50m = 0.05km)
          if (pathLineString) {
            const pathBuffer = turf.buffer(pathLineString, 0.05, { units: 'kilometers' });
            if (pathBuffer) revealed = pathBuffer;
          }

          // Buffer current position (50m circle)
          if (currentPoint) {
            const posBuffer = turf.buffer(currentPoint, 0.05, { units: 'kilometers' });
            if (posBuffer) {
              revealed = revealed
                ? turf.union(turf.featureCollection([revealed, posBuffer]))
                : posBuffer;
            }
          }

          // 3. Subtract revealed from world = THE MASK
          if (revealed) {
            const mask = turf.difference(turf.featureCollection([worldBounds, revealed]));
            if (mask) {
              fogSource.setData(mask);
            } else {
              // difference returned null (shouldn't happen, but safety)
              fogSource.setData(worldBounds);
            }
          } else {
            // Nothing revealed yet -> Full black mask
            fogSource.setData(worldBounds);
          }
        } catch (e) {
          console.warn("Fog calculation failed:", e);
        }
      }
    }
  }, [pathHistory, userPosition, isMapLoaded, status]);

  // 8. Sync Dynamic Color
  useEffect(() => {
    if (!isMapLoaded || !map.current || !map.current.isStyleLoaded()) return;
    let color = '#00FFCC';
    if (shadowDistance !== null) {
      if (shadowDistance < 100) color = '#ef4444';
      else if (shadowDistance < 300) color = '#f97316';
    }
    if (map.current.getLayer('trail-glow-layer')) map.current.setPaintProperty('trail-glow-layer', 'line-color', color);
    if (map.current.getLayer('current-pos-glow-layer')) map.current.setPaintProperty('current-pos-glow-layer', 'circle-color', color);
  }, [shadowDistance, isMapLoaded]);

  // 9. Sync Extraction
  useEffect(() => {
    if (!isMapLoaded || !map.current || !map.current.isStyleLoaded()) return;
    const source = map.current.getSource('extraction') as mapboxgl.GeoJSONSource;
    if (source) {
      if (extractionPoint) {
        source.setData({
          type: 'Feature', geometry: { type: 'Point', coordinates: [extractionPoint.longitude, extractionPoint.latitude] }, properties: {}
        });
      } else { source.setData({ type: 'FeatureCollection', features: [] }); }
    }
  }, [extractionPoint, isMapLoaded]);

  // 10. Sync Checkpoint
  useEffect(() => {
    if (!isMapLoaded || !map.current || !map.current.isStyleLoaded()) return;
    const source = map.current.getSource('checkpoint') as mapboxgl.GeoJSONSource;
    if (source) {
      if (checkpoint && !checkpointReached) {
        source.setData({
          type: 'Feature', geometry: { type: 'Point', coordinates: [checkpoint.longitude, checkpoint.latitude] }, properties: {}
        });
      } else { source.setData({ type: 'FeatureCollection', features: [] }); }
    }
  }, [checkpoint, checkpointReached, isMapLoaded]);

  // 11. Sync Shadow
  useEffect(() => {
    if (!isMapLoaded || !map.current || !map.current.isStyleLoaded()) return;
    const source = map.current.getSource('shadow') as mapboxgl.GeoJSONSource;
    if (source) {
      if (shadowPosition) {
        source.setData({
          type: 'Feature', geometry: { type: 'Point', coordinates: [shadowPosition.longitude, shadowPosition.latitude] }, properties: {}
        });
      } else { source.setData({ type: 'FeatureCollection', features: [] }); }
    }
  }, [shadowPosition, isMapLoaded]);

  // 12. Hazard Opacity Logic
  const getHazardOpacity = (shadowDistance: number | null) => {
    if (!shadowDistance && shadowDistance !== 0) return 0;
    if (status === 'GAME_OVER') return 0.8;
    const MAX_DIST = 500;
    const MIN_DIST = 20;
    if (shadowDistance > MAX_DIST) return 0;
    const intensity = (MAX_DIST - Math.max(shadowDistance, MIN_DIST)) / (MAX_DIST - MIN_DIST);
    return Math.min(Math.max(intensity, 0), 0.8);
  };

  const hazardOpacity = useGameStore((state) => getHazardOpacity(state.shadowDistance));

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-slate-950">
      <div ref={mapContainer} className="absolute inset-0" style={{ width: '100%', height: '100%' }} />

      {/* Title */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">

        {status !== 'IDLE' && (
          <div className={`text-xs font-mono font-bold mt-1 ${status === 'ACTIVE' ? 'text-emerald-400' :
            status === 'GAME_OVER' ? 'text-red-500' :
              status === 'VICTORY' ? 'text-blue-400' : 'text-slate-500'
            }`}>
            STATUS: {status}
          </div>
        )}
      </div>

      {/* Proximity Hazard Pulse */}
      {(status === 'ACTIVE' || status === 'GAME_OVER') && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500 ease-in-out"
          style={{
            boxShadow: `inset 0 0 100px 50px rgba(220, 38, 38, ${hazardOpacity})`,
            zIndex: 5
          }}
        />
      )}

      {/* Explicit Border for End States */}
      {status === 'GAME_OVER' && (
        <div className="absolute inset-0 border-[20px] border-red-600/50 pointer-events-none animate-pulse z-10" />
      )}
      {status === 'VICTORY' && (
        <div className="absolute inset-0 border-[20px] border-emerald-600/50 pointer-events-none z-10" />
      )}
    </div>
  );
};

export default GameMap;
