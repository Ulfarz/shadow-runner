import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';

export const useWakeLock = () => {
  const wakeLock = useRef<WakeLockSentinel | null>(null);
  const status = useGameStore((state) => state.status);

  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && navigator.wakeLock && status === 'ACTIVE') {
          wakeLock.current = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        // Silent fail - wake lock is a nice-to-have feature
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLock.current) {
        try {
          await wakeLock.current.release();
          wakeLock.current = null;
        } catch (err) {
          // Wake lock already released
        }
      }
    };

    // Request wake lock when game becomes active
    if (status === 'ACTIVE') {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    const handleVisibilityChange = async () => {
      if (status === 'ACTIVE' && document.visibilityState === 'visible') {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  }, [status]);
};
