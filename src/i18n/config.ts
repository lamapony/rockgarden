/**
 * i18n Configuration for Safe Journal
 * Supports 14 languages including Baltic states (LT, LV, ET) and high-violence regions
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

// Lazy load additional languages (14 total: en, ru, da, lt, lv, et, uk, pl, pt, es, fr, de, it, tr)
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
            // Baltic states (high domestic violence rates in Europe)
            case 'lt':
                translations = (await import('./locales/lt')).ltTranslations;
                break;
            case 'lv':
                translations = (await import('./locales/lv')).lvTranslations;
                break;
            case 'et':
                translations = (await import('./locales/et')).etTranslations;
                break;
            // Other high-violence regions
            case 'uk':
                translations = (await import('./locales/uk')).ukTranslations;
                break;
            case 'pl':
                translations = (await import('./locales/pl')).plTranslations;
                break;
            case 'pt':
                translations = (await import('./locales/pt')).ptTranslations;
                break;
            case 'es':
                translations = (await import('./locales/es')).esTranslations;
                break;
            case 'fr':
                translations = (await import('./locales/fr')).frTranslations;
                break;
            case 'de':
                translations = (await import('./locales/de')).deTranslations;
                break;
            case 'it':
                translations = (await import('./locales/it')).itTranslations;
                break;
            case 'tr':
                translations = (await import('./locales/tr')).trTranslations;
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
