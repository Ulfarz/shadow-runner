import React, { useState } from 'react';
import { useGameStore, GameMode } from '../store/useGameStore';
import { Target, ShieldAlert, Play, Map as MapIcon, ChevronLeft } from 'lucide-react';

export const MainMenu: React.FC = () => {
    const { setGameMode, setStatus, targetDistance, setTargetDistance } = useGameStore();
    const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
    const [inputValue, setInputValue] = useState(targetDistance.toString());

    const handleSelectMode = (mode: GameMode) => {
        setSelectedMode(mode);
        setInputValue(targetDistance.toString());
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);

        const parsed = parseFloat(val);
        if (!isNaN(parsed)) {
            setTargetDistance(parsed);
        }
    };

    const handleStartGame = () => {
        if (selectedMode) {
            let parsed = parseFloat(inputValue);
            if (isNaN(parsed) || parsed <= 0) {
                parsed = 2.0;
                setTargetDistance(parsed);
            }
            setGameMode(selectedMode);
            setStatus('ACTIVE');
        }
    };

    // Config screen (after mode selection)
    if (selectedMode) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md overflow-y-auto p-4">
                <div className="max-w-sm w-full flex flex-col items-center py-6">
                    <div className="mb-6 sm:mb-8 text-center">
                        {selectedMode === 'EXTRACTION' ? (
                            <Target size={48} className="text-emerald-500 mx-auto mb-3 sm:w-16 sm:h-16" />
                        ) : (
                            <ShieldAlert size={48} className="text-red-500 mx-auto mb-3 sm:w-16 sm:h-16" />
                        )}
                        <h2 className={`text-2xl sm:text-3xl font-black uppercase tracking-tighter ${selectedMode === 'EXTRACTION' ? 'text-white' : 'text-red-500'}`}>
                            {selectedMode === 'EXTRACTION' ? 'Mission Config' : 'Survival Config'}
                        </h2>
                        <p className="text-slate-400 font-mono text-xs sm:text-sm mt-1">
                            {selectedMode === 'EXTRACTION' ? 'SET_EXTRACTION_PARAMETERS' : 'SET_SURVIVAL_PARAMETERS'}
                        </p>
                    </div>

                    <div className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
                        <label className={`block font-bold font-mono text-xs uppercase mb-2 ${selectedMode === 'EXTRACTION' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {selectedMode === 'EXTRACTION' ? 'Target Distance' : 'Reference Distance'} (km)
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                min="0.5"
                                max="10"
                                step="0.1"
                                value={inputValue}
                                onChange={handleInputChange}
                                className={`flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 text-white font-mono text-lg sm:text-xl focus:outline-none transition-colors ${selectedMode === 'EXTRACTION' ? 'focus:border-emerald-500' : 'focus:border-red-500'}`}
                            />
                            <span className="text-slate-500 font-mono font-bold text-sm">KM</span>
                        </div>
                        <p className="text-slate-500 text-xs mt-2">
                            Estimated: {Math.round((parseFloat(inputValue) || 0) * 10)}-{Math.round((parseFloat(inputValue) || 0) * 15)} min
                        </p>
                    </div>

                    <div className="flex gap-3 w-full">
                        <button
                            onClick={() => setSelectedMode(null)}
                            className="flex-1 py-3 sm:py-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                        >
                            <ChevronLeft size={18} />
                            BACK
                        </button>
                        <button
                            onClick={handleStartGame}
                            className={`flex-[2] py-3 sm:py-4 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 uppercase tracking-wide text-sm sm:text-base ${selectedMode === 'EXTRACTION'
                                ? 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                : 'bg-red-600 hover:bg-red-500 active:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.3)]'
                                }`}
                        >
                            <Play size={18} fill="currentColor" />
                            {selectedMode === 'EXTRACTION' ? 'Start' : 'Start'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Main menu (mode selection)
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md overflow-y-auto p-4">
            <div className="max-w-lg w-full flex flex-col items-center py-6">
                {/* Logo / Header */}
                <div className="mb-6 sm:mb-10 text-center">
                    <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter uppercase mb-1 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                        Shadow <span className="text-red-600">Runner</span>
                    </h1>
                    <p className="text-slate-400 font-mono text-[10px] sm:text-xs tracking-widest uppercase italic">
                        // Tactical Urban Infiltration Protocol
                    </p>
                </div>

                {/* Mode Grid */}
                <div className="grid grid-cols-1 gap-4 w-full mb-6 sm:mb-10">
                    {/* Extraction Mode */}
                    <button
                        onClick={() => handleSelectMode('EXTRACTION')}
                        className="group relative flex items-center gap-4 p-4 sm:p-6 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden transition-all hover:border-emerald-500/50 active:bg-slate-800 text-left"
                    >
                        <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400 group-hover:bg-emerald-500/20 transition-colors shrink-0">
                            <MapIcon size={28} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg sm:text-xl font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors uppercase">
                                Extraction
                            </h2>
                            <p className="text-slate-400 text-xs sm:text-sm line-clamp-2">
                                Reach the extraction point. Outrun the shadow.
                            </p>
                        </div>
                        <Play size={20} className="text-emerald-500 opacity-50 group-hover:opacity-100 shrink-0" fill="currentColor" />
                    </button>

                    {/* Survival Mode */}
                    <button
                        onClick={() => handleSelectMode('SURVIVAL')}
                        className="group relative flex items-center gap-4 p-4 sm:p-6 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden transition-all hover:border-red-500/50 active:bg-slate-800 text-left"
                    >
                        <div className="p-3 bg-red-500/10 rounded-lg text-red-400 group-hover:bg-red-500/20 transition-colors shrink-0">
                            <ShieldAlert size={28} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg sm:text-xl font-bold text-white mb-1 group-hover:text-red-300 transition-colors uppercase">
                                Survival
                            </h2>
                            <p className="text-slate-400 text-xs sm:text-sm line-clamp-2">
                                No destination. The shadow grows faster over time.
                            </p>
                        </div>
                        <Play size={20} className="text-red-500 opacity-50 group-hover:opacity-100 shrink-0" fill="currentColor" />
                    </button>
                </div>

                {/* Footer / Status */}
                <div className="flex flex-col items-center gap-2 text-slate-500 font-mono text-[10px] sm:text-xs">
                    <div className="flex items-center gap-4 sm:gap-6 px-4 py-1.5 border-x border-slate-800">
                        <span className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            SYSTEM_GO
                        </span>
                        <span className="hidden sm:flex items-center gap-2 uppercase tracking-tighter">
                            GPS: READY
                        </span>
                    </div>
                    <p className="opacity-50">SHADOW_RUNNER v1.0.5</p>
                </div>
            </div>
        </div>
    );
};
