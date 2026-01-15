import { StateCreator } from 'zustand';
import { GameState, PlayerSlice } from '../types';

export const createPlayerSlice: StateCreator<GameState, [], [], PlayerSlice> = (set) => ({
    userPosition: null,
    pathHistory: [],
    gpsError: null,
    maxSpeed: 0,
    minSpeed: Infinity,
    setUserPosition: (position) => set((state) => {
        const currentSpeed = position.speed || 0;
        // Only update min speed if moving (speed > 1km/h approx 0.27 m/s) to avoid 0 when standing still
        // unless we want absolute min which is likely 0. 
        // Let's track actual movement min speed so it's interesting, or just absolute.
        // Request was "minimal speed", likely absolute minimum during run.
        // But absolute minimum is always 0 if you stop.
        // Let's track absolute for now as requested.

        return {
            userPosition: position,
            maxSpeed: Math.max(state.maxSpeed, currentSpeed),
            minSpeed: currentSpeed < state.minSpeed ? currentSpeed : state.minSpeed
        };
    }),
    setGpsError: (error) => set({ gpsError: error }),
    addToPathHistory: (point) => set((state) => ({ pathHistory: [...state.pathHistory, point] })),
    resetPlayer: () => set({ userPosition: null, pathHistory: [], gpsError: null, maxSpeed: 0, minSpeed: Infinity }),
});
