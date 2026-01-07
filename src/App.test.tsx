import { render } from '@testing-library/react';
import App from './App';
import { vi, describe, it, expect } from 'vitest';

// Mock dependencies
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

// Mock geolocation
Object.defineProperty(navigator, 'geolocation', {
  value: {
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
  configurable: true
});

// Mock wake lock
Object.defineProperty(navigator, 'wakeLock', {
  value: {
    request: vi.fn().mockResolvedValue({ release: vi.fn().mockResolvedValue(undefined) })
  },
  configurable: true
});

describe('App', () => {
  it('should render GameMap and GameHUD', () => {
    const { container, getByText } = render(<App />);
    expect(container.querySelector('.absolute.inset-0')).toBeDefined();
    expect(getByText(/Shadow/i)).toBeDefined();
    expect(getByText(/GPS: SEARCHING/i)).toBeDefined();
  });
});
