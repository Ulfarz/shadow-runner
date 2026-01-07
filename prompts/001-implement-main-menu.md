<objective>
Implement a Main Menu screen that allows the player to choose between two game modes: "Extraction" and "Survival".
This menu should be the first screen the user sees, preventing the game from auto-starting immediately.
</objective>

<context>
The project is "Shadow Runner", a PWA survival running game.
Currently, the app initializes the map and game logic immediately upon loading in `App.tsx`.
We need to introduce a "Lobby" or "Menu" state.

Existing Stack:
- React + Vite
- Tailwind CSS (Industrial/Gritty theme)
- Zustand (`useGameStore.ts`)
- MapLibre GL (`GameMap.tsx`)
</context>

<requirements>
1.  **State Management (`useGameStore.ts`)**:
    - Update `GameStatus` to include a `MENU` state.
    - Set `MENU` as the default initial state.
    - Add a `GameMode` type: `'EXTRACTION' | 'SURVIVAL'`.
    - Add `gameMode` to the store with a setter.

2.  **UI Component (`src/components/MainMenu.tsx`)**:
    - Create a new component that covers the screen.
    - **Visual Style**: Industrial, high contrast, dark aesthetic (slate-950, red/emerald accents) matching `GameMap.tsx` and `GameHUD.tsx`.
    - **Content**:
        - Game Title: "SHADOW RUNNER" (large, bold).
        - Mode Selection: Two large, distinct buttons.
            - **Extraction**: Description: "Reach the target before the Shadow catches you." (Color hint: Emerald/Green).
            - **Survival**: Description: "Survive as long as possible." (Color hint: Red/Danger). *Note: For MVP, Survival logic might be identical to Extraction or just 'endless' - if no specific logic exists yet, just set the mode in store and start the standard game loop for now.*
    - **Action**: Clicking a mode should:
        1. Set the `gameMode` in the store.
        2. Set the `status` to `IDLE` (or directly triggers initialization logic if appropriate, but `IDLE` usually triggers the `useGameLogic` initialization effect).

3.  **Application Entry (`App.tsx`)**:
    - Conditionally render `MainMenu` when status is `MENU`.
    - Ensure `GameMap` and `GameHUD` are only fully active/visible when the game is running (or `GameMap` can be in background with an overlay, but `MainMenu` must take focus).
    - If `GameMap` is rendered in the background for visual flair, ensure it doesn't trigger game start logic until the user selects a mode.

4.  **Game Logic (`src/hooks/useGameLogic.ts`)**:
    - Ensure the initialization effect (generating extraction points, etc.) listens to the state change (e.g., transition from MENU to IDLE/ACTIVE) and respects the chosen `gameMode` (even if logic is same for now, pass it through).
</requirements>

<output>
Modify/Create the following files:
- `src/store/useGameStore.ts`
- `src/components/MainMenu.tsx`
- `src/App.tsx`
- `src/hooks/useGameLogic.ts` (if necessary for state transition handling)
</output>

<verification>
- The app should load to the Main Menu.
- Selecting "Extraction" starts the game.
- Selecting "Survival" starts the game.
- The `gameMode` is correctly stored in the Zustand store.
</verification>
