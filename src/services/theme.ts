/**
 * Theme Service - Manage color themes
 */

export type Theme = 'monochrome' | 'warm' | 'cool' | 'forest' | 'midnight' | 'sepia';

const THEME_KEY = 'stonewall_theme';

/**
 * Get current theme from storage or default
 */
export async function getTheme(): Promise<Theme> {
    try {
        // Try localStorage first (for immediate UI response)
        const localTheme = localStorage.getItem(THEME_KEY);
        if (localTheme && isValidTheme(localTheme)) {
            applyTheme(localTheme as Theme);
            return localTheme as Theme;
        }

        // Try IndexedDB (encrypted storage)
        const { getSettings } = await import('./storage');
        const settings = await getSettings();
        if (settings?.theme && isValidTheme(settings.theme)) {
            applyTheme(settings.theme as Theme);
            return settings.theme as Theme;
        }
    } catch (e) {
        console.error('Failed to get theme:', e);
    }
    
    return 'monochrome';
}

/**
 * Set and save theme
 */
export async function setTheme(theme: Theme): Promise<void> {
    try {
        // Apply immediately
        applyTheme(theme);
        
        // Save to localStorage for quick access
        localStorage.setItem(THEME_KEY, theme);
        
        // Save to IndexedDB
        const { getSettings, saveSettings } = await import('./storage');
        const settings = await getSettings();
        if (settings) {
            await saveSettings({ ...settings, theme });
        }
    } catch (e) {
        console.error('Failed to set theme:', e);
    }
}

/**
 * Apply theme to document
 */
export function applyTheme(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
    console.log('[Theme] Applied:', theme);
}

/**
 * Check if theme is valid
 */
function isValidTheme(theme: string): theme is Theme {
    return ['monochrome', 'warm', 'cool', 'forest', 'midnight', 'sepia'].includes(theme);
}

/**
 * Initialize theme on app load
 */
export async function initTheme(): Promise<void> {
    const theme = await getTheme();
    applyTheme(theme);
}
