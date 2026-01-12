import React, { useState } from 'react';
import { useGameStore, GameMode } from '../store/useGameStore';
import { Target, ShieldAlert, Play, Map as MapIcon, ChevronLeft, Info, X, Footprints, Ghost, Zap, Clock, FileText, AlertTriangle, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const MainMenu: React.FC = () => {
    const { setGameMode, setStatus, targetDistance, setTargetDistance, userPosition, gpsError } = useGameStore();
    const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
    const [inputValue, setInputValue] = useState(targetDistance.toString());
    const [showNotice, setShowNotice] = useState(false);
    const { t, i18n } = useTranslation();

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

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'fr' : 'en';
        i18n.changeLanguage(newLang);
    };

    // Notice Modal
    const NoticeModal = () => (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4 animate-in fade-in duration-200">
            <div className="max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl relative">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <Info className="text-cyan-400" size={24} />
                        <h2 className="text-xl font-black uppercase tracking-wider text-white">
                            <span className="text-cyan-400">{t('menu.briefing_protocol')}</span>
                        </h2>
                    </div>
                    <button
                        onClick={() => setShowNotice(false)}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">

                    {/* Concept */}
                    <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800">
                        <h3 className="flex items-center gap-2 text-sm font-bold uppercase text-slate-400 mb-3 tracking-wide">
                            <Footprints size={16} /> {t('menu.concept_title')}
                        </h3>
                        <p className="text-slate-300 leading-relaxed text-sm">
                            {t('menu.concept_desc')}
                        </p>
                    </div>

                    {/* Modes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-slate-950/50 rounded-xl p-4 border border-emerald-900/30 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Target size={64} className="text-emerald-500" />
                            </div>
                            <h3 className="text-emerald-400 font-bold uppercase mb-2 flex items-center gap-2">
                                <MapIcon size={16} /> {t('menu.extraction_title')}
                            </h3>
                            <p className="text-slate-400 text-xs leading-relaxed">
                                {t('menu.extraction_desc')}
                            </p>
                        </div>

                        <div className="bg-slate-950/50 rounded-xl p-4 border border-red-900/30 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Ghost size={64} className="text-red-500" />
                            </div>
                            <h3 className="text-red-400 font-bold uppercase mb-2 flex items-center gap-2">
                                <ShieldAlert size={16} /> {t('menu.survival_title')}
                            </h3>
                            <p className="text-slate-400 text-xs leading-relaxed">
                                {t('menu.survival_desc')}
                            </p>
                        </div>
                    </div>

                    {/* HUD Guide */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wide border-b border-slate-800 pb-2">
                            {t('menu.hud_title')}
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-lg">
                                <div className="bg-amber-500/10 p-1.5 rounded text-amber-400"><Clock size={14} /></div>
                                <span className="text-slate-300">{t('menu.hud_timer')}</span>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-lg">
                                <div className="bg-emerald-500/10 p-1.5 rounded text-emerald-400"><Target size={14} /></div>
                                <span className="text-slate-300">{t('menu.hud_target')}</span>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-lg">
                                <div className="bg-purple-500/10 p-1.5 rounded text-purple-400"><Zap size={14} /></div>
                                <span className="text-slate-300">{t('menu.hud_challenge')}</span>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-lg">
                                <div className="bg-red-500/10 p-1.5 rounded text-red-400"><Ghost size={14} /></div>
                                <span className="text-slate-300">{t('menu.hud_shadow')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="bg-red-950/20 border border-red-900/50 p-4 rounded-xl flex gap-3 items-start">
                        <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={20} />
                        <div>
                            <h4 className="text-red-400 font-bold text-sm uppercase mb-1">{t('menu.warning_title')}</h4>
                            <p className="text-red-200/60 text-xs">
                                {t('menu.warning_desc')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 border-t border-slate-800 bg-slate-900/50">
                    <button
                        onClick={() => setShowNotice(false)}
                        className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(8,145,178,0.4)] uppercase tracking-wide text-sm"
                    >
                        {t('menu.btn_understand')}
                    </button>
                </div>
            </div>
        </div>
    );

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
                            {selectedMode === 'EXTRACTION' ? t('config.mission_config') : t('config.survival_config')}
                        </h2>
                        <p className="text-slate-400 font-mono text-xs sm:text-sm mt-1">
                            {selectedMode === 'EXTRACTION' ? 'SET_EXTRACTION_PARAMETERS' : 'SET_SURVIVAL_PARAMETERS'}
                        </p>
                    </div>

                    <div className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
                        <label className={`block font-bold font-mono text-xs uppercase mb-2 ${selectedMode === 'EXTRACTION' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {selectedMode === 'EXTRACTION' ? t('config.target_distance') : t('config.ref_distance')} (km)
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
                            {t('config.estimated')}: {Math.round((parseFloat(inputValue) || 0) * 10)}-{Math.round((parseFloat(inputValue) || 0) * 15)} min
                        </p>
                    </div>

                    <div className="flex gap-3 w-full">
                        <button
                            onClick={() => setSelectedMode(null)}
                            className="flex-1 py-3 sm:py-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                        >
                            <ChevronLeft size={18} />
                            {t('config.back')}
                        </button>
                        <button
                            onClick={handleStartGame}
                            className={`flex-[2] py-3 sm:py-4 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 uppercase tracking-wide text-sm sm:text-base ${selectedMode === 'EXTRACTION'
                                ? 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                : 'bg-red-600 hover:bg-red-500 active:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.3)]'
                                }`}
                        >
                            <Play size={18} fill="currentColor" />
                            {t('config.start')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Main menu (mode selection)
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md overflow-y-auto p-4">
            {showNotice && <NoticeModal />}

            <div className="max-w-lg w-full flex flex-col items-center py-6 relative">
                {/* Language Switcher */}
                <button
                    onClick={toggleLanguage}
                    className="absolute top-0 right-0 p-2 text-slate-500 hover:text-white transition-colors"
                >
                    <div className="flex items-center gap-1 text-xs font-mono font-bold">
                        <Globe size={14} />
                        <span>{i18n.language.toUpperCase()}</span>
                    </div>
                </button>

                {/* Logo / Header */}
                <div className="mb-6 sm:mb-10 text-center w-full">
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
                                {t('menu.extraction_title')}
                            </h2>
                            <p className="text-slate-400 text-xs sm:text-sm line-clamp-2">
                                {t('menu.extraction_desc')}
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
                                {t('menu.survival_title')}
                            </h2>
                            <p className="text-slate-400 text-xs sm:text-sm line-clamp-2">
                                {t('menu.survival_desc')}
                            </p>
                        </div>
                        <Play size={20} className="text-red-500 opacity-50 group-hover:opacity-100 shrink-0" fill="currentColor" />
                    </button>
                </div>

                {/* Footer / Briefing Action */}
                <div className="flex flex-col items-center gap-4 w-full">
                    <button
                        onClick={() => setShowNotice(true)}
                        className="flex items-center gap-3 px-8 py-2.5 text-xs font-mono font-bold text-cyan-400 bg-cyan-950/20 border-x border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-900/20 transition-all tracking-[0.3em] uppercase group"
                    >
                        <FileText size={16} className="group-hover:animate-pulse" />
                        {t('menu.btn_briefing')}
                    </button>

                    {/* GPS Status Indicator */}
                    <div className="flex items-center gap-2 transition-all">
                        {userPosition && !gpsError ? (
                            <div className="flex items-center gap-2 text-emerald-500/50 text-[10px] font-mono tracking-widest uppercase">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981] animate-pulse" />
                                {t('menu.gps_locked')}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-red-500 text-[10px] font-mono font-bold tracking-wide animate-pulse">
                                <AlertTriangle size={12} />
                                <span>{t('menu.gps_activate')}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};