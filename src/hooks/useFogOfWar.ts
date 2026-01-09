import { useEffect } from 'react';
import * as turf from '@turf/turf';
import { useGameStore } from '../store/useGameStore';

// Visibility radius in kilometers
const VISIBILITY_RADIUS_KM = 0.05; // 50 meters

export const useFogOfWar = () => {
  const userPosition = useGameStore((state) => state.userPosition);
  const setExploredPolygon = useGameStore((state) => state.setExploredPolygon);

  // Update visibility circle whenever position changes
  useEffect(() => {
    if (!userPosition) return;

    // Create a perfect circle around current player position
    const userPoint = turf.point([userPosition.longitude, userPosition.latitude]);
    const visibilityCircle = turf.circle(userPoint, VISIBILITY_RADIUS_KM, {
      units: 'kilometers',
      steps: 64 // More steps = smoother circle
    });

    // Set this as the ONLY visible area (no accumulation)
    setExploredPolygon(visibilityCircle);

  }, [userPosition, setExploredPolygon]);
};