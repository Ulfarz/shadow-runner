import { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Geolocation, Position } from '@capacitor/geolocation';

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export const useGeolocation = (options: GeolocationOptions = { enableHighAccuracy: true }) => {
  const setUserPosition = useGameStore((state) => state.setUserPosition);
  const setGpsError = useGameStore((state) => state.setGpsError);

  useEffect(() => {
    let watchId: string | null = null;

    const startWatching = async () => {
      try {
        const permissionStatus = await Geolocation.checkPermissions();
        
        if (permissionStatus.location === 'denied') {
             // Request permission if denied/prompt
             const requested = await Geolocation.requestPermissions();
             if (requested.location === 'denied') {
                setGpsError('Permission denied');
                return;
             }
        }

        watchId = await Geolocation.watchPosition(
          options,
          (position: Position | null, err: any) => {
            if (err) {
               setGpsError(err.message);
               return;
            }
            if (position) {
              setUserPosition({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                heading: position.coords.heading,
                speed: position.coords.speed,
                timestamp: position.timestamp,
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
  }, [setUserPosition, setGpsError, options.enableHighAccuracy, options.timeout, options.maximumAge]);
};
