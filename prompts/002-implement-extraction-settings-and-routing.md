<objective>
Implement dynamic distance selection and real-world street routing for the "Extraction" game mode.
Currently, the game uses a fixed 2km straight-line distance. We need to allow the user to input their desired distance and generate a walkable path using the Mapbox Directions API.
</objective>

<context>
The project is a React PWA using Mapbox GL and Zustand.
Current flow: Main Menu -> Active Game (Logic calculates random straight-line point).
Target files:
@src/store/useGameStore.ts (State management)
@src/components/MainMenu.tsx (UI for settings)
@src/hooks/useGameLogic.ts (Route calculation)
@src/components/GameMap.tsx (Route visualization)
</context>

<requirements>
1. **Game Store Updates**:
   - Add `targetDistance` to the store (number, default 2.0 km).
   - Add `routeCoordinates` to the store (to hold the [lng, lat] array of the generated path).
   - Add actions to update these values.

2. **Main Menu UI**:
   - When "EXTRACTION" mode is selected, show a Text Input (or Number Input) allowing the user to specify the distance in km.
   - Update the `targetDistance` in the store when changed.

3. **Routing Logic (Option B - Real Streets)**:
   - In `useGameLogic.ts`, modify the initialization of the Extraction point.
   - instead of just setting a straight-line point:
     1. Calculate a *rough* destination point using `turf.destination` (straight line based on user input).
     2. Call the Mapbox Directions API (`https://api.mapbox.com/directions/v5/mapbox/walking/...`) from User Position to this Rough Destination.
     3. **Important**: Use the `geometry=geojson` parameter to get the line data.
     4. Update `extractionPoint` to be the *actual* last coordinate of the returned route (to ensure it matches the street map).
     5. Store the full route geometry in `routeCoordinates`.
   - Ensure the Mapbox Access Token is accessible to this hook (extract it to a constant if needed, it is currently in GameMap.tsx).

4. **Map Visualization**:
   - In `GameMap.tsx`, add a new Source and Layer to render the `routeCoordinates` as a visible line (e.g., a dashed yellow or blue line) connecting the player to the extraction point.
   - Ensure this line is below the fog/player markers but visible on the map.
</requirements>

<implementation>
- **API Handling**: Handle the async nature of the Directions API. If the API fails (e.g., no route found), fallback to the straight-line method or show an error.
- **Token Management**: Since `mapboxgl.accessToken` is set in `GameMap`, you might need to export a `MAPBOX_TOKEN` constant from a separate file or `utils/config.ts` so `useGameLogic` can use it for the fetch request without circular dependencies.
- **Styling**: Match the existing Tailwind styling for the new input in the menu.
</implementation>

<verification>
- User can type "5" into the menu input.
- Upon starting, a route line appears on the map following streets.
- The Extraction Point is at the end of that line.
- The game win condition still triggers when reaching the point.
</verification>
