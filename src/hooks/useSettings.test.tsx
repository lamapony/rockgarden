import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSettings } from './useSettings';
import { db, saveSettings, getSettings } from '../services/storage';

// Mock theme module
vi.mock('../services/theme', () => ({
    setTheme: vi.fn(),
    getTheme: vi.fn().mockResolvedValue('monochrome'),
    applyTheme: vi.fn(),
}));

// Helper to create valid initial settings
const createInitialSettings = (overrides?: Partial<Parameters<typeof saveSettings>[0]>): Parameters<typeof saveSettings>[0] => ({
    salt: 'abcd1234abcd1234abcd1234abcd1234',
    verificationBlock: 'test-verification-block',
    language: 'en',
    createdAt: Date.now(),
    ...overrides,
});

describe('useSettings hook', () => {
    beforeEach(async () => {
        // Clear database before each test
        await db.settings.clear();
    });

    // Helper to initialize settings for tests that need them
    const initializeSettings = async (overrides?: Partial<Parameters<typeof saveSettings>[0]>) => {
        await saveSettings(createInitialSettings(overrides));
    };

    it('should load default settings when no settings stored', async () => {
        const { result } = renderHook(() => useSettings());

        // Initially loading
        expect(result.current.loading).toBe(true);

        // Wait for loading to complete
        await waitFor(() => expect(result.current.loading).toBe(false));

        // Check default values
        expect(result.current.settings).toEqual({
            language: 'en',
            theme: 'monochrome',
            appLock: true,
            autoLockMinutes: 5,
            offlineMode: true,
            autoDeleteDays: null,
            panicButtonEnabled: true,
        });
    });

    it('should load stored settings from database', async () => {
        // Pre-populate database
        await initializeSettings({
            language: 'ru',
            theme: 'light',
            appLock: false,
            autoLockMinutes: 15,
            offlineMode: false,
            autoDeleteDays: 30,
            panicButtonEnabled: false,
        });

        const { result } = renderHook(() => useSettings());

        await waitFor(() => expect(result.current.loading).toBe(false));

        // Check loaded values
        expect(result.current.settings.language).toBe('ru');
        expect(result.current.settings.theme).toBe('light');
        expect(result.current.settings.appLock).toBe(false);
        expect(result.current.settings.autoLockMinutes).toBe(15);
        expect(result.current.settings.offlineMode).toBe(false);
        expect(result.current.settings.autoDeleteDays).toBe(30);
        expect(result.current.settings.panicButtonEnabled).toBe(false);
    });

    it('should toggle appLock setting', async () => {
        await initializeSettings();
        const { result } = renderHook(() => useSettings());

        await waitFor(() => expect(result.current.loading).toBe(false));

        // Initial value
        expect(result.current.settings.appLock).toBe(true);

        // Toggle
        await act(async () => {
            await result.current.toggleSetting('appLock');
        });

        // Check updated value
        expect(result.current.settings.appLock).toBe(false);

        // Verify in database
        const stored = await getSettings();
        expect(stored?.appLock).toBe(false);
    });

    it('should toggle offlineMode setting', async () => {
        await initializeSettings();
        const { result } = renderHook(() => useSettings());

        await waitFor(() => expect(result.current.loading).toBe(false));

        // Toggle offline mode
        await act(async () => {
            await result.current.toggleSetting('offlineMode');
        });

        expect(result.current.settings.offlineMode).toBe(false);

        const stored = await getSettings();
        expect(stored?.offlineMode).toBe(false);
    });

    it('should toggle panicButtonEnabled setting', async () => {
        await initializeSettings();
        const { result } = renderHook(() => useSettings());

        await waitFor(() => expect(result.current.loading).toBe(false));

        // Toggle panic button
        await act(async () => {
            await result.current.toggleSetting('panicButtonEnabled');
        });

        expect(result.current.settings.panicButtonEnabled).toBe(false);

        const stored = await getSettings();
        expect(stored?.panicButtonEnabled).toBe(false);
    });

    it('should update autoLockMinutes', async () => {
        await initializeSettings();
        const { result } = renderHook(() => useSettings());

        await waitFor(() => expect(result.current.loading).toBe(false));

        // Change auto lock to 15 minutes
        await act(async () => {
            await result.current.setAutoLock(15);
        });

        expect(result.current.settings.autoLockMinutes).toBe(15);

        const stored = await getSettings();
        expect(stored?.autoLockMinutes).toBe(15);
    });

    it('should set autoLockMinutes to null (never)', async () => {
        await initializeSettings();
        const { result } = renderHook(() => useSettings());

        await waitFor(() => expect(result.current.loading).toBe(false));

        // Disable auto lock
        await act(async () => {
            await result.current.setAutoLock(null);
        });

        expect(result.current.settings.autoLockMinutes).toBeNull();

        const stored = await getSettings();
        expect(stored?.autoLockMinutes).toBeNull();
    });

    it('should update autoDeleteDays', async () => {
        await initializeSettings();
        const { result } = renderHook(() => useSettings());

        await waitFor(() => expect(result.current.loading).toBe(false));

        // Set auto delete to 90 days
        await act(async () => {
            await result.current.setAutoDelete(90);
        });

        expect(result.current.settings.autoDeleteDays).toBe(90);

        const stored = await getSettings();
        expect(stored?.autoDeleteDays).toBe(90);
    });

    it('should set autoDeleteDays to null (never)', async () => {
        await initializeSettings();
        const { result } = renderHook(() => useSettings());

        await waitFor(() => expect(result.current.loading).toBe(false));

        // Disable auto delete
        await act(async () => {
            await result.current.setAutoDelete(null);
        });

        expect(result.current.settings.autoDeleteDays).toBeNull();
    });

    it('should save individual setting updates', async () => {
        await initializeSettings();
        const { result } = renderHook(() => useSettings());

        await waitFor(() => expect(result.current.loading).toBe(false));

        // Save language setting
        await act(async () => {
            await result.current.saveSetting('language', 'da');
        });

        expect(result.current.settings.language).toBe('da');

        const stored = await getSettings();
        expect(stored?.language).toBe('da');
    });

    it('should export data with entries', async () => {
        await initializeSettings();
        // Add a test entry to database
        const { saveEntry } = await import('../services/storage');
        await saveEntry({
            id: 'test-entry-1',
            date: Date.now(),
            encryptedContent: 'encrypted-test-content',
            intensity: 7,
            hasAudio: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        
        const { result } = renderHook(() => useSettings());

        await waitFor(() => expect(result.current.loading).toBe(false));

        const exportData = await result.current.exportData();

        expect(exportData).toBeTruthy();
        if (exportData) {
            const parsed = JSON.parse(exportData);
            expect(parsed.version).toBe('1.0');
            expect(parsed.exportedAt).toBeTruthy();
            expect(parsed.settings).toEqual({
                language: result.current.settings.language,
                theme: result.current.settings.theme,
            });
            expect(Array.isArray(parsed.entries)).toBe(true);
            expect(parsed.entries.length).toBeGreaterThan(0);
            expect(parsed.entries[0].id).toBe('test-entry-1');
            expect(parsed.entries[0].intensity).toBe(7);
        }
    });

    it('should maintain settings consistency across multiple updates', async () => {
        await initializeSettings();
        const { result } = renderHook(() => useSettings());

        await waitFor(() => expect(result.current.loading).toBe(false));

        // Multiple updates
        await act(async () => {
            await result.current.toggleSetting('appLock'); // true -> false
            await result.current.setAutoLock(1);
            await result.current.setAutoDelete(365);
        });

        // All changes should be reflected
        expect(result.current.settings.appLock).toBe(false);
        expect(result.current.settings.autoLockMinutes).toBe(1);
        expect(result.current.settings.autoDeleteDays).toBe(365);

        // Verify in database
        const stored = await getSettings();
        expect(stored?.appLock).toBe(false);
        expect(stored?.autoLockMinutes).toBe(1);
        expect(stored?.autoDeleteDays).toBe(365);
    });

    it('should handle errors gracefully', async () => {
        await initializeSettings();
        const { result } = renderHook(() => useSettings());

        await waitFor(() => expect(result.current.loading).toBe(false));

        // Initial state should have no error
        expect(result.current.error).toBeNull();

        // Settings should be accessible even if there were errors
        expect(result.current.settings).toBeTruthy();
    });

    it('should allow reloading settings', async () => {
        const { result } = renderHook(() => useSettings());

        await waitFor(() => expect(result.current.loading).toBe(false));

        // Modify settings directly in DB
        await saveSettings(createInitialSettings({
            language: 'ru',
        }));

        // Reload
        await act(async () => {
            await result.current.loadSettings();
        });

        // Should reflect new values
        expect(result.current.settings.language).toBe('ru');
    });
});
