import { create } from 'zustand';
import { GameState } from './types';
import { createPlayerSlice } from './slices/createPlayerSlice';
import { createGameSlice } from './slices/createGameSlice';
import { createMapSlice } from './slices/createMapSlice';
import { createShadowSlice } from './slices/createShadowSlice';
import { createMissionSlice } from './slices/createMissionSlice';

export const useGameStore = create<GameState>((...a) => ({
    ...createPlayerSlice(...a),
    ...createGameSlice(...a),
    ...createMapSlice(...a),
    ...createShadowSlice(...a),
    ...createMissionSlice(...a),

    resetGame: () => {
        // We can call individual resets or set state directly if we want atomic reset
        // Using get().resetX() would be cleaner if exposed, but calling set() is also fine
        // Let's call the slice resets
        // NOTE: In Zustand setup like this, we can access state functions via `get()` if needed,
        // but since we are creating a composite store, we can just call the individual reset functions if they are part of the state.
        
        const [, get] = a;
        get().resetGameSlice();
        get().resetMap();
        get().resetShadow();
        get().resetMissions();
        get().resetPlayer();
    }
}));

// Re-export types for convenience
export * from './types';