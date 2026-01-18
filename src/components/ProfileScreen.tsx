import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { statsService, PlayerProfile, GameSession } from '../services/statsService';
import { ArrowLeft, Trophy, Activity, Clock, Map, Calendar } from 'lucide-react';

interface ProfileScreenProps {
    onClose: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onClose }) => {
    const { t, i18n } = useTranslation();
    const [profile, setProfile] = useState<PlayerProfile | null>(null);
    const [history, setHistory] = useState<GameSession[]>([]);
    const [loading, setLoading] = useState(true);

    const isFrench = i18n.language.startsWith('fr');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [profileData, historyData] = await Promise.all([
                    statsService.getPlayerProfile(),
                    statsService.getGameHistory(5)
                ]);
                setProfile(profileData);
                setHistory(historyData);
            } catch (error) {
                console.error("Failed to load profile data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString(isFrench ? 'fr-FR' : 'en-US', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
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
                    {t('menu.profile', 'PROFILE')}
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Profile Overview */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Trophy size={120} />
                    </div>

                    <div className="relative z-10">
                        <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">
                            {t('profile.commander', 'COMMANDER')}
                        </div>
                        <div className="text-3xl font-black text-white mb-6">
                            {profile?.username || 'Runner'}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-1">
                                    <Map size={14} /> {t('profile.total_distance', 'Total Dist.')}
                                </div>
                                <div className="text-2xl font-black text-emerald-400">
                                    {profile?.total_distance_km.toFixed(1) || '0.0'} <span className="text-xs text-emerald-500/50">km</span>
                                </div>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-1">
                                    <Activity size={14} /> {t('profile.games', 'Games')}
                                </div>
                                <div className="text-2xl font-black text-blue-400">
                                    {profile?.total_games_played || 0}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Best Rank */}
                <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                        <div className="text-xs font-bold text-amber-500/70 uppercase tracking-widest mb-1">
                            {t('profile.best_rank', 'BEST RANK')}
                        </div>
                        <div className="text-xs text-amber-200/50">
                            {t('profile.keep_pushing', 'Keep pushing your limits')}
                        </div>
                    </div>
                    <div className="text-4xl font-black text-amber-400 drop-shadow-lg">
                        {profile?.best_rank || '-'}
                    </div>
                </div>

                {/* Recent History */}
                <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 pl-1">
                        {t('profile.recent_operations', 'RECENT OPERATIONS')}
                    </h3>

                    <div className="space-y-3">
                        {loading ? (
                            <div className="text-center py-8 text-slate-600 animate-pulse">
                                Loading data...
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-8 text-slate-600 italic">
                                No mission history found.
                            </div>
                        ) : (
                            history.map((session) => (
                                <div key={session.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center justify-between group hover:border-slate-700 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg border-2 ${session.status === 'VICTORY'
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                            : 'bg-red-500/10 text-red-500 border-red-500/30'
                                            }`}>
                                            {session.rank || '-'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${session.game_mode === 'EXTRACTION' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                                                    }`}>
                                                    {session.game_mode === 'EXTRACTION' ? 'EXT' : 'SURV'}
                                                </span>
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Calendar size={10} /> {formatDate(session.created_at)}
                                                </span>
                                            </div>
                                            <div className="text-sm font-medium text-slate-300 flex items-center gap-3">
                                                <span className="flex items-center gap-1">
                                                    <Map size={12} className="text-slate-500" /> {session.distance_km.toFixed(2)}km
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} className="text-slate-500" /> {formatDuration(session.duration_seconds)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Optional: Add chevron if detail view is implemented later */}
                                    {/* <ChevronRight size={16} className="text-slate-700" /> */}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};
