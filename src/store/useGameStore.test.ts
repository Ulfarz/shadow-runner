import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './useGameStore';

describe('useGameStore', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
    useGameStore.setState({ userPosition: null });
  });

  it('should initialize with default values', () => {
    const state = useGameStore.getState();
    expect(state.userPosition).toBeNull();
    expect(state.status).toBe('IDLE');
    expect(state.extractionPoint).toBeNull();
    expect(state.shadowPosition).toBeNull();
    expect(state.shadowDistance).toBeNull();
  });

  it('should update user position', () => {
    const position = {
      latitude: 10,
      longitude: 20,
      accuracy: 5,
      heading: 90,
      speed: 2,
      timestamp: 123456789,
    };
    useGameStore.getState().setUserPosition(position);
    expect(useGameStore.getState().userPosition).toEqual(position);
  });

  it('should update game status', () => {
    useGameStore.getState().setStatus('ACTIVE');
    expect(useGameStore.getState().status).toBe('ACTIVE');
  });

  it('should update extraction point', () => {
    const point = { latitude: 15, longitude: 25 };
    useGameStore.getState().setExtractionPoint(point);
    expect(useGameStore.getState().extractionPoint).toEqual(point);
  });

  it('should update shadow position', () => {
    const point = { latitude: 12, longitude: 22 };
    useGameStore.getState().setShadowPosition(point);
    expect(useGameStore.getState().shadowPosition).toEqual(point);
  });

  it('should update shadow distance', () => {
    useGameStore.getState().setShadowDistance(100);
    expect(useGameStore.getState().shadowDistance).toBe(100);
  });

  it('should reset game state', () => {
    useGameStore.getState().setStatus('ACTIVE');
    useGameStore.getState().setExtractionPoint({ latitude: 1, longitude: 1 });
    useGameStore.getState().resetGame();
    
    const state = useGameStore.getState();
    expect(state.status).toBe('IDLE');
    expect(state.extractionPoint).toBeNull();
    expect(state.shadowPosition).toBeNull();
    expect(state.shadowDistance).toBeNull();
  });
});
