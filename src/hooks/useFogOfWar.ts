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
      steps: 32 // Slightly fewer steps for performance when merging
    });

    // Merge with previously explored areas
    if (exploredAreaRef.current) {
      try {
        const merged = turf.union(
          turf.featureCollection([exploredAreaRef.current, visibilityCircle])
        );
        if (merged) {
          exploredAreaRef.current = merged as Feature<Polygon | MultiPolygon>;
        }
      } catch (e) {
        // If union fails, just use current circle
        console.warn("Failed to merge explored areas:", e);
        exploredAreaRef.current = visibilityCircle;
      }
    } else {
      // First position - just use the circle
      exploredAreaRef.current = visibilityCircle;
    }

    // Update the store with accumulated explored area
    setExploredPolygon(exploredAreaRef.current);

  }, [userPosition, setExploredPolygon]);
};