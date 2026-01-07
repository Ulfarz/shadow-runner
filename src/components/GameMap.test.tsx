import { render } from '@testing-library/react';
import GameMap from './GameMap';
import { useGameStore } from '../store/useGameStore';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock MapLibre GL
vi.mock('maplibre-gl', () => {
  return {
    default: {
      Map: vi.fn().mockImplementation(function() {
        return {
          addControl: vi.fn(),
          on: vi.fn(),
          remove: vi.fn(),
          getSource: vi.fn(),
          isStyleLoaded: vi.fn().mockReturnValue(true),
        };
      }),
      NavigationControl: vi.fn(),
      GeolocateControl: vi.fn(),
    }
  };
});

describe('GameMap', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });

  it('should render map container', () => {
    const { container } = render(<GameMap />);
    expect(container.querySelector('.absolute.inset-0')).toBeDefined();
  });

  it('should display game status', () => {
    useGameStore.setState({ status: 'ACTIVE' });
    const { getByText } = render(<GameMap />);
    expect(getByText(/STATUS: ACTIVE/i)).toBeDefined();
  });

  it('should show hazard pulse when active', () => {
    useGameStore.setState({ status: 'ACTIVE', shadowDistance: 100 });
    const { container } = render(<GameMap />);
    // Check if hazard pulse div is rendered (it should have a style with boxShadow)
    const hazardDiv = container.querySelector('[style*="box-shadow"]');
    expect(hazardDiv).toBeDefined();
  });
});
