# Tech Stack

## Core Framework & Build
- **React + Vite (TypeScript):** Primary framework for building a high-performance, interactive UI with type safety and fast development cycles.

## Styling & UI
- **Tailwind CSS:** For rapid, mobile-first development of responsive HUD overlays and tactical interface elements.
- **Lucide React:** Icon library for consistent, high-quality tactical icons.

## Mapping & Geospatial
- **MapLibre GL JS:** Open-source, high-performance mapping engine for rendering dark maps and complex Fog of War layers.
- **Turf.js:** Comprehensive library for geospatial calculations (Haversine distance, random points, intersections).

## State & Data
- **Zustand:** Lightweight state management for real-time tracking of GPS coordinates, game state, and UI alerts.
- **Dexie.js (IndexedDB):** For high-volume local persistence of discovered coordinates (Fog of War) and run history.

## PWA & Web APIs
- **vite-plugin-pwa:** For offline support, manifest generation, and service worker management.
- **Screen Wake Lock API:** Crucial for keeping the device active during runs for continuous GPS tracking.
- **HTML5 Geolocation API:** For real-time user position tracking.

## Testing & Quality
- **Vitest:** Fast unit and integration testing.
- **React Testing Library:** For component-level verification.
