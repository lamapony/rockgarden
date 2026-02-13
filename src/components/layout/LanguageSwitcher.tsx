/**
 * Language Switcher - Stonewall Design (Compact)
 */

import { useTranslation } from 'react-i18next';
import { setLanguage } from '../../i18n/config';
import { updateLanguage } from '../../services/storage';
import './LanguageSwitcher.css';

const languages = [
    { code: 'en', label: 'English' },
    { code: 'ru', label: 'Русский' },
    { code: 'da', label: 'Dansk' },
];

export function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const handleLanguageChange = async (lang: string) => {
        setLanguage(lang);
        try {
            await updateLanguage(lang);
        } catch {
            // Settings might not exist yet during setup
        }
    };

    return (
        <select 
            className="lang-select"
            value={i18n.language}
            onChange={(e) => handleLanguageChange(e.target.value)}
        >
            {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                    {lang.label}
                </option>
            ))}
        </select>
    );
}
