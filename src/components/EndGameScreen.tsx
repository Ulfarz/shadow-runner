import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { Trophy, Clock, CheckCircle, XCircle, RotateCcw, Zap, MapPin, Timer } from 'lucide-react';

const rankColors: Record<string, string> = {
    S: 'text-yellow-400 border-yellow-400 shadow-yellow-400/50',
    A: 'text-emerald-400 border-emerald-400 shadow-emerald-400/50',
    B: 'text-sky-400 border-sky-400 shadow-sky-400/50',
    C: 'text-orange-400 border-orange-400 shadow-orange-400/50',
    D: 'text-slate-400 border-slate-400 shadow-slate-400/50',
    F: 'text-red-500 border-red-500 shadow-red-500/50',
};

const rankDescriptions: Record<string, string> = {
    S: 'LEGENDARY',
    A: 'EXCELLENT',
    B: 'GREAT',
    C: 'ACCEPTABLE',
    D: 'COMPLETED',
    F: 'MISSION FAILED',
};

export const EndGameScreen: React.FC = () => {
    const { status, finalRank, gameStartTime, gameEndTime, bonusMissions, resetGame, gameMode } = useGameStore();

    if (status !== 'EXTRACTED' && status !== 'CAUGHT') return null;
    if (gameMode !== 'EXTRACTION') return null;

    const timeTaken = gameStartTime && gameEndTime ? (gameEndTime - gameStartTime) / 1000 : 0;
    const minutes = Math.floor(timeTaken / 60);
    const seconds = Math.floor(timeTaken % 60);

    const rank = finalRank || 'F';
    const isSuccess = status === 'EXTRACTED';

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 overflow-y-auto">
            <div className="w-full max-w-sm flex flex-col items-center py-6">
                {/* Status Icon - Smaller on mobile */}
                <div className={`mb-4 sm:mb-6 p-4 sm:p-6 rounded-full ${isSuccess ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                    {isSuccess ? (
                        <Trophy size={48} className="text-emerald-400 sm:w-16 sm:h-16" />
                    ) : (
                        <XCircle size={48} className="text-red-500 sm:w-16 sm:h-16" />
                    )}
                </div>

                {/* Title */}
                <h1 className={`text-xl sm:text-2xl font-black uppercase tracking-tight mb-2 text-center ${isSuccess ? 'text-emerald-400' : 'text-red-500'}`}>
                    {isSuccess ? 'EXTRACTION COMPLETE' : 'YOU WERE CAUGHT'}
                </h1>

                {/* Rank Display */}
                <div className={`my-4 sm:my-6 w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 flex items-center justify-center shadow-[0_0_20px] ${rankColors[rank]}`}>
                    <span className={`text-5xl sm:text-6xl font-black ${rankColors[rank].split(' ')[0]}`}>{rank}</span>
                </div>
                <p className={`text-sm sm:text-base font-bold uppercase tracking-widest mb-4 sm:mb-6 ${rankColors[rank].split(' ')[0]}`}>
                    {rankDescriptions[rank]}
                </p>

                {/* Stats */}
                <div className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-700">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Clock size={16} />
                            <span className="font-mono text-xs sm:text-sm">TIME</span>
                        </div>
                        <span className="font-mono text-xl sm:text-2xl font-bold text-white">
                            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </span>
                    </div>

                    {/* Bonus Missions */}
                    <div className="space-y-2">
                        <h3 className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bonus Objectives</h3>
                        {bonusMissions.map((mission) => (
                            <div key={mission.id} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    {mission.type === 'CHECKPOINT' && <MapPin size={14} className="text-amber-400 shrink-0" />}
                                    {mission.type === 'TIME_BONUS' && <Timer size={14} className="text-sky-400 shrink-0" />}
                                    {mission.type === 'SPEED_CHALLENGE' && <Zap size={14} className="text-purple-400 shrink-0" />}
                                    <span className="text-xs sm:text-sm text-slate-300 truncate">{mission.description}</span>
                                </div>
                                {mission.completed ? (
                                    <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                                ) : (
                                    <XCircle size={16} className="text-red-500/50 shrink-0" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Play Again Button */}
                <button
                    onClick={resetGame}
                    className="w-full py-3 sm:py-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 sm:gap-3 uppercase tracking-wide text-sm sm:text-base pointer-events-auto"
                >
                    <RotateCcw size={18} />
                    Return to Menu
                </button>
            </div>
        </div>
    );
};
