import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { Locate, Navigation, Activity } from 'lucide-react';

export const GameHUD: React.FC = () => {
    const userPosition = useGameStore((state) => state.userPosition);

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

    return (
        <div className="absolute inset-0 pointer-events-none p-4 pb-[calc(2rem+env(safe-area-inset-bottom))] flex flex-col justify-end">
            {/* Top Right Status (Satellite/Accuracy) */}
            <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
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

            {/* Debug Info (Optional/Dev only) */}
            <div className="absolute top-20 right-4 text-xs font-mono text-slate-500 bg-black/50 p-2 rounded">
                <div>LAT: {userPosition?.latitude?.toFixed(5) || '--'}</div>
                <div>LNG: {userPosition?.longitude?.toFixed(5) || '--'}</div>
            </div>
        </div>
    );
};
