import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export const useGeolocation = (options: GeolocationOptions = { enableHighAccuracy: true }) => {
  const setUserPosition = useGameStore((state) => state.setUserPosition);
  const [error, setError] = useState<GeolocationPositionError | null>(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      // Create a pseudo-error object since GeolocationPositionError constructor isn't directly exposed/standardized in all envs easily
      const error: GeolocationPositionError = {
        code: 0, // 0 is not a standard code, but indicates unknown/not supported
        message: 'Geolocation not supported',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as unknown as GeolocationPositionError; // Force cast
      
      setError(error);
      return;
    }

    const successId = navigator.geolocation.watchPosition(
      (position) => {
        setUserPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        });
        setError(null);
      },
      (err) => {
        setError(err);
      },
      options
    );

    return () => {
      navigator.geolocation.clearWatch(successId);
    };
  }, [setUserPosition, options.enableHighAccuracy, options.timeout, options.maximumAge]);

  return { error };
};
