import { renderHook } from '@testing-library/react';
import { useWakeLock } from './useWakeLock';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('useWakeLock', () => {
  const mockRequest = vi.fn();
  const mockRelease = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock navigator.wakeLock
    Object.defineProperty(navigator, 'wakeLock', {
      value: {
        request: mockRequest.mockResolvedValue({
          release: mockRelease
        })
      },
      configurable: true
    });

    // Mock document.visibilityState
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true
    });
  });

  it('should request wake lock on mount', async () => {
    renderHook(() => useWakeLock());
    
    expect(mockRequest).toHaveBeenCalledWith('screen');
  });

  it('should release wake lock on unmount', async () => {
    const { unmount } = renderHook(() => useWakeLock());
    
    // Wait for the async request in useEffect
    await vi.waitFor(() => {
      expect(mockRequest).toHaveBeenCalled();
    });

    unmount();
    
    expect(mockRelease).toHaveBeenCalled();
  });

  it('should re-request wake lock on visibility change to visible', async () => {
    renderHook(() => useWakeLock());
    
    await vi.waitFor(() => {
      expect(mockRequest).toHaveBeenCalledTimes(1);
    });

    // Simulate visibility change
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true
    });
    document.dispatchEvent(new Event('visibilitychange'));

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true
    });
    document.dispatchEvent(new Event('visibilitychange'));

    await vi.waitFor(() => {
      expect(mockRequest).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle wake lock request failure gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockRequest.mockRejectedValueOnce(new Error('Failed to request'));
    
    renderHook(() => useWakeLock());

    await vi.waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Wake Lock request failed:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });

  it('should not request wake lock if not supported', async () => {
    // Remove wakeLock from navigator
    // @ts-ignore
    delete navigator.wakeLock;
    
    renderHook(() => useWakeLock());
    
    expect(mockRequest).not.toHaveBeenCalled();
  });
});
