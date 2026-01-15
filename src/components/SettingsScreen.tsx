import React from 'react';
import { ArrowLeft, Globe, Info, Code } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SettingsScreenProps {
    onClose: () => void;
    onLogout: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose, onLogout }) => {
    const { t, i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className="absolute inset-0 bg-slate-950 flex flex-col z-50 overflow-hidden">
            {/* Header */}
            <div className="p-4 flex items-center gap-4 bg-slate-900/50 backdrop-blur-md border-b border-slate-800">
                <button
                    onClick={onClose}
                    className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-black italic uppercase tracking-wider text-white">
                    {t('settings.title', 'SETTINGS')}
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* Language Section */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                        <Globe size={14} /> {t('settings.language', 'LANGUAGE')}
                    </h3>
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-2 flex gap-2">
                        <button
                            onClick={() => changeLanguage('en')}
                            className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${i18n.language.startsWith('en')
                                ? 'bg-slate-800 text-white shadow-lg border border-slate-700'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            ENGLISH
                        </button>
                        <button
                            onClick={() => changeLanguage('fr')}
                            className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${i18n.language.startsWith('fr')
                                ? 'bg-slate-800 text-white shadow-lg border border-slate-700'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            FRANÇAIS
                        </button>
                    </div>
                </div>

                {/* About Section */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                        <Info size={14} /> {t('settings.about', 'ABOUT')}
                    </h3>

                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Code size={100} />
                        </div>

                        <div className="relative z-10 space-y-4">
                            <div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                                    {t('settings.version', 'VERSION')}
                                </div>
                                <div className="text-white font-mono font-bold">
                                    v1.0.0 (Alpha Protocol)
                                </div>
                            </div>

                            <div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                                    {t('settings.author', 'DEVELOPER')}
                                </div>
                                <div className="text-emerald-400 font-bold text-lg">
                                    Thomas GUEGUEN
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-800/50">

                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logout Action */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                <button
                    onClick={onLogout}
                    className="w-full py-4 rounded-xl bg-red-950/30 border border-red-900/50 text-red-500 font-bold tracking-widest hover:bg-red-900/30 transition-colors uppercase text-sm"
                >
                    DISCONNECT
                </button>
            </div>

            <div className="p-4 text-center">
                <p className="text-[10px] text-slate-700 font-mono uppercase">
                    ID: {new Date().getFullYear()}-TG-SHDW
                </p>
            </div>
        </div>
    );
};
