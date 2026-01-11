import { MissionRank } from '../store/useGameStore';

// Game Constants
export const EXTRACTION_RADIUS_M = 50; // Win radius
export const SHADOW_CATCH_RADIUS_M = 1; // Loss radius
export const CHECKPOINT_RADIUS_M = 30; // Checkpoint trigger radius

// Helper: Convert km/h to m/s
export const kphToMps = (kph: number) => kph / 3.6;

// Rank calculation
export const calculateRank = (
    timeSeconds: number,
    targetDistanceKm: number,
    completedBonuses: number,
    totalBonuses: number,
    caught: boolean
): MissionRank => {
    if (caught) return 'F';

    const timeRatios = {
        S: targetDistanceKm * 6 * 60,   // 6 min/km
        A: targetDistanceKm * 8 * 60,   // 8 min/km
        B: targetDistanceKm * 10 * 60,  // 10 min/km
        C: targetDistanceKm * 12 * 60,  // 12 min/km
    };

    if (timeSeconds <= timeRatios.S && completedBonuses === totalBonuses) return 'S';
    if (timeSeconds <= timeRatios.A && completedBonuses >= 2) return 'A';
    if (timeSeconds <= timeRatios.B && completedBonuses >= 1) return 'B';
    if (timeSeconds <= timeRatios.C) return 'C';
    return 'D';
};
