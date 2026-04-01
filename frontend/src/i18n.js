import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en.json';
import roTranslation from './locales/ro.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      ro: {
        translation: roTranslation
      }
    },
    fallbackLng: 'ro', // Forțează limba română ca limbă primară
    debug: false,
    interpolation: {
      escapeValue: false // React already escapes by default
    }
  });

export default i18n;
