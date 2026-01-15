import { StateCreator } from 'zustand';
import { GameState, ShadowSlice } from '../types';

export const createShadowSlice: StateCreator<GameState, [], [], ShadowSlice> = (set) => ({
    shadowPosition: null,
    shadowDistance: null,
    currentShadowSpeed: 15,
    baseShadowSpeed: 15,
    maxShadowSpeed: 25,
    setShadowPosition: (point) => set({ shadowPosition: point }),
    setShadowDistance: (distance) => set({ shadowDistance: distance }),
    setCurrentShadowSpeed: (speed) => set({ currentShadowSpeed: speed }),
    setBaseShadowSpeed: (speed) => set({ baseShadowSpeed: speed, currentShadowSpeed: speed }),
    resetShadow: () => set({
        shadowPosition: null,
        shadowDistance: null,
        currentShadowSpeed: 15,
    }),
});
