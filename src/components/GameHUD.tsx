import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { Clock, Ghost, MapPin, Zap, Target, Crosshair } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // Import pour la traduction

export const GameHUD: React.FC = () => {
    const { t } = useTranslation(); // Initialisation du hook de traduction
    const userPosition = useGameStore((state) => state.userPosition);
    const gameMode = useGameStore((state) => state.gameMode);
    const gameStartTime = useGameStore((state) => state.gameStartTime);
    const currentShadowSpeed = useGameStore((state) => state.currentShadowSpeed);
    const distanceToExtraction = useGameStore((state) => state.distanceToExtraction);
    const checkpointReached = useGameStore((state) => state.checkpointReached);
    const bonusMissions = useGameStore((state) => state.bonusMissions);
    const status = useGameStore((state) => state.status);

    const centerOnPlayer = useGameStore((state) => state.centerOnPlayer);
    const centerOnExtraction = useGameStore((state) => state.centerOnExtraction);

    // Format speed from m/s to km/h
    const formatSpeed = (speed: number | null) => {
        if (speed === null) return '0.0';
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

    // Hide HUD when not active
    if (status !== 'ACTIVE') return null;

    return (
        <div className="fixed inset-x-0 top-0 bottom-0 pointer-events-none z-50 flex flex-col">
            {/* TOP BAR - Timer + Distance */}
            <div className="flex flex-col items-end gap-2 p-3 pt-[max(12px,env(safe-area-inset-top))]">
                {/* Timer */}
                <div className="flex items-center gap-2 bg-black/80 px-3 py-2 rounded-full border border-white/10">
                    <Clock size={16} className="text-amber-400" />
                    <span className="font-mono text-white text-lg font-bold tabular-nums">
                        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </span>
                </div>

                {/* Distance to extraction */}
                {gameMode === 'EXTRACTION' && distanceToExtraction && (
                    <div className="flex items-center gap-2 bg-emerald-900/80 px-3 py-2 rounded-full border border-emerald-400/20">
                        <Target size={16} className="text-emerald-400" />
                        <span className="font-mono text-emerald-300 text-lg font-bold tabular-nums">
                            {distanceToExtraction > 1000
                                ? `${(distanceToExtraction / 1000).toFixed(1)}km`
                                : `${Math.round(distanceToExtraction)}m`}
                        </span>
                    </div>
                )}
            </div>

            {/* LEFT SIDE - Objectives */}
            {gameMode === 'EXTRACTION' && (
                <div className="absolute left-3 top-20 flex flex-col gap-2">
                    {/* Checkpoint */}
                    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full text-xs font-mono font-bold ${checkpointReached
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-black/70 text-amber-400'
                        }`}>
                        <MapPin size={12} />
                        <span>{checkpointReached ? '✓' : '○'} {t('hud.checkpoint_abbr')}</span>
                    </div>

                    {/* Speed Challenge */}
                    {speedMission && !speedMission.completed && (
                        <div className="flex items-center gap-2 bg-black/70 px-2.5 py-1.5 rounded-full">
                            <Zap size={12} className="text-purple-400" />
                            <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-purple-500 transition-all"
                                    style={{ width: `${(speedProgress / speedDuration) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                    {speedMission?.completed && (
                        <div className="flex items-center gap-2 bg-emerald-500/90 px-2.5 py-1.5 rounded-full text-xs font-mono font-bold text-white">
                            <Zap size={12} />
                            <span>✓ {t('hud.speed_abbr')}</span>
                        </div>
                    )}

                    {/* Shadow Speed */}
                    <div className="flex items-center gap-2 bg-red-900/80 px-2.5 py-1.5 rounded-full">
                        <Ghost size={12} className="text-red-400" />
                        <span className="text-xs font-mono font-bold text-red-300">
                            {currentShadowSpeed.toFixed(0)}
                        </span>
                    </div>
                </div>
            )}

            {/* BOTTOM BAR - Speed indicator */}
            <div className="mt-auto pb-[max(16px,env(safe-area-inset-bottom))] px-4">
                <div className="flex justify-center items-end gap-3">
                    <div className="bg-black/80 backdrop-blur-sm rounded-2xl px-6 py-3 flex items-center gap-4">
                        <div className="text-center">
                            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wide mb-0.5">
                                {t('hud.your_speed')}
                            </div>
                            <div className="flex items-baseline justify-center gap-1">
                                <span className="text-3xl font-black text-white font-mono tabular-nums">
                                    {formatSpeed(userPosition?.speed || 0)}
                                </span>
                                <span className="text-xs text-slate-500 font-bold">{t('hud.kmh')}</span>
                            </div>
                        </div>

                        {gameMode === 'EXTRACTION' && (
                            <>
                                <div className="w-px h-10 bg-slate-700" />
                                <div className="text-center">
                                    <div className="text-red-400 text-[10px] font-bold uppercase tracking-wide mb-0.5">
                                        {t('hud.shadow')}
                                    </div>
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-3xl font-black text-red-400 font-mono tabular-nums">
                                            {currentShadowSpeed.toFixed(0)}
                                        </span>
                                        <span className="text-xs text-slate-500 font-bold">{t('hud.kmh')}</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Locate Extraction Button (only in Extraction Mode) */}
                    {gameMode === 'EXTRACTION' && (
                        <button
                            onClick={() => centerOnExtraction?.()}
                            className="pointer-events-auto bg-emerald-900/80 backdrop-blur-sm rounded-full p-3 active:bg-emerald-700 transition-colors border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                            aria-label="Locate Extraction"
                        >
                            <Target size={24} className="text-emerald-400" />
                        </button>
                    )}

                    {/* Center on Player Button */}
                    <button
                        onClick={() => centerOnPlayer?.()}
                        className="pointer-events-auto bg-black/80 backdrop-blur-sm rounded-full p-3 active:bg-slate-700 transition-colors"
                        aria-label={t('hud.center_on_player')}
                    >
                        <Crosshair size={24} className="text-white" />
                    </button>
                </div>
            </div>

            {/* ACHIEVEMENT OVERLAY: Checkpoint Reached */}
            {checkpointReached && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                    <div className="flex flex-col items-center animate-in zoom-in-50 duration-500 fade-in fill-mode-forwards">
                        <div className="text-6xl text-amber-500 drop-shadow-[0_0_25px_rgba(245,158,11,0.8)] mb-4 animate-bounce">
                            <MapPin size={80} fill="currentColor" />
                        </div>
                        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter drop-shadow-lg text-center bg-black/50 backdrop-blur-md px-8 py-2 rounded-xl border-y-4 border-amber-500">
                            {t('endgame.checkpoint_reached')}
                        </h2>
                        <div className="mt-2 flex gap-1">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className={`w-3 h-3 rounded-full bg-amber-500 animate-pulse delay-${i * 100}`} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};