import { renderHook } from '@testing-library/react';
import { useGeolocation } from './useGeolocation';
import { useGameStore } from '../store/useGameStore';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('useGeolocation', () => {
  const mockWatchPosition = vi.fn();
  const mockClearWatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset store
    useGameStore.setState({ userPosition: null });

    // Mock geolocation
    if ('geolocation' in navigator) {
      // If it exists (e.g. jsdom), spy on it or redefine it
      // For simplicity in this test environment, we redefine it.
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          watchPosition: mockWatchPosition,
          clearWatch: mockClearWatch,
        },
        writable: true, // Allow overwriting
      });
    } else {
        Object.defineProperty(navigator, 'geolocation', {
            value: {
              watchPosition: mockWatchPosition,
              clearWatch: mockClearWatch,
            },
            configurable: true,
          });
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should start watching position on mount', () => {
    mockWatchPosition.mockReturnValue(1);
    
    renderHook(() => useGeolocation());
    
    expect(mockWatchPosition).toHaveBeenCalledTimes(1);
    expect(mockWatchPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({ enableHighAccuracy: true })
    );
  });

  it('should update store when position updates', () => {
    mockWatchPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 10,
          longitude: 20,
          accuracy: 5,
          heading: 90,
          speed: 2,
        },
        timestamp: 123456789,
      });
      return 1;
    });

    renderHook(() => useGeolocation());

    const position = useGameStore.getState().userPosition;
    expect(position).toEqual({
      latitude: 10,
      longitude: 20,
      accuracy: 5,
      heading: 90,
      speed: 2,
      timestamp: 123456789,
    });
  });

  it('should handle errors', () => {
    const error = { code: 1, message: 'Permission denied' };
    mockWatchPosition.mockImplementation((_, errorCallback) => {
      errorCallback(error);
      return 1;
    });

    const { result } = renderHook(() => useGeolocation());

    expect(result.current.error).toEqual(error);
  });

  it('should clear watch on unmount', () => {
    mockWatchPosition.mockReturnValue(123);
    
    const { unmount } = renderHook(() => useGeolocation());
    
    unmount();
    
    expect(mockClearWatch).toHaveBeenCalledWith(123);
  });
});
