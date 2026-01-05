# Track Plan: Core ShadowRunner Environment

## Phase 1: Project Scaffolding & Map Integration

- [~] Task: Initialize React + Vite project with TypeScript and Tailwind CSS
- [ ] Task: Install core dependencies (`maplibre-gl`, `turf`, `zustand`, `lucide-react`)
- [ ] Task: Implement `GameMap` component with a full-screen dark tactical style
- [ ] Task: Implement Screen Wake Lock API to prevent device sleep
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Project Scaffolding & Map Integration' (Protocol in workflow.md)

## Phase 2: GPS Tracking & HUD

- [ ] Task: Implement GPS tracking hook using `navigator.geolocation.watchPosition`
- [ ] Task: Create `useGameStore` with Zustand for position and game state
- [ ] Task: Design and implement HUD-style overlays for stats and alerts
- [ ] Task: Conductor - User Manual Verification 'Phase 2: GPS Tracking & HUD' (Protocol in workflow.md)

## Phase 3: Survival Logic (Extraction & Shadow)

- [ ] Task: Implement random "Extraction Point" generation (2km radius) using Turf.js
- [ ] Task: Implement "Relentless" Shadow movement algorithm
- [ ] Task: Create proximity-based visual pulsing effect (Hazard Red)
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Survival Logic (Extraction & Shadow)' (Protocol in workflow.md)
