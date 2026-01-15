import { StateCreator } from 'zustand';
import { GameState, GameSlice } from '../types';

export const createGameSlice: StateCreator<GameState, [], [], GameSlice> = (set) => ({
    status: 'IDLE',
    gameMode: null,
    gameStartTime: null,
    gameEndTime: null,
    targetDistance: 5.0,
    finalRank: null,
    gpsError: null,
    retryGpsIndex: 0,
    setStatus: (status) => set({ status }),
    setGameMode: (gameMode) => set({ gameMode }),
    setGameStartTime: (time) => set({ gameStartTime: time }),
    setGameEndTime: (time) => set({ gameEndTime: time }),
    setTargetDistance: (distance) => set({ targetDistance: distance }),
    setFinalRank: (rank) => set({ finalRank: rank }),
    setGpsError: (error) => set({ gpsError: error }),
    triggerGpsRetry: () => set((state) => ({ retryGpsIndex: state.retryGpsIndex + 1 })),
    resetGameSlice: () => set({
        status: 'IDLE',
        gameMode: null,
        gameStartTime: null,
        gameEndTime: null,
        targetDistance: 2.0,
        finalRank: null,
    }),
});
