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
    if (gameMode !== 'EXTRACTION') return null; // Only show for extraction mode

    const timeTaken = gameStartTime && gameEndTime ? (gameEndTime - gameStartTime) / 1000 : 0;
    const minutes = Math.floor(timeTaken / 60);
    const seconds = Math.floor(timeTaken % 60);

    const rank = finalRank || 'F';
    const isSuccess = status === 'EXTRACTED';

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 backdrop-blur-md">
            <div className="max-w-md w-full px-6 flex flex-col items-center">
                {/* Status Icon */}
                <div className={`mb-6 p-6 rounded-full ${isSuccess ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                    {isSuccess ? (
                        <Trophy size={64} className="text-emerald-400" />
                    ) : (
                        <XCircle size={64} className="text-red-500" />
                    )}
                </div>

                {/* Title */}
                <h1 className={`text-3xl font-black uppercase tracking-tight mb-2 ${isSuccess ? 'text-emerald-400' : 'text-red-500'}`}>
                    {isSuccess ? 'EXTRACTION COMPLETE' : 'YOU WERE CAUGHT'}
                </h1>

                {/* Rank Display */}
                <div className={`my-8 w-32 h-32 rounded-full border-4 flex items-center justify-center shadow-[0_0_30px] ${rankColors[rank]}`}>
                    <span className={`text-7xl font-black ${rankColors[rank].split(' ')[0]}`}>{rank}</span>
                </div>
                <p className={`text-lg font-bold uppercase tracking-widest mb-8 ${rankColors[rank].split(' ')[0]}`}>
                    {rankDescriptions[rank]}
                </p>

                {/* Stats */}
                <div className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Clock size={18} />
                            <span className="font-mono text-sm">TIME</span>
                        </div>
                        <span className="font-mono text-2xl font-bold text-white">
                            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </span>
                    </div>

                    {/* Bonus Missions */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bonus Objectives</h3>
                        {bonusMissions.map((mission) => (
                            <div key={mission.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {mission.type === 'CHECKPOINT' && <MapPin size={16} className="text-amber-400" />}
                                    {mission.type === 'TIME_BONUS' && <Timer size={16} className="text-sky-400" />}
                                    {mission.type === 'SPEED_CHALLENGE' && <Zap size={16} className="text-purple-400" />}
                                    <span className="text-sm text-slate-300">{mission.description}</span>
                                </div>
                                {mission.completed ? (
                                    <CheckCircle size={18} className="text-emerald-400" />
                                ) : (
                                    <XCircle size={18} className="text-red-500/50" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Play Again Button */}
                <button
                    onClick={resetGame}
                    className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-3 uppercase tracking-wide"
                >
                    <RotateCcw size={20} />
                    Return to Menu
                </button>
            </div>
        </div>
    );
};
