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
  const followingUser = useRef(true); // Track if we should follow
  const [isMapLoaded, setIsMapLoaded] = React.useState(false);

  // Connect to store
  const { userPosition, extractionPoint, shadowPosition, status, pathHistory, checkpoint, checkpointReached, setCenterOnPlayer } = useGameStore();

  // Register centerOnPlayer callback
  useEffect(() => {
    setCenterOnPlayer(() => {
      if (map.current && userPosition) {
        followingUser.current = true; // Re-enable following
        // The instruction implies a conditional check here, but the original code does not have it.
        // Assuming the intent is to add these checks around the flyTo logic if status is not GAME_OVER or VICTORY.
        // However, without the original 'CAUGHT'/'EXTRACTED' context, I will apply the change as a direct replacement
        // if such checks were present. Since they are not, and the instruction snippet is syntactically incorrect
        // for a useEffect callback, I will interpret this as a request to ensure that if such checks were to be added,
        // they should use 'GAME_OVER' and 'VICTORY'.
        // As the provided code does not contain 'CAUGHT' or 'EXTRACTED' in this useEffect,
        // and the instruction snippet is not valid JS/TS for this context,
        // I will make no change to this specific useEffect block, as there's no direct replacement to perform.
        // If the intent was to add new logic based on GAME_OVER/VICTORY, that would be an addition, not a replacement.
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
  }, [userPosition, setCenterOnPlayer, status]); // Added status to dependency array

  // --- Animation & Interpolation Logic ---
  const lastRenderedPos = useRef<{ lat: number; lng: number; heading: number | null } | null>(null);
  const startPos = useRef<{ lat: number; lng: number; heading: number | null } | null>(null);
  const targetPos = useRef<{ lat: number; lng: number; heading: number | null } | null>(null);
  const animationStartTime = useRef<number>(0);
  const animationFrameId = useRef<number>();

  // Lerp helper
  const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

  // Shortest path angle interpolation
  const lerpAngle = (start: number, end: number, t: number) => {
    const delta = ((end - start + 540) % 360) - 180;
    return start + delta * t;
  };

  // Update Target when userPosition changes
  useEffect(() => {
    if (!userPosition) return;

    const newTarget = {
      lat: userPosition.latitude,
      lng: userPosition.longitude,
      heading: userPosition.heading
    };

    if (!lastRenderedPos.current) {
      // First fix: jump immediately
      lastRenderedPos.current = newTarget;
      startPos.current = newTarget;
      targetPos.current = newTarget;
      animationStartTime.current = performance.now();
    } else {
      // Subsequent fix: Start animation from where we currently ARE visually
      startPos.current = { ...lastRenderedPos.current };
      targetPos.current = newTarget;
      animationStartTime.current = performance.now();
    }
  }, [userPosition]);

  // Main Animation Loop
  useEffect(() => {
    const animate = (time: number) => {
      animationFrameId.current = requestAnimationFrame(animate);

      if (!isMapLoaded || !map.current || !startPos.current || !targetPos.current || !lastRenderedPos.current) return;

      const duration = 1000; // 1 second interpolation (matches typical GPS interval)
      const elapsed = time - animationStartTime.current;
      const t = Math.min(Math.max(elapsed / duration, 0), 1); // Clamp 0-1

      // Interpolate
      const currentLat = lerp(startPos.current.lat, targetPos.current.lat, t);
      const currentLng = lerp(startPos.current.lng, targetPos.current.lng, t);

      let currentHeading = lastRenderedPos.current.heading;
      if (startPos.current.heading !== null && targetPos.current.heading !== null) {
        currentHeading = lerpAngle(startPos.current.heading, targetPos.current.heading, t);
      }

      // Update Visual State Ref
      lastRenderedPos.current = {
        lat: currentLat,
        lng: currentLng,
        heading: currentHeading
      };

      // 1. Update Map Source (Marker)
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
              properties: {
                type: 'point',
                heading: currentHeading
              }
            },
            {
              type: 'Feature',
              geometry: radiusPoly.geometry,
              properties: { type: 'radius' }
            }
          ]
        });
      }

      // 2. Update Camera (Follow)
      if (followingUser.current) {
        // Use jumpTo or setCenter because we are driving the animation loop ourselves.
        // Using easeTo here would conflict with our manual interpolation.
        map.current.jumpTo({
          center: [currentLng, currentLat],
          // We can also interpolate Heading/Bearing of the camera if we wanted Keyframe-like following
          // but usually keeping North up or static bearing is preferred unless 'Course Up' mode.
          // For now, just center.
        });
      }
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isMapLoaded]); // Run continuously once map is loaded

  // Initial Center (One off)
  useEffect(() => {
    if (isMapLoaded && map.current && userPosition && !hasCentered.current) {
      followingUser.current = true;
      // Immediate jump for first load
      map.current.jumpTo({
        center: [userPosition.longitude, userPosition.latitude],
        zoom: 17
      });
      hasCentered.current = true;
    }
  }, [userPosition, isMapLoaded]);

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

        // Disable following on user interaction
        const stopFollowing = () => {
          if (followingUser.current) {
            console.log("User interaction detected, stopping auto-follow");
            followingUser.current = false;
          }
        };

        map.current.on('dragstart', stopFollowing);
        map.current.on('touchstart', stopFollowing);
        map.current.on('wheel', stopFollowing);
        // Maybe also on pitch/rotate if enabled?
        // map.current.on('pitchstart', stopFollowing);


        // --- 1. REVEAL / INVERTED MASK LOGIC ---
        const { shadowDistance } = useGameStore();

        // Helper: Create a Cover Box around specific coords (default to Paris if null)
        const getCoveragePolygon = (coords: { longitude: number, latitude: number } | null) => {
          const center = coords ? [coords.longitude, coords.latitude] : [2.3522, 48.8566];
          // 50km box is large enough for gameplay but safe for Turf
          // bbox around point: buffered by 50km? No, just a bbox.
          // Simplified: polygon from center +/- 0.5 degrees (~50km)
          const d = 0.5;
          const minX = center[0] - d;
          const maxX = center[0] + d;
          const minY = center[1] - d;
          const maxY = center[1] + d;
          return turf.polygon([[[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY], [minX, minY]]]);
        };

        // Sync Fog Mask (Subtractive Logic)
        useEffect(() => {
          if (!isMapLoaded || !map.current || !map.current.isStyleLoaded()) return;

          const fogSource = map.current.getSource('fog-mask-source') as mapboxgl.GeoJSONSource;
          const glowSource = map.current.getSource('fog-glow-source') as mapboxgl.GeoJSONSource;

          if (fogSource && glowSource) {
            try {
              // A. Define the World Scope (Dynamic Box)
              // We recreate the "Black Sheet" around the player's current position to ensure it covers the viewport.
              const maskBox = getCoveragePolygon(userPosition);
              let maskPolygon = maskBox as any;

              let glowFeatures: any[] = [];

              // B. Create the "Holes" (Revealed Zones)

              // 1. Path History Hole
              if (pathHistory && pathHistory.length > 1) {
                // Simplify first for performance
                let coordinates = pathHistory;
                if (coordinates.length > 50) {
                  const line = turf.lineString(coordinates);
                  const simplified = turf.simplify(line, { tolerance: 0.0001, highQuality: false });
                  coordinates = simplified.geometry.coordinates;
                }

                if (coordinates.length > 1) {
                  const line = turf.lineString(coordinates);
                  // Buffer: 60m radius (0.06 km)
                  const bufferedPath = turf.buffer(line, 0.06, { units: 'kilometers', steps: 16 });

                  if (bufferedPath) {
                    // Cut hole
                    try {
                      // We must subtract from the FRESH maskBox each time, 
                      // but effectively we are iterating.
                      const diff = turf.difference(turf.featureCollection([maskPolygon, bufferedPath]));
                      if (diff) maskPolygon = diff;
                    } catch (e) {
                      console.warn("Path Subtract Error:", e);
                    }

                    // Add to glow (the edge of the cut)
                    glowFeatures.push(bufferedPath);
                  }
                }
              }

              // 2. Current Position Hole (The Flashlight)
              if (userPosition) {
                const point = turf.point([userPosition.longitude, userPosition.latitude]);
                // Buffer: 60m radius for current pos
                const bufferedPos = turf.buffer(point, 0.06, { units: 'kilometers', steps: 32 });

                if (bufferedPos) {
                  // Cut hole
                  try {
                    const diff = turf.difference(turf.featureCollection([maskPolygon, bufferedPos]));
                    if (diff) maskPolygon = diff;
                  } catch (err) {
                    console.warn("Pos Subtract Error:", err);
                  }

                  // Add to glow
                  glowFeatures.push(bufferedPos);
                }
              }

              // C. Update Sources
              fogSource.setData(maskPolygon);

              glowSource.setData({
                type: 'FeatureCollection',
                features: glowFeatures
              });

              // Dynamic Danger Coloring for the Glow
              if (map.current.getLayer('fog-glow-layer')) {
                const isDanger = shadowDistance && shadowDistance < 100;
                map.current.setPaintProperty('fog-glow-layer', 'line-color', isDanger ? '#ef4444' : '#000000');
              }

            } catch (err) {
              console.error("Global Fog Error:", err);
            }
          }

        }, [pathHistory, userPosition, isMapLoaded, shadowDistance]);


        // --- Map Load & Style Setup ---
        map.current.on('load', () => {
          console.log("Map style loaded");
          if (!map.current) return;

          // --- 1. Fog Mask Source (The Black Sheet with Holes) ---
          // Use initial position or default for the first render
          // Note: getCoveragePolygon needs to be callable here, checking scope.
          // Since getCoveragePolygon is defined inside Component, it's fine.
          // But wait, `getCoveragePolygon` depends on `turf`, which is imported.
          // BUT, we need one for initialization.
          const initialCenter = useGameStore.getState().userPosition;
          const initialPoly = (() => {
            // Inline simple generator for init
            const c = initialCenter ? [initialCenter.longitude, initialCenter.latitude] : [2.3522, 48.8566];
            const d = 0.5;
            const minX = c[0] - d;
            const maxX = c[0] + d;
            const minY = c[1] - d;
            const maxY = c[1] + d;
            return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY], [minX, minY]]] }, properties: {} } as any;
          })();

          map.current.addSource('fog-mask-source', {
            type: 'geojson',
            data: initialPoly
          });

          // --- 2. Glow Source (The Soft Edges of the Holes) ---
          map.current.addSource('fog-glow-source', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
          });

          // --- 3. Fog Mask Layer (The "Paper") ---
          map.current.addLayer({
            id: 'fog-mask-layer',
            type: 'fill',
            source: 'fog-mask-source',
            paint: {
              'fill-color': '#000000', // Pitch Black
              'fill-opacity': 1.0 // Opaque
            }
          });

          // --- 4. Glow Layer (The Soft Edge) ---
          map.current.addLayer({
            id: 'fog-glow-layer',
            type: 'line',
            source: 'fog-glow-source', // The "Holes" geometry
            layout: {
              'line-cap': 'round',
              'line-join': 'round'
            },
            paint: {
              'line-color': '#000000',
              'line-width': 40, // Wide
              'line-blur': 20, // Very soft
              'line-opacity': 1.0
            }
          });

          // --- Add Heading Arrow Image (Synchronous) ---
          if (!map.current.hasImage('player-arrow')) {
            const arrowData = createArrowData(64, 64);
            if (arrowData) {
              map.current.addImage('player-arrow', arrowData);
            }
          }

          // --- Add Flag Image (Synchronous) ---
          if (!map.current.hasImage('checkpoint-flag')) {
            const flagData = createFlagData(64, 64);
            if (flagData) {
              map.current.addImage('checkpoint-flag', flagData);
            }
          }

          // --- Route Source & Layer (Future Path) ---
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
              'line-width': 2,
              'line-opacity': 0.4,
              'line-dasharray': [2, 4] // Dotted
            }
          });

          // Move Route below glow
          map.current.moveLayer('route-line', 'trail-glow-layer');

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

          map.current.addLayer({
            id: 'checkpoint-flag',
            type: 'symbol',
            source: 'checkpoint',
            layout: {
              'icon-image': 'checkpoint-flag',
              'icon-size': 0.8,
              'icon-anchor': 'bottom-left', // Anchor pole bottom to point
              'icon-offset': [0, 0], // Adjust if needed
              'icon-allow-overlap': true
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

          // --- Player Source & Layer (Visual Position - On Top) ---
          map.current.addSource('player', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
          });

          // Just the arrow for specific heading visualization if needed, 
          // but the "Glow" is now handled by the reveal-source layers.
          // We can keep the small sharp marker on top for precision.
          map.current.addLayer({
            id: 'player-marker-precision',
            type: 'circle',
            source: 'player',
            filter: ['==', 'type', 'point'],
            paint: {
              'circle-radius': 4,
              'circle-color': '#ffffff',
              'circle-opacity': 0.9
            }
          });

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
              'icon-opacity': 1
            }
          });

          setIsMapLoaded(true);
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

  // Sync Fog of War - REMOVED: Replaced by Reveal Logic
  // Sync Path History - REMOVED: Replaced by Reveal Logic

  // Sync Extraction Point
  useEffect(() => {
    if (!isMapLoaded || !map.current || !map.current.isStyleLoaded()) return;

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
  }, [extractionPoint, isMapLoaded]);

  // Sync Checkpoint
  useEffect(() => {
    if (!isMapLoaded || !map.current || !map.current.isStyleLoaded()) return;

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
  }, [checkpoint, checkpointReached, isMapLoaded]);

  // Sync Shadow Position
  useEffect(() => {
    if (!isMapLoaded || !map.current || !map.current.isStyleLoaded()) return;

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
  }, [shadowPosition, isMapLoaded]);

  // Sync Player Position & Radius - REMOVED: Handled by Animation Loop

  // Calculate hazard opacity based on distance (start showing at 500m, max at 20m)
  const getHazardOpacity = (shadowDistance: number | null) => {
    if (!shadowDistance && shadowDistance !== 0) return 0;
    if (status === 'GAME_OVER') return 0.8; // Max intensity

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
