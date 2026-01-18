import { renderHook, waitFor, act } from '@testing-library/react';
import { useGameLogic } from './useGameLogic';
import { useGameStore } from '../store/useGameStore';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock fetch
global.fetch = vi.fn().mockResolvedValue({
  json: () => Promise.resolve({
    routes: [{
      geometry: {
        coordinates: [[2.3522, 48.8566], [2.36, 48.86], [2.37, 48.87]]
      },
      duration: 600,
      distance: 2000
    }]
  })
}) as any;

describe('useGameLogic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    useGameStore.getState().resetGame();
    useGameStore.setState({ userPosition: null });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should initialize game when ACTIVE, gameMode set, and userPosition is set', async () => {
    vi.useRealTimers(); // Use real timers for async initialization

    const position = {
      latitude: 48.8566,
      longitude: 2.3522,
      accuracy: 5,
      heading: 0,
      speed: 0,
      timestamp: Date.now(),
    };

    // Set initial state to trigger game init
    useGameStore.setState({
      status: 'ACTIVE' as const,
      gameMode: 'EXTRACTION' as const,
      targetDistance: 2.0,
      userPosition: position
    });

    renderHook(() => useGameLogic());

    // Wait for async initialization
    await waitFor(() => {
      const state = useGameStore.getState();
      return state.shadowPosition !== null;
    }, { timeout: 3000 });

    const state = useGameStore.getState();
    expect(state.extractionPoint).not.toBeNull();
    expect(state.shadowPosition).not.toBeNull();
  });

  it('should end game when user is caught by shadow (within catch radius)', () => {
    const position = {
      latitude: 48.8566,
      longitude: 2.3522,
      accuracy: 5,
      heading: 0,
      speed: 0,
      timestamp: Date.now(),
    };

    useGameStore.setState({
      userPosition: position,
      status: 'ACTIVE' as const,
      gameMode: 'EXTRACTION' as const,
      extractionPoint: { latitude: 48.8766, longitude: 2.3522 },
      shadowPosition: { latitude: 48.8566, longitude: 2.3522 }, // Same position as user
      initialDistanceToExtraction: 2000
    });

    renderHook(() => useGameLogic());

    // Advance timer to trigger game loop
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(useGameStore.getState().status).toBe('GAME_OVER');
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

    useGameStore.setState({
      userPosition: position,
      status: 'ACTIVE' as const,
      gameMode: 'EXTRACTION' as const,
      extractionPoint: { latitude: 48.8566, longitude: 2.3522 }, // Same as user position
      shadowPosition: { latitude: 48.8466, longitude: 2.3522 }, // Far from user
      initialDistanceToExtraction: 2000
    });

    renderHook(() => useGameLogic());

    // Advance timer to trigger game loop
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(useGameStore.getState().status).toBe('VICTORY');
  });

  it('should update shadow distance when game is active', () => {
    const position = {
      latitude: 48.8566,
      longitude: 2.3522,
      accuracy: 5,
      heading: 0,
      speed: 0,
      timestamp: Date.now(),
    };

    useGameStore.setState({
      userPosition: position,
      status: 'ACTIVE' as const,
      gameMode: 'EXTRACTION' as const,
      extractionPoint: { latitude: 48.87, longitude: 2.36 }, // Far extraction point
      shadowPosition: { latitude: 48.85, longitude: 2.35 }, // Distant shadow
      initialDistanceToExtraction: 2000
    });

    renderHook(() => useGameLogic());

    // Advance timer to trigger game loop
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should update shadow distance
    expect(useGameStore.getState().shadowDistance).not.toBeNull();
  });
});
