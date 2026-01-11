import { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export const useGeolocation = (options: GeolocationOptions = { enableHighAccuracy: true }) => {
  const setUserPosition = useGameStore((state) => state.setUserPosition);
  const setGpsError = useGameStore((state) => state.setGpsError);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGpsError('Geolocation not supported');
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
        setGpsError(null);
      },
      (err) => {
        setGpsError(err.message);
      },
      options
    );

    return () => {
      navigator.geolocation.clearWatch(successId);
    };
  }, [setUserPosition, setGpsError, options.enableHighAccuracy, options.timeout, options.maximumAge]);
};
