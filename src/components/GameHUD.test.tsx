import { render, screen } from '@testing-library/react';
import { GameHUD } from './GameHUD';
import { useGameStore } from '../store/useGameStore';
import { describe, it, expect, beforeEach } from 'vitest';

describe('GameHUD', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
    useGameStore.setState({ userPosition: null });
  });

  it('should display searching status when no user position', () => {
    render(<GameHUD />);
    expect(screen.getByText(/GPS: SEARCHING/i)).toBeDefined();
  });

  it('should display locked status when user position is available', () => {
    useGameStore.setState({
      userPosition: {
        latitude: 10,
        longitude: 20,
        accuracy: 5,
        heading: 90,
        speed: 5,
        timestamp: Date.now(),
      }
    });
    render(<GameHUD />);
    expect(screen.getByText(/GPS: LOCKED/i)).toBeDefined();
    expect(screen.getByText(/±5m/i)).toBeDefined();
    expect(screen.getByText(/18.0/i)).toBeDefined(); // 5 m/s * 3.6 = 18.0 km/h
    expect(screen.getByText(/90/i)).toBeDefined();
  });
});
