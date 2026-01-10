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
          const merged = turf.union(
            turf.featureCollection([
              accumulatedAreaRef.current as Feature<Polygon | MultiPolygon>,
              visibilityCircle
            ])
          );

          if (merged) {
            accumulatedAreaRef.current = merged as Feature<Polygon | MultiPolygon>;
          }
        } catch (e) {
          console.warn("Failed to merge explored areas:", e);
          // If union fails, we keep the previous accumulated area + the new circle 
          // to ensure visibility doesn't break
        }
      } else {
        // First position in ACTIVE status
        accumulatedAreaRef.current = visibilityCircle;
      }

      // During active gameplay, always show the accumulated area
      setExploredPolygon(accumulatedAreaRef.current);
    } else if (status === 'IDLE') {
      // In lobby/setup, just show the 50m radius around the player without accumulation
      setExploredPolygon(visibilityCircle);
    } else {
      // In end states (EXTRACTED, CAUGHT), keep showing the final accumulated area
      setExploredPolygon(accumulatedAreaRef.current || visibilityCircle);
    }

  }, [userPosition, status, setExploredPolygon]);
};