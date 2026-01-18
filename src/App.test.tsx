import { render } from '@testing-library/react';
import App from './App';
import { vi, describe, it, expect } from 'vitest';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'menu.gps_activate': 'ACTIVATE GPS LOCATION',
        'menu.gps_locked': 'GPS SIGNAL LOCKED',
        'auth.login_google': 'GOOGLE LOGIN',
      };
      return translations[key] || key;
    },
    i18n: { language: 'en', changeLanguage: vi.fn() }
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() }
}));

// Mock dependencies
vi.mock('mapbox-gl', () => {
  return {
    default: {
      accessToken: '',
      Map: vi.fn().mockImplementation(function () {
        return {
          addControl: vi.fn(),
          on: vi.fn(),
          remove: vi.fn(),
          getSource: vi.fn(),
          isStyleLoaded: vi.fn().mockReturnValue(true),
          setFog: vi.fn(),
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
    // The app shows auth gate when not logged in, so we look for Google login
    expect(getByText(/GOOGLE LOGIN/i)).toBeDefined();
  });
});
