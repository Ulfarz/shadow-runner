import { useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { supabase } from '../services/supabase';
import { User } from '@supabase/supabase-js';
import { useTranslation } from 'react-i18next'; // Si tu utilises la trad

export const HomeScreen = () => {
    const { t } = useTranslation();
    const [user, setUser] = useState<User | null>(null);

    // Initialisation au chargement
    useEffect(() => {
        authService.initialize();

        // Vérifier si déjà connecté
        authService.getCurrentUser().then(setUser);

        // Écouter les changements d'état (connexion/déconnexion)
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
            // L'utilisateur sera mis à jour automatiquement grâce au listener ci-dessus
        } catch (error: any) {
            alert("Erreur connexion : " + error.message);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            {/* ... Tes autres boutons ... */}

            {/* Affichage conditionnel */}
            {user ? (
                <div className="bg-slate-800 p-4 rounded-xl border border-emerald-500/30">
                    <p className="text-white text-sm">
                        {t('auth.welcome')}, <span className="text-emerald-400 font-bold">{user.user_metadata.full_name}</span>
                    </p>
                    <button
                        onClick={() => authService.signOut()}
                        className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
                    >
                        Se déconnecter
                    </button>
                </div>
            ) : (
                <button
                    onClick={handleGoogleLogin}
                    className="flex items-center gap-3 px-8 py-2.5 text-xs font-mono font-bold text-white bg-blue-600 hover:bg-blue-500 border-x border-slate-800 transition-all tracking-[0.3em] uppercase group rounded-xl"
                >
                    {t('auth.login_google')}
                </button>
            )}
        </div>
    );
};