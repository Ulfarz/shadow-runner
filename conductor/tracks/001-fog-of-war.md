# Track 001: Fog of War Implementation

**Goal:** Implement a persistent Fog of War (FoW) system that obscures the map and reveals it as the user travels.

## 1. Requirements
- **Visuals:** The map should be covered in a dark overlay (Fog).
- **Discovery:** As the user moves, a radius around them (e.g., 50m) should be "cut out" from the Fog permanently.
- **Persistence:** The discovered area must be saved to IndexedDB so it remains discovered across sessions.
- **Performance:** Rendering and updating the Fog should be performant enough for mobile devices.

## 2. Technical Approach
- **Dependencies:** `idb` for IndexedDB storage. `@turf/turf` for geometry operations.
- **Data Structure:**
    - `exploredPolygon`: A GeoJSON `Polygon` or `MultiPolygon` representing the union of all visited areas.
    - We will also store a `worldMask`: A giant polygon covering the world.
    - The "Fog Layer" to render is `Difference(worldMask, exploredPolygon)`.
    - *Optimization:* Calculating `difference` on every frame is expensive. Instead, we can render the `exploredPolygon` as a mask using a specific "reverse" styling technique or just use a `fill` layer for the `exploredPolygon` with `fill-opacity: 0` (transparent) and a background layer?
    - *Better Rendering Approach:* MapLibre supports `fill-extrusion` or just `fill`. To make a "mask", we can create a Polygon that covers the world *with a hole* where the `exploredPolygon` is.
        - `turf.mask(exploredPolygon)` creates exactly this (a polygon that covers the bbox but has a hole for the masked area).
- **Store:** Update `useGameStore` (or create `useFogStore`) to hold the `exploredPolygon`.
- **Logic (`useGameLogic` or new `useFogOfWar`):**
    - Subscribe to `userPosition`.
    - On position update:
        - Create a circle (buffer) around the user (radius ~50m).
        - Union this circle with the current `exploredPolygon`.
        - Update store.
        - Save to IndexedDB (debounced).

## 3. Implementation Steps
1.  [x] Install `idb`.
2.  [x] Create `src/utils/db.ts` to handle IndexedDB operations for the "fog" store.
3.  [x] Update `src/store/useGameStore.ts` to include `exploredPolygon`.
4.  [x] Create `src/hooks/useFogOfWar.ts` to handle the logic (unioning, saving, loading).
5.  [x] Integrate `useFogOfWar` into `App.tsx`.
6.  [x] Update `GameMap.tsx` to render the Fog layer.
