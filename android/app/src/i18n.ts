import i18n from 'i18next';
2 import { initReactI18next } from 'react-i18next';
3 import LanguageDetector from 'i18next-browser-languagedetector';
4
5 // Importation des fichiers de traduction (on les créera juste après)
6 import translationEN from './locales/en/translation.json';
7 import translationFR from './locales/fr/translation.json';
8
9 const resources = {
    10   en: {
        11     translation: translationEN
   12   },
13   fr: {
    14     translation: translationFR
    15
}
16 };
17
18 i18n
19   .use(LanguageDetector) // Détecte la langue du téléphone/navigateur
20   .use(initReactI18next) // Passe i18n à React
21   .init({
    22     resources,
    23     fallbackLng: 'en', // Langue par défaut si la détection échoue
    24     interpolation: {
    25       escapeValue: false // React sécurise déjà contre les XSS
   26
}
   27   });
28
29 export default i18n;