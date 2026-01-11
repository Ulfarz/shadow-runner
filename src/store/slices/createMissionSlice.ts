import { StateCreator } from 'zustand';
import { GameState, MissionSlice } from '../types';

export const createMissionSlice: StateCreator<GameState, [], [], MissionSlice> = (set) => ({
    bonusMissions: [],
    completedBonusCount: 0,
    checkpoint: null,
    checkpointReached: false,
    setBonusMissions: (missions) => set({ bonusMissions: missions }),
    updateBonusMission: (id, updates) => set((state) => ({
        bonusMissions: state.bonusMissions.map((m) =>
            m.id === id ? { ...m, ...updates } : m
        ),
        completedBonusCount: state.bonusMissions.filter((m) =>
            m.id === id ? updates.completed ?? m.completed : m.completed
        ).length
    })),
    setCheckpoint: (point) => set({ checkpoint: point }),
    setCheckpointReached: (reached) => set({ checkpointReached: reached }),
    resetMissions: () => set({
        bonusMissions: [],
        completedBonusCount: 0,
        checkpoint: null,
        checkpointReached: false
    }),
});
