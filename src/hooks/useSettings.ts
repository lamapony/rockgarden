/**
 * Settings Hook - Manage application settings
 */

import { useState, useEffect, useCallback } from 'react';
import { getSettings, updateSettings, type AppSettings } from '../services/storage';
import type { Theme } from '../services/theme';

export interface UserSettings {
    language: string;
    theme: Theme;
    appLock: boolean;
    autoLockMinutes: number | null; // null = never
    offlineMode: boolean;
    autoDeleteDays: number | null; // null = never
    panicButtonEnabled: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
    language: 'en',
    theme: 'monochrome',
    appLock: true,
    autoLockMinutes: 5,
    offlineMode: true,
    autoDeleteDays: null,
    panicButtonEnabled: true,
};

export function useSettings() {
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load settings on mount
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const stored = await getSettings();
            if (stored) {
                setSettings({
                    language: stored.language || DEFAULT_SETTINGS.language,
                    theme: (stored.theme as Theme) || DEFAULT_SETTINGS.theme,
                    appLock: stored.appLock !== undefined ? stored.appLock : DEFAULT_SETTINGS.appLock,
                    autoLockMinutes: stored.autoLockMinutes !== undefined ? stored.autoLockMinutes : DEFAULT_SETTINGS.autoLockMinutes,
                    offlineMode: stored.offlineMode !== undefined ? stored.offlineMode : DEFAULT_SETTINGS.offlineMode,
                    autoDeleteDays: stored.autoDeleteDays !== undefined ? stored.autoDeleteDays : DEFAULT_SETTINGS.autoDeleteDays,
                    panicButtonEnabled: stored.panicButtonEnabled !== undefined ? stored.panicButtonEnabled : DEFAULT_SETTINGS.panicButtonEnabled,
                });
            }
        } catch (err) {
            console.error('Failed to load settings:', err);
            setError('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const updateSetting = useCallback(<K extends keyof UserSettings>(
        key: K,
        value: UserSettings[K]
    ) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    }, []);

    const saveSetting = useCallback(async <K extends keyof UserSettings>(
        key: K,
        value: UserSettings[K]
    ) => {
        try {
            await updateSettings({ [key]: value });
            updateSetting(key, value);
            return true;
        } catch (err) {
            console.error(`Failed to save setting ${key}:`, err);
            setError(`Failed to save ${key}`);
            return false;
        }
    }, [updateSetting]);

    const toggleSetting = useCallback(async (key: 'appLock' | 'offlineMode' | 'panicButtonEnabled') => {
        const newValue = !settings[key];
        const success = await saveSetting(key, newValue);
        if (success) {
            // Apply offline mode immediately if changed
            if (key === 'offlineMode') {
                console.log('[Settings] Offline mode:', newValue ? 'enabled' : 'disabled');
            }
        }
        return success;
    }, [settings, saveSetting]);

    const setAutoLock = useCallback(async (minutes: number | null) => {
        return await saveSetting('autoLockMinutes', minutes);
    }, [saveSetting]);

    const setAutoDelete = useCallback(async (days: number | null) => {
        return await saveSetting('autoDeleteDays', days);
    }, [saveSetting]);

    const exportData = useCallback(async (): Promise<string | null> => {
        try {
            const { getAllEntries } = await import('../services/storage');
            const entries = await getAllEntries();
            const exportData = {
                version: '1.0',
                exportedAt: Date.now(),
                settings: {
                    language: settings.language,
                    theme: settings.theme,
                },
                entries: entries.map(e => ({
                    id: e.id,
                    date: e.date,
                    intensity: e.intensity,
                    hasAudio: e.hasAudio,
                    // Note: encryptedContent is kept as-is, user needs password to decrypt
                    encryptedContent: e.encryptedContent,
                })),
            };
            return JSON.stringify(exportData, null, 2);
        } catch (err) {
            console.error('Failed to export data:', err);
            setError('Failed to export data');
            return null;
        }
    }, [settings]);

    const downloadExport = useCallback(async () => {
        const data = await exportData();
        if (!data) return false;

        try {
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `safe-journal-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return true;
        } catch (err) {
            console.error('Failed to download export:', err);
            setError('Failed to download backup');
            return false;
        }
    }, [exportData]);

    return {
        settings,
        loading,
        error,
        loadSettings,
        updateSetting,
        saveSetting,
        toggleSetting,
        setAutoLock,
        setAutoDelete,
        exportData,
        downloadExport,
    };
}
