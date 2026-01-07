import { useEffect, useRef } from 'react';
import * as turf from '@turf/turf';
import { useGameStore } from '../store/useGameStore';
import { getExploredPolygon, saveExploredPolygon } from '../utils/db';
import { Feature, Polygon, MultiPolygon } from 'geojson';

const EXPLORATION_RADIUS_M = 50;
const SAVE_DEBOUNCE_MS = 2000;

export const useFogOfWar = () => {
  const userPosition = useGameStore((state) => state.userPosition);
  const exploredPolygon = useGameStore((state) => state.exploredPolygon);
  const setExploredPolygon = useGameStore((state) => state.setExploredPolygon);
  
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Ref to hold the latest polygon to avoid dependency loops in the position effect
  const polygonRef = useRef<Feature<Polygon | MultiPolygon> | null>(null);


  // Sync ref with store
  useEffect(() => {
    polygonRef.current = exploredPolygon;
  }, [exploredPolygon]);

  // Load initial state from DB
  useEffect(() => {
    const loadState = async () => {
      try {
        const storedPolygon = await getExploredPolygon();
        if (storedPolygon) {
          setExploredPolygon(storedPolygon);
        }
      } catch (error) {
        console.error('Failed to load explored polygon:', error);
      }
    };
    loadState();
  }, [setExploredPolygon]);

  // Update logic on position change
  useEffect(() => {
    if (!userPosition) return;

    const currentPolygon = polygonRef.current;
    
    const userPoint = turf.point([userPosition.longitude, userPosition.latitude]);
    const newVisibility = turf.circle(userPoint, EXPLORATION_RADIUS_M, { 
      units: 'meters', 
      steps: 32 
    });

    let updatedPolygon: Feature<Polygon | MultiPolygon>;

    if (!currentPolygon) {
      updatedPolygon = newVisibility;
    } else {
      try {
        const unionResult = turf.union(turf.featureCollection([currentPolygon, newVisibility]));
        if (unionResult) {
            updatedPolygon = unionResult;
        } else {
            updatedPolygon = currentPolygon;
        }
      } catch (err) {
        console.error('Error unioning polygons:', err);
        return;
      }
    }

    setExploredPolygon(updatedPolygon);

    // Debounced Save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveExploredPolygon(updatedPolygon);
    }, SAVE_DEBOUNCE_MS);

  }, [userPosition, setExploredPolygon]);
};