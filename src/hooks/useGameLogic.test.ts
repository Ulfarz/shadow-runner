import { renderHook, act } from '@testing-library/react';
import { useGameLogic } from './useGameLogic';
import { useGameStore } from '../store/useGameStore';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('useGameLogic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useGameStore.getState().resetGame();
    useGameStore.setState({ userPosition: null });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should initialize game when IDLE and userPosition is set', () => {
    const position = {
      latitude: 48.8566,
      longitude: 2.3522,
      accuracy: 5,
      heading: 0,
      speed: 0,
      timestamp: Date.now(),
    };

    const { rerender } = renderHook(() => useGameLogic());

    act(() => {
      useGameStore.setState({ userPosition: position });
    });

    rerender();

    const state = useGameStore.getState();
    expect(state.status).toBe('ACTIVE');
    expect(state.extractionPoint).not.toBeNull();
    expect(state.shadowPosition).not.toBeNull();
  });

  it('should move shadow towards user and update distance', async () => {
    const position = {
      latitude: 48.8566,
      longitude: 2.3522,
      accuracy: 5,
      heading: 0,
      speed: 0,
      timestamp: Date.now(),
    };

    renderHook(() => useGameLogic());

    act(() => {
      useGameStore.setState({ 
        userPosition: position,
        status: 'ACTIVE',
        extractionPoint: { latitude: 48.8766, longitude: 2.3522 },
        shadowPosition: { latitude: 48.8466, longitude: 2.3522 }
      });
    });

    const initialShadowPos = useGameStore.getState().shadowPosition;

    act(() => {
      vi.advanceTimersByTime(1000); // 1 second
    });

    const updatedShadowPos = useGameStore.getState().shadowPosition;
    expect(updatedShadowPos).not.toEqual(initialShadowPos);
    expect(useGameStore.getState().shadowDistance).not.toBeNull();
  });

  it('should end game when user is caught by shadow', () => {
    const position = {
      latitude: 48.8566,
      longitude: 2.3522,
      accuracy: 5,
      heading: 0,
      speed: 0,
      timestamp: Date.now(),
    };

    renderHook(() => useGameLogic());

    act(() => {
      useGameStore.setState({ 
        userPosition: position,
        status: 'ACTIVE',
        extractionPoint: { latitude: 48.8766, longitude: 2.3522 },
        shadowPosition: { latitude: 48.8566, longitude: 2.3522 } // Same as user
      });
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(useGameStore.getState().status).toBe('CAUGHT');
  });

  it('should end game when user reaches extraction point', () => {
    const position = {
      latitude: 48.8566,
      longitude: 2.3522,
      accuracy: 5,
      heading: 0,
      speed: 0,
      timestamp: Date.now(),
    };

    renderHook(() => useGameLogic());

    act(() => {
      useGameStore.setState({ 
        userPosition: position,
        status: 'ACTIVE',
        extractionPoint: { latitude: 48.8566, longitude: 2.3522 }, // Same as user
        shadowPosition: { latitude: 48.8466, longitude: 2.3522 }
      });
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(useGameStore.getState().status).toBe('EXTRACTED');
  });
});
