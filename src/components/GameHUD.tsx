import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { Locate, Navigation, Activity, Clock, Ghost, MapPin, Zap, Target } from 'lucide-react';

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

    // Helper to format accuracy
    const formatAccuracy = (accuracy: number | null) => {
        if (accuracy === null) return '--';
        return Math.round(accuracy);
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
        <div className="absolute inset-0 pointer-events-none p-4 pb-[calc(2rem+env(safe-area-inset-bottom))] flex flex-col justify-between">
            {/* Top Section */}
            <div className="flex justify-between items-start">
                {/* Left: Timer (Extraction mode only) */}
                {gameMode === 'EXTRACTION' && status === 'ACTIVE' && (
                    <div className="flex items-center gap-2 bg-slate-900/90 text-white px-4 py-2 rounded-lg border border-slate-700 backdrop-blur-sm">
                        <Clock size={20} className="text-amber-400" />
                        <span className="font-mono text-2xl font-bold">
                            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </span>
                    </div>
                )}
                {!gameMode && <div />}

                {/* Right: GPS Status */}
                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 bg-slate-900/80 text-emerald-400 px-3 py-1 rounded border border-emerald-500/30 backdrop-blur-sm">
                        <Locate size={18} className={userPosition ? 'animate-pulse' : 'opacity-50'} />
                        <span className="font-mono text-sm font-bold">
                            GPS: {userPosition ? 'LOCKED' : 'SEARCHING'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900/80 text-sky-400 px-3 py-1 rounded border border-sky-500/30 backdrop-blur-sm">
                        <span className="font-mono text-xs">ACCURACY</span>
                        <span className="font-mono text-lg font-bold">
                            ±{formatAccuracy(userPosition?.accuracy || null)}m
                        </span>
                    </div>
                </div>
            </div>

            {/* Middle Section: Bonus Objectives (Extraction mode) */}
            {gameMode === 'EXTRACTION' && status === 'ACTIVE' && (
                <div className="absolute top-20 left-4 flex flex-col gap-2">
                    {/* Distance to Extraction */}
                    <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded border border-emerald-500/30 backdrop-blur-sm">
                        <Target size={16} className="text-emerald-400" />
                        <span className="font-mono text-sm text-slate-300">
                            <span className="text-emerald-400 font-bold">{distanceToExtraction ? Math.round(distanceToExtraction) : '--'}m</span> to extraction
                        </span>
                    </div>

                    {/* Checkpoint Status */}
                    <div className={`flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded border backdrop-blur-sm ${checkpointReached ? 'border-emerald-500/50' : 'border-amber-500/30'}`}>
                        <MapPin size={16} className={checkpointReached ? 'text-emerald-400' : 'text-amber-400'} />
                        <span className={`font-mono text-sm ${checkpointReached ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {checkpointReached ? '✓ Checkpoint reached' : 'Pass checkpoint'}
                        </span>
                    </div>

                    {/* Speed Challenge */}
                    {speedMission && !speedMission.completed && (
                        <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded border border-purple-500/30 backdrop-blur-sm">
                            <Zap size={16} className="text-purple-400" />
                            <div className="flex-1">
                                <div className="font-mono text-xs text-slate-400">Speed 8+ km/h</div>
                                <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-purple-500 transition-all duration-200"
                                        style={{ width: `${Math.min((speedProgress / speedDuration) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                            <span className="font-mono text-xs text-purple-400">{Math.round(speedProgress)}s</span>
                        </div>
                    )}
                    {speedMission?.completed && (
                        <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded border border-emerald-500/50 backdrop-blur-sm">
                            <Zap size={16} className="text-emerald-400" />
                            <span className="font-mono text-sm text-emerald-400">✓ Speed challenge</span>
                        </div>
                    )}

                    {/* Shadow Speed */}
                    <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded border border-red-500/30 backdrop-blur-sm">
                        <Ghost size={16} className="text-red-400" />
                        <span className="font-mono text-sm text-slate-300">
                            Shadow: <span className="text-red-400 font-bold">{currentShadowSpeed.toFixed(1)}</span> km/h
                        </span>
                    </div>
                </div>
            )}

            {/* Bottom Center Stats */}
            <div className="w-full flex justify-center gap-4">
                {/* SPEED */}
                <div className="flex flex-col items-center bg-slate-900/90 p-3 rounded-lg border border-slate-700 backdrop-blur-md min-w-[100px]">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <Activity size={16} />
                        <span className="text-xs font-bold tracking-wider">SPEED</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white font-mono">
                            {formatSpeed(userPosition?.speed || 0)}
                        </span>
                        <span className="text-xs text-slate-500 font-bold">KM/H</span>
                    </div>
                </div>

                {/* HEADING */}
                <div className="flex flex-col items-center bg-slate-900/90 p-3 rounded-lg border border-slate-700 backdrop-blur-md min-w-[100px]">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <Navigation size={16} />
                        <span className="text-xs font-bold tracking-wider">HEADING</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white font-mono">
                            {userPosition?.heading ? Math.round(userPosition.heading) : '--'}
                        </span>
                        <span className="text-xs text-slate-500 font-bold">°</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
