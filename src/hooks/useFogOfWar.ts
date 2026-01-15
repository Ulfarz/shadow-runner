import { useEffect, useRef } from 'react';
import * as turf from '@turf/turf';
import { useGameStore } from '../store/useGameStore';
import { Feature, Polygon, MultiPolygon } from 'geojson';

// Visibility radius in kilometers
const VISIBILITY_RADIUS_KM = 0.05; // 50 meters

export const useFogOfWar = () => {
  const userPosition = useGameStore((state) => state.userPosition);
  const status = useGameStore((state) => state.status);
  const setExploredPolygon = useGameStore((state) => state.setExploredPolygon);

  // Store accumulated explored area during ACTIVE status
  const accumulatedAreaRef = useRef<Feature<Polygon | MultiPolygon> | null>(null);

  // Reset accumulated area when game resets or goes back to IDLE
  useEffect(() => {
    if (status === 'IDLE') {
      accumulatedAreaRef.current = null;
    }
  }, [status]);

  // Update visibility and accumulate explored areas
  useEffect(() => {
    if (!userPosition) return;

    // Create a circle around current player position
    const userPoint = turf.point([userPosition.longitude, userPosition.latitude]);
    const visibilityCircle = turf.circle(userPoint, VISIBILITY_RADIUS_KM, {
      units: 'kilometers',
      steps: 64 // smoother circle
    });

    if (status === 'ACTIVE') {
      // Accumulate explored areas
      if (accumulatedAreaRef.current) {
        try {
          console.log('[Fog] Attempting union with existing area');

          // Fix potential self-intersections in the accumulated polygon
          // This is a common fix for Turf.js union failures
          // We use any to bypass strict type checks for these helper internal fixes if needed, 
          // but turf types should handle it in v7.
          let validAccumulated = accumulatedAreaRef.current; // as Feature<Polygon | MultiPolygon>;

          // Apply buffer(0) to fix self-intersections before union
          try {
            const buffered = turf.buffer(accumulatedAreaRef.current, 0);
            if (buffered) {
              validAccumulated = buffered as Feature<Polygon | MultiPolygon>;
            }
          } catch (bufferError) {
            console.warn("[Fog] Failed to buffer accumulated area for self-intersection fix:", bufferError);
          }

          // Attempt to union
          const merged = turf.union(
            turf.featureCollection([
              validAccumulated as Feature<Polygon | MultiPolygon>,
              visibilityCircle
            ])
          );

          if (merged) {
            // Simplify slightly to prevent polygon from becoming too complex over time
            // causing performance issues and union failures
            // const simplified = turf.simplify(merged, { tolerance: 0.0001, highQuality: false });
            accumulatedAreaRef.current = merged as Feature<Polygon | MultiPolygon>;
            console.log('[Fog] Union successful');
          } else {
            console.warn('[Fog] Union returned null');
          }
        } catch (e) {
          console.error("[Fog] Failed to merge explored areas:", e);

          // OPTIONAL: If union fails, try to "clean" the polygon for next time
          try {
            if (accumulatedAreaRef.current) {
              // Buffer 0 trick to fix geometry
              const cleaned = turf.buffer(accumulatedAreaRef.current, 0);
              if (cleaned) accumulatedAreaRef.current = cleaned as Feature<Polygon | MultiPolygon>;
            }
          } catch (cleanError) {
            console.error("[Fog] Failed to clean polygon:", cleanError);
          }
        }
      } else {
        console.log('[Fog] Initializing accumulated area');
        // First position in ACTIVE status
        accumulatedAreaRef.current = visibilityCircle;
      }

      // During active gameplay, always show the accumulated area
      setExploredPolygon(accumulatedAreaRef.current);
    } else if (status === 'IDLE') {
      // In lobby/setup, just show the 50m radius around the player without accumulation
      setExploredPolygon(visibilityCircle);
    } else {
      // In end states (VICTORY, GAME_OVER), keep showing the final accumulated area
      setExploredPolygon(accumulatedAreaRef.current || visibilityCircle);
    }

  }, [userPosition, status, setExploredPolygon]);
};