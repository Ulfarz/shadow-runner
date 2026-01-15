import { supabase } from './supabase';
import * as turf from '@turf/turf';

// =====================================================
// TYPES
// =====================================================

export interface PlayerProfile {
    id: string;
    username: string | null;
    total_distance_km: number;
    total_games_played: number;
    total_extractions: number;
    total_caught: number;
    best_rank: string | null;
    created_at: string;
    updated_at: string;
}

export interface GameSession {
    id?: string;
    user_id: string;
    game_mode: 'EXTRACTION' | 'SURVIVAL';
    status: 'VICTORY' | 'GAME_OVER';
    rank?: string | null;
    path_coordinates: number[][]; // Added this
    distance_km: number;
    duration_seconds: number;
    bonus_missions_completed: number;
    bonus_missions_total: number;
    created_at?: string;
}

export interface Achievement {
    id?: string;
    user_id: string;
    achievement_key: string;
    unlocked_at?: string;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Calculate total distance from path history
 */
export function calculateTotalDistance(pathHistory: number[][]): number {
    if (pathHistory.length < 2) return 0;

    let totalMeters = 0;
    for (let i = 1; i < pathHistory.length; i++) {
        const from = turf.point(pathHistory[i - 1]);
        const to = turf.point(pathHistory[i]);
        totalMeters += turf.distance(from, to, { units: 'meters' });
    }

    return totalMeters / 1000; // Convert to km
}

/**
 * Determine if rank is better than current best
 */
function isBetterRank(newRank: string | null, currentBest: string | null): boolean {
    if (!newRank) return false;
    if (!currentBest) return true;

    const rankOrder = ['S', 'A', 'B', 'C', 'D', 'F'];
    return rankOrder.indexOf(newRank) < rankOrder.indexOf(currentBest);
}

// =====================================================
// STATS SERVICE
// =====================================================

export const statsService = {
    /**
     * Get current user's profile
     */
    async getPlayerProfile(): Promise<PlayerProfile | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error in getPlayerProfile:', error);
            return null;
        }
    },

    /**
     * Save a completed game session and update profile
     */
    async saveGameSession(sessionData: {
        gameMode: 'EXTRACTION' | 'SURVIVAL';
        status: 'VICTORY' | 'GAME_OVER';
        rank: string | null;
        pathHistory: number[][]; // We only need this one input
        durationSeconds: number;
        bonusMissionsCompleted: number;
        bonusMissionsTotal: number;
    }): Promise<boolean> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.warn('No user logged in, skipping stats save');
                return false;
            }

            // Calculate distance
            const distanceKm = calculateTotalDistance(sessionData.pathHistory);

            // 1. Insert game session
            const session: GameSession = {
                user_id: user.id,
                game_mode: sessionData.gameMode,
                status: sessionData.status,
                rank: sessionData.rank,
                path_coordinates: sessionData.pathHistory, // Map here
                distance_km: distanceKm,
                duration_seconds: sessionData.durationSeconds,
                bonus_missions_completed: sessionData.bonusMissionsCompleted,
                bonus_missions_total: sessionData.bonusMissionsTotal,
            };

            const { error: sessionError } = await supabase
                .from('game_sessions')
                .insert(session);

            if (sessionError) {
                console.error('Error saving game session:', sessionError);
                return false;
            }

            // 2. Update player profile
            const profile = await this.getPlayerProfile();
            if (!profile) {
                console.warn('Profile not found, creating one');
                // Profile should auto-create via trigger, but fallback
                await supabase.from('profiles').insert({
                    id: user.id,
                    username: user.user_metadata?.name || 'Runner',
                });
            }

            // Calculate new stats
            const newTotalDistance = (profile?.total_distance_km || 0) + distanceKm;
            const newTotalGames = (profile?.total_games_played || 0) + 1;
            const newExtractions = (profile?.total_extractions || 0) + (sessionData.status === 'VICTORY' ? 1 : 0);
            const newCaught = (profile?.total_caught || 0) + (sessionData.status === 'GAME_OVER' ? 1 : 0);
            const newBestRank = isBetterRank(sessionData.rank, profile?.best_rank || null)
                ? sessionData.rank
                : profile?.best_rank;

            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    total_distance_km: newTotalDistance,
                    total_games_played: newTotalGames,
                    total_extractions: newExtractions,
                    total_caught: newCaught,
                    best_rank: newBestRank,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (profileError) {
                console.error('Error updating profile:', profileError);
                return false;
            }

            console.log('✅ Game stats saved successfully');
            return true;

        } catch (error) {
            console.error('Error in saveGameSession:', error);
            return false;
        }
    },

    /**
     * Get game history (last N sessions)
     */
    async getGameHistory(limit: number = 10): Promise<GameSession[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('game_sessions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('Error fetching game history:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error in getGameHistory:', error);
            return [];
        }
    },

    /**
     * Unlock an achievement
     */
    async unlockAchievement(achievementKey: string): Promise<boolean> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

            const { error } = await supabase
                .from('achievements')
                .insert({
                    user_id: user.id,
                    achievement_key: achievementKey,
                })
                .select()
                .single();

            if (error) {
                // Ignore duplicate key errors (already unlocked)
                if (error.code === '23505') {
                    console.log(`Achievement ${achievementKey} already unlocked`);
                    return true;
                }
                console.error('Error unlocking achievement:', error);
                return false;
            }

            console.log(`🏆 Achievement unlocked: ${achievementKey}`);
            return true;

        } catch (error) {
            console.error('Error in unlockAchievement:', error);
            return false;
        }
    },

    /**
     * Get all unlocked achievements
     */
    async getAchievements(): Promise<Achievement[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('achievements')
                .select('*')
                .eq('user_id', user.id)
                .order('unlocked_at', { ascending: false });

            if (error) {
                console.error('Error fetching achievements:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error in getAchievements:', error);
            return [];
        }
    },
};
