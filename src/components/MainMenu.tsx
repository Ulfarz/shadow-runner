import React from 'react';
import { useGameStore, GameMode } from '../store/useGameStore';
import { Target, ShieldAlert, Play, Map as MapIcon } from 'lucide-react';

export const MainMenu: React.FC = () => {
    const { setGameMode, setStatus } = useGameStore();

    const handleSelectMode = (mode: GameMode) => {
        setGameMode(mode);
        setStatus('ACTIVE');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md">
            <div className="max-w-4xl w-full px-6 flex flex-col items-center">
                {/* Logo / Header */}
                <div className="mb-12 text-center">
                    <h1 className="text-6xl font-black text-white tracking-tighter uppercase mb-2 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                        Shadow <span className="text-red-600">Runner</span>
                    </h1>
                    <p className="text-slate-400 font-mono text-sm tracking-widest uppercase italic">
            // Tactical Urban Infiltration Protocol
                    </p>
                </div>

                {/* Mode Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-12">
                    {/* Extraction Mode */}
                    <button
                        onClick={() => handleSelectMode('EXTRACTION')}
                        className="group relative flex flex-col items-start p-8 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden transition-all hover:border-emerald-500/50 hover:bg-slate-800/80 text-left"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Target size={120} />
                        </div>
                        <div className="mb-4 p-3 bg-emerald-500/10 rounded-lg text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                            <MapIcon size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors uppercase">
                            Extraction
                        </h2>
                        <p className="text-slate-400 text-sm font-medium pr-12">
                            Reach the extraction site 2km away. Avoid detection and outrun the shadow pursuing you.
                        </p>
                        <div className="mt-8 flex items-center gap-2 text-emerald-500 font-mono text-xs font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play size={12} fill="currentColor" /> Initialize Protocol
                        </div>
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                    </button>

                    {/* Survival Mode */}
                    <button
                        onClick={() => handleSelectMode('SURVIVAL')}
                        className="group relative flex flex-col items-start p-8 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden transition-all hover:border-red-500/50 hover:bg-slate-800/80 text-left"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <ShieldAlert size={120} />
                        </div>
                        <div className="mb-4 p-3 bg-red-500/10 rounded-lg text-red-400 group-hover:bg-red-500/20 transition-colors">
                            <ShieldAlert size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-red-300 transition-colors uppercase">
                            Survival
                        </h2>
                        <p className="text-slate-400 text-sm font-medium pr-12">
                            No destination. No exit. Survival is the only objective. The shadow grows faster over time.
                        </p>
                        <div className="mt-8 flex items-center gap-2 text-red-500 font-mono text-xs font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play size={12} fill="currentColor" /> Initiate Chaos
                        </div>
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-red-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                    </button>
                </div>

                {/* Footer / Status */}
                <div className="flex flex-col items-center gap-4 text-slate-500 font-mono text-xs">
                    <div className="flex items-center gap-8 px-6 py-2 border-x border-slate-800">
                        <span className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            SYSTEM_GO
                        </span>
                        <span className="flex items-center gap-2 uppercase tracking-tighter">
                            GPS_LAT: SEARCHING...
                        </span>
                    </div>
                    <p className="opacity-50">SHADOW_RUNNER v1.0.4 CORE_PROTOCOL</p>
                </div>
            </div>
        </div>
    );
};
