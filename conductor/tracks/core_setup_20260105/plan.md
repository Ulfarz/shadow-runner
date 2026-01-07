# Track Plan: Core ShadowRunner Environment

## Phase 1: Project Scaffolding & Map Integration

- [x] Task: Initialize React + Vite project with TypeScript and Tailwind CSS
- [x] Task: Install core dependencies (`maplibre-gl`, `@turf/turf`, `zustand`, `lucide-react`)
- [x] Task: Implement `GameMap` component with a full-screen dark tactical style
- [x] Task: Implement Screen Wake Lock API to prevent device sleep

## Phase 2: GPS Tracking & HUD

- [x] Task: Implement GPS tracking hook using `navigator.geolocation.watchPosition`
- [x] Task: Create `useGameStore` with Zustand for position and game state
- [x] Task: Design and implement HUD-style overlays for stats and alerts

## Phase 3: Survival Logic (Extraction & Shadow)

- [x] Task: Implement random "Extraction Point" generation (2km radius) using Turf.js
- [x] Task: Implement "Relentless" Shadow movement algorithm
- [x] Task: Create proximity-based visual pulsing effect (Hazard Red)
- [~] Task: Conductor - User Manual Verification 'Phase 3: Survival Logic (Extraction & Shadow)' (Protocol in workflow.md)
