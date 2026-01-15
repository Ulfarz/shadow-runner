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

              setGpsError(null);
            }
          }
        );
      } catch (e: any) {
        setGpsError(e.message || 'Failed to start geolocation');
      }
    };

    startWatching();

    return () => {
      if (watchId) {
        Geolocation.clearWatch({ id: watchId });
      }
    };
  }, [setUserPosition, setGpsError, options.enableHighAccuracy, options.timeout, options.maximumAge, retryGpsIndex, deviceOrientation.heading]);
};
