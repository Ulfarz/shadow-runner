import React, { useState, useEffect } from 'react';
import { useGameStore, GameMode } from '../store/useGameStore';
import { Target, ShieldAlert, Play, Map as MapIcon, ChevronLeft, Info, X, Footprints, Ghost, Zap, Clock, FileText, AlertTriangle, Globe, LogOut, Radar, User, Settings } from 'lucide-react';
import { ProfileScreen } from './ProfileScreen';
import { SettingsScreen } from './SettingsScreen';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/authService';
import { supabase } from '../services/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

export const MainMenu: React.FC = () => {
    const { setGameMode, setStatus, targetDistance, setTargetDistance, userPosition, gpsError, setBaseShadowSpeed, triggerGpsRetry } = useGameStore();
    const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
    const [movementType, setMovementType] = useState<'WALK' | 'RUN'>('RUN');
    const [inputValue, setInputValue] = useState(targetDistance.toString());
    const [showNotice, setShowNotice] = useState(false);
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const { t } = useTranslation();
    const [showProfile, setShowProfile] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        // Get initial user
        authService.getCurrentUser().then(setUser);

        // Listen for auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const handleGoogleLogin = async () => {
        try {
            await authService.loginWithGoogle();
        } catch (error: any) {
            alert("Erreur connexion : " + error.message);
        }
    };

    const handleLogout = async () => {
        try {
            await authService.signOut();
        } catch (error: any) {
            alert("Erreur déconnexion : " + error.message);
        }
    };

    // AUTH GATE - Security Clearance Check
    if (!user) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md overflow-hidden p-4">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-500/5 rounded-full blur-[100px]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
                </div>

                <div className="max-w-md w-full flex flex-col items-center relative z-10">
                    {/* Logo */}
                    <div className="mb-12 text-center w-full">
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <ShieldAlert size={64} className="text-slate-800 absolute top-0 left-0 animate-pulse" />
                                <ShieldAlert size={64} className="text-white relative z-10" />
                            </div>
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                            Shadow <span className="text-red-600">Runner</span>
                        </h1>
                        <p className="text-slate-500 font-mono text-xs tracking-[0.3em] uppercase">
                            // Tactical Infiltration Protocol
                        </p>
                    </div>

                    {/* Auth Box */}
                    <div className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <LogOut size={120} />
                        </div>

                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-12 h-1 bg-red-500/20 rounded-full mb-6" />

                            <h3 className="text-red-500 font-bold font-mono text-sm uppercase tracking-widest mb-2">
                                Access Restricted
                            </h3>
                            <p className="text-slate-400 text-xs leading-relaxed mb-8 max-w-[250px]">
                                Authentication required for operational deployment. Establish secure connection to proceed.
                            </p>

                            <button
                                onClick={handleGoogleLogin}
                                className="w-full py-4 bg-white hover:bg-slate-200 text-slate-900 font-black rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center gap-3 active:scale-95 group"
                            >
                                <Globe size={20} className="text-blue-600 group-hover:rotate-12 transition-transform" />
                                <span className="tracking-widest text-sm">{t('auth.login_google')}</span>
                            </button>

                            <div className="mt-6 flex items-center gap-2 text-[10px] text-slate-600 font-mono uppercase">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500/50 animate-pulse" />
                                Security Clearance: None
                            </div>
                        </div>
                    </div>

                    {/* Footer ID */}
                    <div className="mt-8 text-center opacity-30">
                        <p className="text-[10px] font-mono text-slate-500 tracking-widest">
                            SYS.ID: {new Date().getFullYear()}-AUTH-GATE
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const handleSelectMode = (mode: GameMode) => {
        setSelectedMode(mode);
        setInputValue(targetDistance.toString());
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);

        const parsed = parseFloat(val);
        if (!isNaN(parsed)) {
            // Validate and clamp distance between 0.5 and 10 km
            const clamped = Math.max(0.5, Math.min(10, parsed));
            setTargetDistance(clamped);
        }
    };

    const handleStartGame = () => {
        if (selectedMode) {
            let parsed = parseFloat(inputValue);
            // Validate: must be between 0.5 and 10 km
            if (isNaN(parsed) || parsed < 0.5 || parsed > 10) {
                parsed = 2.0;
                setInputValue('2.0');
                setTargetDistance(parsed);
            }

            // Set Shadow Speed based on movement type (Walk=5km/h, Run=15km/h)
            setBaseShadowSpeed(movementType === 'WALK' ? 5 : 15);

            setGameMode(selectedMode);
            setStatus('ACTIVE');
        }
    };

    // Old language toggle removed in favor of SettingsScreen
    // const toggleLanguage = ...

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
    if (showProfile) {
        return <ProfileScreen onClose={() => setShowProfile(false)} />;
    }

    if (showSettings) {
        return <SettingsScreen onClose={() => setShowSettings(false)} onLogout={handleLogout} />;
    }
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
                        <div className="flex items-center gap-3 mb-4">
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

                        {/* Movement Type Selector */}
                        <div className="flex gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
                            <button
                                onClick={() => setMovementType('WALK')}
                                className={`flex-1 py-2 rounded-md text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${movementType === 'WALK' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <circle cx="13" cy="5" r="3" />
                                    <path d="M14 9l-2 3.5-2.5 6 2.5 0.5 2-5 2 5 2.5-0.5-2-5.5-0.5-2.5 2.5-3.5-1.5-1.5z" />
                                    <path d="M12 9l-3 3-1.5-1.5 3-3z" />
                                </svg>
                                {t('config.walking')}
                            </button>
                            <button
                                onClick={() => setMovementType('RUN')}
                                className={`flex-1 py-2 rounded-md text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${movementType === 'RUN' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    {/* Head */}
                                    <circle cx="16" cy="5" r="3" />
                                    {/* Body and Limbs */}
                                    <path d="M14 8.5l-4 3.5 1.5 5.5-3.5 1 1.5 2.5 5.5-2 3 4.5 2.5-1-4-5.5 2.5-4-3-1.5z" />
                                    {/* Arms */}
                                    <path d="M14 8.5l-3.5 2-2.5-1.5 1-2 2.5 1 2.5-2z" />
                                    <path d="M16 10l3 2 1.5-1.5-1.5-1.5-2 1z" />
                                    {/* Speed Lines */}
                                    <path d="M2 11h6v2H2zM3 14h5v2H3zM4 17h4v2H4z" opacity="0.8" />
                                </svg>
                                {t('config.running')}
                            </button>
                        </div>

                        <p className="text-slate-500 text-xs mt-3 text-center">
                            {t('config.estimated')}: {Math.round((parseFloat(inputValue) || 0) * (movementType === 'WALK' ? 12 : 5))} min
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
                {/* Language Switcher Removed - Moved to Settings */}

                {/* Logo / Header */}
                <div className="mb-2 text-center w-full">
                    <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter uppercase mb-1 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                        Shadow <span className="text-red-600">Runner</span>
                    </h1>
                    <p className="text-slate-400 font-mono text-[10px] sm:text-xs tracking-widest uppercase italic">
                        // Outrun The Shadow
                    </p>
                </div>

                {/* Welcome Message (Moved Below Logo) */}
                <div className="mb-8 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-700">
                    <span className="text-slate-400 text-xs font-mono tracking-[0.2em] uppercase mb-1">{t('auth.welcome')}</span>
                    <h2 className="text-3xl font-black text-emerald-400 uppercase tracking-wider drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
                        {user?.user_metadata.full_name?.split(' ')[0] || user?.email?.split('@')[0]}
                    </h2>
                </div>

                {/* Mode Grid */}
                <div className="grid grid-cols-1 gap-4 w-full mb-6 sm:mb-8">
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

                {/* Footer Status Bar */}
                <div className="flex items-center justify-between w-full px-2 py-3 bg-slate-950/30 border border-slate-800/50 rounded-xl mb-24 backdrop-blur-sm">
                    {/* Briefing Button */}
                    <button
                        onClick={() => setShowNotice(true)}
                        className="flex items-center gap-2 text-[10px] sm:text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 transition-colors tracking-widest uppercase group px-2"
                    >
                        <FileText size={14} className="group-hover:animate-pulse" />
                        <span>{t('menu.btn_briefing')}</span>
                    </button>

                    {/* Divider */}
                    <div className="h-4 w-px bg-slate-800" />

                    {/* GPS Status */}
                    <div className="flex items-center gap-2 px-2">
                        <button
                            onClick={() => triggerGpsRetry()}
                            className="text-slate-500 hover:text-white transition-colors p-1"
                        >
                            <Radar size={14} className={!userPosition ? "animate-spin-slow" : ""} />
                        </button>

                        {userPosition && !gpsError ? (
                            <div className="flex items-center gap-1.5 text-emerald-500/90 text-[10px] sm:text-xs font-mono tracking-wider uppercase">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981] animate-pulse" />
                                {t('menu.gps_locked')}
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 text-red-500/90 text-[10px] sm:text-xs font-mono font-bold tracking-wider animate-pulse">
                                <AlertTriangle size={12} />
                                {t('menu.gps_activate')}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Menu Bar */}
            <div className="absolute bottom-6 left-6 right-6 z-20">
                <div className="flex gap-4">
                    <button
                        onClick={() => setShowProfile(true)}
                        className="flex-1 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 p-4 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition-transform"
                    >
                        <User className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider">PROFILE</span>
                    </button>

                    <button
                        onClick={() => setShowSettings(true)}
                        className="flex-1 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 p-4 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition-transform"
                    >
                        <Settings className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider">SETTINGS</span>
                    </button>
                </div>
            </div>
        </div >
    );
};
