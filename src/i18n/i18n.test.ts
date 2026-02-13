/**
 * Tests for i18n lazy loading
 */
import { describe, it, expect, beforeEach } from 'vitest';
import i18n, { loadLanguage, setLanguage, getCurrentLanguage } from './config';
import { enTranslations } from './locales/en';

describe('i18n Lazy Loading', () => {
    beforeEach(() => {
        // Reset to English
        i18n.changeLanguage('en');
    });

    it('should have English loaded by default', () => {
        expect(i18n.hasResourceBundle('en', 'translation')).toBe(true);
        expect(i18n.t('appName')).toBe('Safe Journal');
    });

    it('should not have Russian loaded by default', () => {
        expect(i18n.hasResourceBundle('ru', 'translation')).toBe(false);
    });

    it('should not have Danish loaded by default', () => {
        expect(i18n.hasResourceBundle('da', 'translation')).toBe(false);
    });

    it('should lazy load Russian language', async () => {
        expect(i18n.hasResourceBundle('ru', 'translation')).toBe(false);
        
        await loadLanguage('ru');
        
        expect(i18n.hasResourceBundle('ru', 'translation')).toBe(true);
        expect(i18n.getResourceBundle('ru', 'translation').appName).toBe('Безопасный Дневник');
    });

    it('should lazy load Danish language', async () => {
        expect(i18n.hasResourceBundle('da', 'translation')).toBe(false);
        
        await loadLanguage('da');
        
        expect(i18n.hasResourceBundle('da', 'translation')).toBe(true);
        expect(i18n.getResourceBundle('da', 'translation').appName).toBe('Sikker Dagbog');
    });

    it('should change language with lazy loading', async () => {
        await setLanguage('ru');
        
        expect(getCurrentLanguage()).toBe('ru');
        expect(i18n.t('appName')).toBe('Безопасный Дневник');
    });

    it('should handle pluralization in English', () => {
        expect(i18n.t('entryCount_one', { count: 1 })).toBe('1 entry');
        expect(i18n.t('entryCount_other', { count: 5 })).toBe('5 entries');
    });

    it('should handle pluralization after loading Russian', async () => {
        await loadLanguage('ru');
        await i18n.changeLanguage('ru');
        
        // Russian has one/few/many forms
        const bundle = i18n.getResourceBundle('ru', 'translation');
        expect(bundle.entryCount_one).toBe('{{count}} запись');
        expect(bundle.entryCount_few).toBe('{{count}} записи');
        expect(bundle.entryCount_many).toBe('{{count}} записей');
    });

    it('should not reload already loaded language', async () => {
        await loadLanguage('ru');
        const before = i18n.hasResourceBundle('ru', 'translation');
        expect(before).toBe(true);
        
        // Should not throw or fail
        await loadLanguage('ru');
        expect(i18n.hasResourceBundle('ru', 'translation')).toBe(true);
    });

    it('should handle unknown language gracefully', async () => {
        // Should not throw
        await expect(loadLanguage('unknown')).resolves.not.toThrow();
    });
});

describe('English translations', () => {
    it('should have all required translation keys', () => {
        expect(enTranslations.appName).toBeDefined();
        expect(enTranslations.auth).toBeDefined();
        expect(enTranslations.journal).toBeDefined();
        expect(enTranslations.settings).toBeDefined();
        expect(enTranslations.common).toBeDefined();
    });

    it('should have pluralization keys', () => {
        expect(enTranslations.entryCount_one).toBe('{{count}} entry');
        expect(enTranslations.entryCount_other).toBe('{{count}} entries');
    });
});
