import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importation des fichiers de traduction
import translationEN from './locales/en/translation.json';
import translationFR from './locales/fr/translation.json';

const resources = {
    en: {
        translation: translationEN
    },
    fr: {
        translation: translationFR
    }
};

i18n
    .use(LanguageDetector) // Détecte la langue du téléphone/navigateur
    .use(initReactI18next) // Passe i18n à React
    .init({
        resources,
        fallbackLng: 'en', // Langue par défaut si la détection échoue
        interpolation: {
            escapeValue: false // React sécurise déjà contre les XSS
        }
    });

export default i18n;
