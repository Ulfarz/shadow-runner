import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { Locate, Activity, Clock, Ghost, MapPin, Zap, Target } from 'lucide-react';

export const GameHUD: React.FC = () => {
    const userPosition = useGameStore((state) => state.userPosition);
    const gameMode = useGameStore((state) => state.gameMode);
    const gameStartTime = useGameStore((state) => state.gameStartTime);
    const currentShadowSpeed = useGameStore((state) => state.currentShadowSpeed);
    const distanceToExtraction = useGameStore((state) => state.distanceToExtraction);
    const checkpointReached = useGameStore((state) => state.checkpointReached);
    const bonusMissions = useGameStore((state) => state.bonusMissions);
    const status = useGameStore((state) => state.status);

    // Helper to format speed from m/s to km/h
    const formatSpeed = (speed: number | null) => {
        if (speed === null) return '--';
        return (speed * 3.6).toFixed(1);
    };

    // Calculate elapsed time
    const [elapsedTime, setElapsedTime] = React.useState(0);
    React.useEffect(() => {
        if (status !== 'ACTIVE' || !gameStartTime) return;
        const interval = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - gameStartTime) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [status, gameStartTime]);

    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;

    // Speed challenge progress
    const speedMission = bonusMissions.find(m => m.id === 'speed_challenge');
    const speedProgress = speedMission?.progress || 0;
    const speedDuration = speedMission?.duration || 30;

    return (
        <div className="absolute inset-0 pointer-events-none p-2 sm:p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex flex-col justify-between">
            {/* Top Section */}
            <div className="flex justify-between items-start gap-2">
                {/* Left: Timer (Extraction mode only) */}
                {gameMode === 'EXTRACTION' && status === 'ACTIVE' ? (
                    <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-700 backdrop-blur-sm">
                        <Clock size={16} className="text-amber-400 shrink-0" />
                        <span className="font-mono text-lg sm:text-xl font-bold">
                            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </span>
                    </div>
                ) : (
                    <div />
                )}

                {/* Right: GPS Status - Compact on mobile */}
                <div className="flex items-center gap-1.5 bg-slate-900/80 text-emerald-400 px-2 py-1 rounded border border-emerald-500/30 backdrop-blur-sm">
                    <Locate size={14} className={userPosition ? 'animate-pulse shrink-0' : 'opacity-50 shrink-0'} />
                    <span className="font-mono text-xs font-bold hidden sm:inline">
                        {userPosition ? 'GPS OK' : 'GPS...'}
                    </span>
                </div>
            </div>

            {/* Middle Section: Bonus Objectives (Extraction mode) - Compact cards */}
            {gameMode === 'EXTRACTION' && status === 'ACTIVE' && (
                <div className="absolute top-12 sm:top-14 left-2 sm:left-4 right-2 sm:right-auto flex flex-col gap-1.5 sm:gap-2 max-w-[200px] sm:max-w-none">
                    {/* Distance to Extraction */}
                    <div className="flex items-center gap-1.5 bg-slate-900/90 px-2 py-1 rounded border border-emerald-500/30 backdrop-blur-sm">
                        <Target size={14} className="text-emerald-400 shrink-0" />
                        <span className="font-mono text-xs text-slate-300 truncate">
                            <span className="text-emerald-400 font-bold">{distanceToExtraction ? Math.round(distanceToExtraction) : '--'}m</span>
                        </span>
                    </div>

                    {/* Checkpoint Status */}
                    <div className={`flex items-center gap-1.5 bg-slate-900/90 px-2 py-1 rounded border backdrop-blur-sm ${checkpointReached ? 'border-emerald-500/50' : 'border-amber-500/30'}`}>
                        <MapPin size={14} className={`shrink-0 ${checkpointReached ? 'text-emerald-400' : 'text-amber-400'}`} />
                        <span className={`font-mono text-xs truncate ${checkpointReached ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {checkpointReached ? '✓ Checkpoint' : 'Checkpoint'}
                        </span>
                    </div>

                    {/* Speed Challenge */}
                    {speedMission && !speedMission.completed && (
                        <div className="flex items-center gap-1.5 bg-slate-900/90 px-2 py-1 rounded border border-purple-500/30 backdrop-blur-sm">
                            <Zap size={14} className="text-purple-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="w-16 sm:w-20 h-1 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-purple-500 transition-all duration-200"
                                        style={{ width: `${Math.min((speedProgress / speedDuration) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                            <span className="font-mono text-[10px] text-purple-400">{Math.round(speedProgress)}s</span>
                        </div>
                    )}
                    {speedMission?.completed && (
                        <div className="flex items-center gap-1.5 bg-slate-900/90 px-2 py-1 rounded border border-emerald-500/50 backdrop-blur-sm">
                            <Zap size={14} className="text-emerald-400 shrink-0" />
                            <span className="font-mono text-xs text-emerald-400">✓ Speed</span>
                        </div>
                    )}

                    {/* Shadow Speed */}
                    <div className="flex items-center gap-1.5 bg-slate-900/90 px-2 py-1 rounded border border-red-500/30 backdrop-blur-sm">
                        <Ghost size={14} className="text-red-400 shrink-0" />
                        <span className="font-mono text-xs text-red-400 font-bold">
                            {currentShadowSpeed.toFixed(0)} km/h
                        </span>
                    </div>
                </div>
            )}

            {/* Bottom Center Stats - Compact on mobile */}
            <div className="w-full flex justify-center gap-2 sm:gap-4">
                {/* SPEED */}
                <div className="flex flex-col items-center bg-slate-900/90 px-3 py-2 sm:p-3 rounded-lg border border-slate-700 backdrop-blur-md min-w-[70px] sm:min-w-[90px]">
                    <div className="flex items-center gap-1 text-slate-400 mb-0.5">
                        <Activity size={12} className="sm:w-4 sm:h-4" />
                        <span className="text-[10px] sm:text-xs font-bold tracking-wider">SPEED</span>
                    </div>
                    <div className="flex items-baseline gap-0.5">
                        <span className="text-xl sm:text-2xl font-black text-white font-mono">
                            {formatSpeed(userPosition?.speed || 0)}
                        </span>
                    </div>
                </div>

                {/* Distance (instead of heading for mobile utility) */}
                {gameMode === 'EXTRACTION' && distanceToExtraction && (
                    <div className="flex flex-col items-center bg-slate-900/90 px-3 py-2 sm:p-3 rounded-lg border border-emerald-700/50 backdrop-blur-md min-w-[70px] sm:min-w-[90px]">
                        <div className="flex items-center gap-1 text-emerald-400 mb-0.5">
                            <Target size={12} className="sm:w-4 sm:h-4" />
                            <span className="text-[10px] sm:text-xs font-bold tracking-wider">DIST</span>
                        </div>
                        <div className="flex items-baseline gap-0.5">
                            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                                {distanceToExtraction > 1000
                                    ? (distanceToExtraction / 1000).toFixed(1)
                                    : Math.round(distanceToExtraction)}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold">
                                {distanceToExtraction > 1000 ? 'km' : 'm'}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
