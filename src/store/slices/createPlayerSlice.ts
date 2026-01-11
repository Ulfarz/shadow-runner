import { StateCreator } from 'zustand';
import { GameState, PlayerSlice } from '../types';

export const createPlayerSlice: StateCreator<GameState, [], [], PlayerSlice> = (set) => ({
    userPosition: null,
    pathHistory: [],
    gpsError: null,
    setUserPosition: (position) => set({ userPosition: position }),
    setGpsError: (error) => set({ gpsError: error }),
    addToPathHistory: (point) => set((state) => ({ pathHistory: [...state.pathHistory, point] })),
    resetPlayer: () => set({ userPosition: null, pathHistory: [], gpsError: null }),
});
