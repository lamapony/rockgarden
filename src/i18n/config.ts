/**
 * i18n Configuration for Safe Journal
 * Supports Russian, English, and Danish with lazy loading
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import only default language (en) synchronously
import { enTranslations } from './locales/en';

// Default resources - only English loaded initially
const resources = {
    en: {
        translation: enTranslations,
    },
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
        interpolation: {
            escapeValue: false,
        },
    });

// Lazy load additional languages
export async function loadLanguage(lang: string): Promise<void> {
    if (lang === 'en' || i18n.hasResourceBundle(lang, 'translation')) {
        return; // Already loaded
    }

    try {
        let translations;
        switch (lang) {
            case 'ru':
                translations = (await import('./locales/ru')).ruTranslations;
                break;
            case 'da':
                translations = (await import('./locales/da')).daTranslations;
                break;
            default:
                return; // Unknown language, use fallback
        }
        
        i18n.addResourceBundle(lang, 'translation', translations);
    } catch (error) {
        console.error(`Failed to load language ${lang}:`, error);
    }
}

export default i18n;

// Helper to change language with lazy loading
export async function setLanguage(lang: string): Promise<void> {
    await loadLanguage(lang);
    await i18n.changeLanguage(lang);
}

export function getCurrentLanguage(): string {
    return i18n.language;
}
