import { useEffect, useRef } from 'react';
import * as turf from '@turf/turf';
import { useGameStore } from '../store/useGameStore';
import { Feature, Polygon, MultiPolygon } from 'geojson';

// Visibility radius in kilometers
const VISIBILITY_RADIUS_KM = 0.1; // 100 meters

export const useFogOfWar = () => {
  const userPosition = useGameStore((state) => state.userPosition);
  const status = useGameStore((state) => state.status);
  const setExploredPolygon = useGameStore((state) => state.setExploredPolygon);

  // Store accumulated explored area
  const exploredAreaRef = useRef<Feature<Polygon | MultiPolygon> | null>(null);

  // Reset explored area when game resets
  useEffect(() => {
    if (status === 'IDLE') {
      exploredAreaRef.current = null;
    }
  }, [status]);

  // Update visibility and accumulate explored areas as player moves
  useEffect(() => {
    if (!userPosition) return;

    // Create a circle around current player position
    const userPoint = turf.point([userPosition.longitude, userPosition.latitude]);
    const visibilityCircle = turf.circle(userPoint, VISIBILITY_RADIUS_KM, {
      units: 'kilometers',
      steps: 64 // smoother circle
    });

    // Merge with previously explored areas
    if (exploredAreaRef.current) {
      try {
        // small buffer to fix potential topology errors before union
        const currentPoly = exploredAreaRef.current; // turf.buffer(exploredAreaRef.current, 0.0001, { units: 'kilometers' });

        const merged = turf.union(
          turf.featureCollection([currentPoly as Feature<Polygon | MultiPolygon>, visibilityCircle])
        );

        if (merged) {
          exploredAreaRef.current = merged as Feature<Polygon | MultiPolygon>;
        }
      } catch (e) {
        // If union fails, just use current circle or keep previous state log error but don't crash
        console.warn("Failed to merge explored areas, resetting to current view to recover:", e);
        // Fallback: if merge fails extremely, we might at least keep the current circle visible
        // But usually we want to keep what we had. 
        // A simple recovery is to just set it to the visibility circle to avoid sticking to a corrupt polygon
        exploredAreaRef.current = visibilityCircle;
      }
    } else {
      // First position - just use the circle
      exploredAreaRef.current = visibilityCircle;
    }

    // Update the store with accumulated explored area
    setExploredPolygon(exploredAreaRef.current);

  }, [userPosition, setExploredPolygon]); // status dependency removed to avoid reset loops if status changes while active
};