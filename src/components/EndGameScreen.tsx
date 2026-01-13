import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Trophy, Clock, CheckCircle, XCircle, RotateCcw, Zap, MapPin, Timer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { statsService } from '../services/statsService';

export const EndGameScreen: React.FC = () => {
    const {
        status,
        finalRank,
        gameStartTime,
        gameEndTime,
        bonusMissions,
        resetGame,
        gameMode,
        pathHistory
    } = useGameStore();
    const { t } = useTranslation();
    const [statsSaved, setStatsSaved] = useState(false);

    // Stats calculations
    const timeTaken = gameStartTime && gameEndTime ? (gameEndTime - gameStartTime) / 1000 : 0;
    const minutes = Math.floor(timeTaken / 60);
    const seconds = Math.floor(timeTaken % 60);

    const rank = finalRank || 'F';
    const isSuccess = status === 'EXTRACTED';

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
        if ((status === 'EXTRACTED' || status === 'CAUGHT') && !statsSaved && gameMode === 'EXTRACTION') {
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

    if (status !== 'EXTRACTED' && status !== 'CAUGHT') return null;
    if (gameMode !== 'EXTRACTION') return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4 overflow-y-auto">
            <div className={`w-full max-w-md flex flex-col items-center relative ${isSuccess ? '' : 'animate-shake'}`}>

                {/* Background Glow Effect */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none ${isSuccess ? 'bg-emerald-500' : 'bg-red-500'}`} />

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
                <div className="relative mb-10 animate-scale-up z-10">
                    {/* Ring Container */}
                    <div className={`w-40 h-40 rounded-full border-4 flex items-center justify-center bg-slate-900 ${currentRank.color} ${currentRank.shadow} ${isSuccess ? 'animate-pulse-glow border-current' : 'border-red-900/50'}`}>
                        {isSuccess ? (
                            <span className="text-8xl font-black drop-shadow-lg">{rank}</span>
                        ) : (
                            <XCircle size={80} className="text-red-500 opacity-80" />
                        )}
                    </div>
                    {/* Rank Label Badge */}
                    <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full border border-slate-700 bg-slate-900 text-sm font-bold uppercase tracking-wider whitespace-nowrap ${currentRank.color}`}>
                        {currentRank.label}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 w-full mb-6 animate-slide-up-delay-200 z-10">
                    <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <Clock size={16} />
                            <span className="text-xs font-bold uppercase">Time</span>
                        </div>
                        <span className="text-2xl font-mono font-bold text-white">
                            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </span>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <Trophy size={16} />
                            <span className="text-xs font-bold uppercase">Bonus</span>
                        </div>
                        <span className="text-2xl font-mono font-bold text-white">
                            {bonusMissions.filter(m => m.completed).length}/{bonusMissions.length}
                        </span>
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
