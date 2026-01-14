import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { supabase } from './supabase';

export const authService = {
    // Initialisation (à lancer au démarrage de l'app)
    async initialize() {
        try {
            await GoogleAuth.initialize();
        } catch (e) {
            console.log('GoogleAuth déjà initialisé ou non supporté sur cette plateforme');
        }
    },

    // Connexion
    async loginWithGoogle() {
        try {
            console.log('Starting Google Sign-In...');
            // 1. Ouvre la popup Google native sur Android
            const googleUser = await GoogleAuth.signIn();

            console.log('Google Native User:', JSON.stringify(googleUser));

            // 2. Échange le token Google contre une session Supabase
            console.log('Starting Supabase Sign-In...');
            const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: googleUser.authentication.idToken,
            });

            if (error) {
                console.error('Supabase Sign-In Error:', error);
                throw error;
            }

            console.log('Supabase Sign-In Successful:', data.user);

            // 3. (Optionnel) Vérifie si le profil existe, sinon le trigger SQL le créera
            return data.user;

        } catch (error) {
            console.error('Google Sign-In Error:', error);
            throw error;
        }
    },

    // Déconnexion propre
    async signOut() {
        await supabase.auth.signOut();
        await GoogleAuth.signOut();
    },

    // Récupérer l'utilisateur actuel
    async getCurrentUser() {
        const { data } = await supabase.auth.getUser();
        return data.user;
    }
};