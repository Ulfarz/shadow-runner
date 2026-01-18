import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Geolocation, Position } from '@capacitor/geolocation';
import { LocationKalmanFilter } from '../utils/KalmanFilter';
import { useOrientation } from './useOrientation';

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export const useGeolocation = (options: GeolocationOptions = { enableHighAccuracy: true }) => {
  const setUserPosition = useGameStore((state) => state.setUserPosition);
  const setGpsError = useGameStore((state) => state.setGpsError);
  const retryGpsIndex = useGameStore((state) => state.retryGpsIndex);

  // Use the custom orientation hook for better bearing at low speeds
  const deviceOrientation = useOrientation();

  // Persist the filter across renders
  const kalmanFilter = useRef(new LocationKalmanFilter(3)); // 3m min accuracy assumption

  // Buffer for Map Matching (must be at top level, not inside useEffect)
  const historyBuffer = useRef<{ latitude: number; longitude: number; timestamp: number }[]>([]);

  useEffect(() => {
    let watchId: string | null = null;

    const startWatching = async () => {
      try {
        console.log(`[Geolocation] Starting watch (Attempt ${retryGpsIndex + 1})`);

        // Check permissions first
        const permissionStatus = await Geolocation.checkPermissions();
        if (permissionStatus.location === 'denied') {
          const requested = await Geolocation.requestPermissions();
          if (requested.location === 'denied') {
            setGpsError('Permission denied');
            return;
          }
        }

        // Start watching position
        watchId = await Geolocation.watchPosition(
          options,
          (position: Position | null, err: any) => {
            if (err) {
              setGpsError(err.message);
              return;
            }

            if (position) {
              const { latitude, longitude, accuracy, speed, heading } = position.coords;
              const timestamp = position.timestamp;

              // 1. FILTERING: Apply Kalman Filter
              const filtered = kalmanFilter.current.process(latitude, longitude, accuracy || 10, timestamp);

              // 2. BEARING: Smart selection between GPS and Compass
              // GPS bearing is poor at low speeds (< 1m/s). Use Compass if available.
              let finalHeading = heading;
              const SPEED_THRESHOLD = 1.0; // m/s

              if ((!speed || speed < SPEED_THRESHOLD) && deviceOrientation.heading !== null) {
                finalHeading = deviceOrientation.heading;
              }

              setUserPosition({
                latitude: filtered.lat,
                longitude: filtered.lng,
                accuracy: accuracy,
                heading: finalHeading,
                speed: speed,
                timestamp: timestamp,
              });

              // Add to matching buffer
              if (historyBuffer.current) {
                historyBuffer.current.push({ latitude: filtered.lat, longitude: filtered.lng, timestamp });
              }

              setGpsError(null);
            }
          }
        );
      } catch (e: any) {
        setGpsError(e.message || 'Failed to start geolocation');
      }
    };

    startWatching();

    // --- MAP MATCHING LOOP ---
    // Check every 5 seconds
    const matchingInterval = setInterval(async () => {
      const buffer = historyBuffer.current;
      if (buffer.length < 2) return;

      // Clone to avoid race conditions if clearing
      const pointsToMatch = [...buffer];

      // Only match if we have moved? (Check distance between first and last?)
      // For now, just try to match if we have points.

      // Prune buffer? We should keep some overlap or strictly time windows.
      // Strategy: Keep last 5 points always to ensure continuity? 
      // For this MVP, we just take the buffer.

      if (pointsToMatch.length >= 2) {
        try {
          const matched = await import('../services/MapMatchingService').then(m => m.MapMatchingService.matchPath(pointsToMatch));
          if (matched && matched.length > 0) {
            const lastMatched = matched[matched.length - 1];
            const lastOriginal = pointsToMatch[pointsToMatch.length - 1];

            // Smart Snap: Only snap if close (e.g., < 20m difference) to avoid massive jumps
            // Simple Euclidian distance approx for speed
            const dLat = lastMatched.latitude - lastOriginal.latitude;
            const dLng = lastMatched.longitude - lastOriginal.longitude;
            const distSq = (dLat * dLat) + (dLng * dLng); // huge approximation, but sufficient for scale

            // 0.0002 degrees ~ 20 meters
            if (distSq < 0.00000004) {
              // It is close enough, let's "Correct" the user position slightly? 
              // Actually, we can't easily inject "backwards" into the animation loop without a ref update.
              // But we CAN update the Store.
              // IMPORTANT: This might conflict with the high-frequency Kalman updates (1Hz).
              // If MapMatch takes 500ms, the user has already moved.
              // "Fluid" usually means Display = Interpolated(Kalman). 
              // MapMatch is usually for "Path History" visualization.
              // We will leave the real-time cursor to Kalman (responsive) 
              // and assume this logic is ready for when we want to implement "Snap to Road" explicitly.
              // For now, let's just Log it to prove integration.
              console.log("[MapMatch] Snapped:", lastMatched);
            }

            // TODO: Update pathHistory in store with matched segments?
          }
        } catch (err) {
          console.debug("[MapMatch] Error", err);
        }
      }

      // Keep only the last few points for context in the next batch
      if (historyBuffer.current.length > 50) {
        historyBuffer.current = historyBuffer.current.slice(-10);
      }
    }, 5000);

    return () => {
      if (watchId) {
        Geolocation.clearWatch({ id: watchId });
      }
      clearInterval(matchingInterval);
    };
  }, [setUserPosition, setGpsError, options.enableHighAccuracy, options.timeout, options.maximumAge, retryGpsIndex, deviceOrientation.heading]);
};
