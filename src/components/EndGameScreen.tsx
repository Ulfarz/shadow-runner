import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Clock, CheckCircle, XCircle, RotateCcw, Zap, MapPin, Timer, Activity, TrendingUp, TrendingDown, Route, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { statsService } from '../services/statsService';
import * as turf from '@turf/turf';

export const EndGameScreen: React.FC = () => {
    const {
        status,
        finalRank,
        gameStartTime,
        gameEndTime,
        bonusMissions,
        resetGame,
        gameMode,
        pathHistory,
        maxSpeed,
        minSpeed,
        targetDistance
    } = useGameStore();
    const { t } = useTranslation();
    const [statsSaved, setStatsSaved] = useState(false);

    // Stats calculations
    const timeTaken = gameStartTime && gameEndTime ? (gameEndTime - gameStartTime) / 1000 : 0;
    const minutes = Math.floor(timeTaken / 60);
    const seconds = Math.floor(timeTaken % 60);

    // Calculate Total Distance from Path History
    const totalDistance = React.useMemo(() => {
        if (!pathHistory || pathHistory.length < 2) return 0;
        const line = turf.lineString(pathHistory);
        return turf.length(line, { units: 'kilometers' });
    }, [pathHistory]);

    // Format Speed (m/s to km/h)
    const toKmh = (ms: number) => (ms * 3.6).toFixed(1);

    // Average Speed (km/h)
    // Distance (km) / Time (h)
    const avgSpeed = timeTaken > 0 ? (totalDistance / (timeTaken / 3600)).toFixed(1) : '0.0';

    const rank = finalRank || 'F';
    // isSuccess moved to below checks

    // Styles Configuration
    const rankConfig: Record<string, { color: string, bg: string, shadow: string, label: string }> = {
        S: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', shadow: 'shadow-yellow-500/50', label: t('endgame.legendary') },
        A: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', shadow: 'shadow-emerald-500/50', label: t('endgame.excellent') },
        B: { color: 'text-sky-400', bg: 'bg-sky-500/10', shadow: 'shadow-sky-500/50', label: t('endgame.great') },
        C: { color: 'text-orange-400', bg: 'bg-orange-500/10', shadow: 'shadow-orange-500/50', label: t('endgame.acceptable') },
        D: { color: 'text-slate-400', bg: 'bg-slate-500/10', shadow: 'shadow-slate-500/50', label: t('endgame.completed') },
        F: { color: 'text-red-500', bg: 'bg-red-500/10', shadow: 'shadow-red-500/50', label: t('endgame.failed') },
    };

    const currentRank = rankConfig[rank] || rankConfig['F'];

    // Save stats to Supabase when screen appears
    useEffect(() => {
        if ((status === 'VICTORY' || status === 'GAME_OVER') && !statsSaved && gameMode === 'EXTRACTION') {
            const saveStats = async () => {
                const success = await statsService.saveGameSession({
                    gameMode: gameMode,
                    status: status,
                    rank: finalRank,
                    pathHistory: pathHistory,
                    durationSeconds: timeTaken,
                    bonusMissionsCompleted: bonusMissions.filter(m => m.completed).length,
                    bonusMissionsTotal: bonusMissions.length,
                });

                if (success) {
                    setStatsSaved(true);
                    console.log('✅ Stats saved to Supabase');
                }
            };

            saveStats();
        }
    }, [status, statsSaved, gameMode, finalRank, pathHistory, timeTaken, bonusMissions]);

    if (status !== 'VICTORY' && status !== 'GAME_OVER') return null;

    const isSuccess = status === 'VICTORY'; // Keep for legacy if used, or replace usage
    const isWin = status === 'VICTORY' || (status === 'GAME_OVER' && gameMode === 'SURVIVAL' && totalDistance >= targetDistance);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4 overflow-y-auto">
            <div className={`w-full max-w-md flex flex-col items-center relative ${isWin ? '' : 'animate-shake'}`}>

                {/* Background Glow Effect */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none ${isWin ? 'bg-emerald-500' : 'bg-red-500'}`} />

                {/* Header Banner */}
                <div className="text-center mb-8 animate-slide-up-delay-100 z-10">
                    <h2 className={`text-sm tracking-[0.2em] font-bold uppercase mb-2 ${isSuccess ? 'text-emerald-400' : 'text-red-500'}`}>
                        {isSuccess ? 'Mission Report' : 'Connection Lost'}
                    </h2>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
                        {isSuccess ? t('endgame.success') : t('endgame.fail')}
                    </h1>
                </div>

                {/* Main Rank/Trophy Visual */}
                <div className="relative mb-6 animate-scale-up z-10">
                    {/* Ring Container */}
                    <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center bg-slate-900 ${currentRank.color} ${currentRank.shadow} ${isSuccess ? 'animate-pulse-glow border-current' : 'border-red-900/50'}`}>
                        {isSuccess ? (
                            <span className="text-6xl font-black drop-shadow-lg">{rank}</span>
                        ) : (
                            <XCircle size={64} className="text-red-500 opacity-80" />
                        )}
                    </div>
                </div>

                {/* Detailed Stats Grid (New) */}
                <div className="grid grid-cols-2 gap-2 w-full mb-6 animate-slide-up-delay-200 z-10">

                    {/* Time */}
                    <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                        <div className="flex items-center gap-1.5 text-slate-400 mb-1 text-[10px] font-bold uppercase tracking-wider">
                            <Clock size={12} /> {t('endgame.time')}
                        </div>
                        <span className="text-xl font-mono font-bold text-white">
                            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </span>
                    </div>

                    {/* Total Distance */}
                    <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                        <div className="flex items-center gap-1.5 text-slate-400 mb-1 text-[10px] font-bold uppercase tracking-wider">
                            <Route size={12} /> {t('stats.distance')}
                        </div>
                        <span className="text-xl font-mono font-bold text-white">
                            {totalDistance.toFixed(2)} <span className="text-xs text-slate-500">km</span>
                        </span>
                    </div>

                    {/* Average Speed */}
                    <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                        <div className="flex items-center gap-1.5 text-slate-400 mb-1 text-[10px] font-bold uppercase tracking-wider">
                            <Activity size={12} /> {t('stats.avg_speed')}
                        </div>
                        <span className="text-xl font-mono font-bold text-white">
                            {avgSpeed} <span className="text-xs text-slate-500">km/h</span>
                        </span>
                    </div>

                    {/* Max Speed */}
                    <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                        <div className="flex items-center gap-1.5 text-slate-400 mb-1 text-[10px] font-bold uppercase tracking-wider">
                            <TrendingUp size={12} /> {t('stats.max_speed')}
                        </div>
                        <span className="text-xl font-mono font-bold text-emerald-400">
                            {toKmh(maxSpeed)} <span className="text-xs text-emerald-500/50">km/h</span>
                        </span>
                    </div>

                    {/* Min Speed - Only show if relevant (e.g. survival or just general stats) */}
                    {/* If 5 items, grid might look odd. Let's replace "Time" with "Min Speed" or make a row of 3? 
                        Time is pretty important. Let's make it a 3-col grid for speed limits or something.
                        Or just add it at the bottom.
                        
                        The previous edit REPLACED the old Stats Grid (Time + Bonus) with a NEW Grid (Time, Distance, Avg, Max).
                        So "Bonus" count was removed from the stats grid but is present in the checklist below.
                        
                        I need to fit "Min Speed".
                        
                        Let's change grid to have more rows or columns.
                        Let's do a compact row for Max/Min speed.
                    */}
                    <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl flex flex-col items-center justify-center text-center col-span-2">
                        <div className="flex items-center justify-between w-full px-4">
                            <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1.5 text-slate-400 mb-1 text-[10px] font-bold uppercase tracking-wider">
                                    <TrendingDown size={12} /> {t('stats.min_speed')}
                                </div>
                                <span className="text-xl font-mono font-bold text-slate-300">
                                    {toKmh(minSpeed === Infinity ? 0 : minSpeed)} <span className="text-xs text-slate-500">km/h</span>
                                </span>
                            </div>

                            <div className="w-px h-8 bg-slate-800 mx-2" />

                            <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1.5 text-slate-400 mb-1 text-[10px] font-bold uppercase tracking-wider">
                                    <Trophy size={12} /> {t('endgame.bonus')}
                                </div>
                                <span className="text-xl font-mono font-bold text-amber-400">
                                    {bonusMissions.filter(m => m.completed).length}/{bonusMissions.length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mission Checklist (Gamified) */}
                <div className="w-full space-y-3 mb-8 animate-slide-up-delay-300 z-10">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2">Objectives</h3>
                    {bonusMissions.map((mission) => (
                        <div
                            key={mission.id}
                            className={`flex items-center p-3 rounded-lg border backdrop-blur-sm transition-all duration-300 ${mission.completed
                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                : 'bg-slate-900/40 border-slate-800 grayscale opacity-70'
                                }`}
                        >
                            <div className={`p-2 rounded-full mr-3 ${mission.completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                {mission.type === 'CHECKPOINT' && <MapPin size={16} />}
                                {mission.type === 'TIME_BONUS' && <Timer size={16} />}
                                {mission.type === 'SPEED_CHALLENGE' && <Zap size={16} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${mission.completed ? 'text-white' : 'text-slate-400'}`}>
                                    {mission.description}
                                </p>
                            </div>
                            {mission.completed && (
                                <CheckCircle size={18} className="text-emerald-400 ml-2 animate-scale-up" />
                            )}
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <button
                    onClick={resetGame}
                    className="w-full py-4 bg-white hover:bg-slate-200 text-slate-950 font-black rounded-xl transition-all active:scale-[0.98] uppercase tracking-wide flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] z-10"
                >
                    <RotateCcw size={20} />
                    {t('endgame.return')}
                </button>
            </div>
        </div>
    );
};
