/**
 * i18n Utilities for language detection and management
 */

// Supported languages (must match the list in config.ts)
export const SUPPORTED_LANGUAGES = [
    'en', 'ru', 'da', 'lt', 'lv', 'et', 'uk', 'pl', 'pt', 'es', 'fr', 'de', 'it', 'tr'
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// Language display names
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
    en: 'English',
    ru: 'Русский',
    da: 'Dansk',
    lt: 'Lietuvių',
    lv: 'Latviešu',
    et: 'Eesti',
    uk: 'Українська',
    pl: 'Polski',
    pt: 'Português',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    it: 'Italiano',
    tr: 'Türkçe',
};

/**
 * Get browser language and find the best matching supported language
 * Handles language codes like "en-US", "ru-RU", etc.
 */
export function detectBrowserLanguage(): SupportedLanguage {
    // Get browser languages (array of preferred languages)
    const browserLanguages = navigator.languages || [navigator.language || 'en'];
    
    for (const lang of browserLanguages) {
        // Extract base language code (e.g., "en" from "en-US")
        const baseLang = lang.split('-')[0].toLowerCase();
        
        // Check if this language is supported
        if (SUPPORTED_LANGUAGES.includes(baseLang as SupportedLanguage)) {
            return baseLang as SupportedLanguage;
        }
    }
    
    // Fallback to English
    return 'en';
}

/**
 * Check if a language code is supported
 */
export function isLanguageSupported(lang: string): lang is SupportedLanguage {
    return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
}

/**
 * Get the best matching language from a list of preferences
 */
export function getBestMatchingLanguage(preferences: string[]): SupportedLanguage {
    for (const lang of preferences) {
        const baseLang = lang.split('-')[0].toLowerCase();
        if (isLanguageSupported(baseLang)) {
            return baseLang;
        }
    }
    return 'en';
}
