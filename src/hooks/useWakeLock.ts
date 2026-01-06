import { useEffect, useRef } from 'react';

export const useWakeLock = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wakeLock = useRef<any>(null);

  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          // @ts-ignore
          wakeLock.current = await navigator.wakeLock.request('screen');
          console.log('Wake Lock is active');
        }
      } catch (err) {
        console.warn('Wake Lock request failed:', err);
      }
    };

    requestWakeLock();

    const handleVisibilityChange = async () => {
      if (wakeLock.current !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock.current) {
        wakeLock.current.release().then(() => {
          wakeLock.current = null;
          console.log('Wake Lock released');
        });
      }
    };
  }, []);
};
