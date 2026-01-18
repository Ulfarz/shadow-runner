import { renderHook, waitFor } from '@testing-library/react';
import { useGeolocation } from './useGeolocation';
import { useGameStore } from '../store/useGameStore';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock Capacitor Geolocation
vi.mock('@capacitor/geolocation', () => ({
  Geolocation: {
    checkPermissions: vi.fn().mockResolvedValue({ location: 'granted' }),
    requestPermissions: vi.fn().mockResolvedValue({ location: 'granted' }),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  }
}));

// Mock useOrientation hook
vi.mock('./useOrientation', () => ({
  useOrientation: () => ({ heading: null, accuracy: null })
}));

// Mock MapMatchingService (dynamic import in useGeolocation)
vi.mock('../services/MapMatchingService', () => ({
  MapMatchingService: {
    matchPath: vi.fn().mockResolvedValue([])
  }
}));

import { Geolocation } from '@capacitor/geolocation';

describe('useGeolocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset store
    useGameStore.setState({ userPosition: null, gpsError: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should start watching position on mount', async () => {
    (Geolocation.watchPosition as any).mockResolvedValue('watch-id-1');

    renderHook(() => useGeolocation());

    await waitFor(() => {
      expect(Geolocation.checkPermissions).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(Geolocation.watchPosition).toHaveBeenCalledTimes(1);
    });
  });

  it('should update store when position updates', async () => {
    (Geolocation.watchPosition as any).mockImplementation(async (_options: any, callback: any) => {
      callback({
        coords: {
          latitude: 10,
          longitude: 20,
          accuracy: 5,
          heading: 90,
          speed: 2,
        },
        timestamp: 123456789,
      }, null);
      return 'watch-id-2';
    });

    renderHook(() => useGeolocation());

    await waitFor(() => {
      const position = useGameStore.getState().userPosition;
      expect(position).not.toBeNull();
    });

    const position = useGameStore.getState().userPosition;
    // Note: Kalman filter may adjust values slightly
    expect(position?.latitude).toBeCloseTo(10, 1);
    expect(position?.longitude).toBeCloseTo(20, 1);
  });

  it('should handle errors', async () => {
    (Geolocation.watchPosition as any).mockImplementation(async (_options: any, callback: any) => {
      callback(null, { message: 'Permission denied' });
      return 'watch-id-3';
    });

    renderHook(() => useGeolocation());

    await waitFor(() => {
      expect(useGameStore.getState().gpsError).toEqual('Permission denied');
    });
  });

  it('should clear watch on unmount', async () => {
    (Geolocation.watchPosition as any).mockResolvedValue('watch-id-4');

    const { unmount } = renderHook(() => useGeolocation());

    await waitFor(() => {
      expect(Geolocation.watchPosition).toHaveBeenCalled();
    });

    unmount();

    expect(Geolocation.clearWatch).toHaveBeenCalledWith({ id: 'watch-id-4' });
  });
});
