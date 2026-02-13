/**
 * Unit tests for Storage Service
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
    getSettings,
    saveSettings,
    updateLanguage,
    getAllEntries,
    getEntry,
    saveEntry,
    deleteEntry,
    getAudioNotes,
    saveAudioNote,
    deleteAudioNote,
    getStatistics,
    deleteAllData,
    isInitialized,
    type AppSettings,
    type JournalEntry,
    type AudioNote,
} from './storage';

describe('Storage Service', () => {
    // Clean up before each test
    beforeEach(async () => {
        await deleteAllData();
    });

    describe('Settings', () => {
        it('should return undefined when no settings exist', async () => {
            const settings = await getSettings();
            expect(settings).toBeUndefined();
        });

        it('should save and retrieve settings', async () => {
            const settings: Omit<AppSettings, 'id'> = {
                salt: 'abcdef1234567890',
                verificationBlock: 'encrypted-block-here',
                language: 'en',
                createdAt: Date.now(),
            };

            await saveSettings(settings);
            const retrieved = await getSettings();

            expect(retrieved).toBeDefined();
            expect(retrieved?.salt).toBe(settings.salt);
            expect(retrieved?.verificationBlock).toBe(settings.verificationBlock);
            expect(retrieved?.language).toBe(settings.language);
            expect(retrieved?.createdAt).toBe(settings.createdAt);
            expect(retrieved?.id).toBe('main');
        });

        it('should update settings', async () => {
            const settings: Omit<AppSettings, 'id'> = {
                salt: 'abcdef1234567890',
                verificationBlock: 'encrypted-block-here',
                language: 'en',
                createdAt: Date.now(),
            };

            await saveSettings(settings);
            await saveSettings({ ...settings, language: 'ru' });

            const retrieved = await getSettings();
            expect(retrieved?.language).toBe('ru');
        });

        it('should update language only', async () => {
            const settings: Omit<AppSettings, 'id'> = {
                salt: 'abcdef1234567890',
                verificationBlock: 'encrypted-block-here',
                language: 'en',
                createdAt: Date.now(),
            };

            await saveSettings(settings);
            await updateLanguage('da');

            const retrieved = await getSettings();
            expect(retrieved?.language).toBe('da');
            expect(retrieved?.salt).toBe(settings.salt); // Other fields unchanged
        });
    });

    describe('Entries', () => {
        const createMockEntry = (id: string, overrides?: Partial<JournalEntry>): JournalEntry => ({
            id,
            date: Date.now(),
            encryptedContent: 'encrypted-content-' + id,
            intensity: 5,
            hasAudio: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            ...overrides,
        });

        it('should return empty array when no entries exist', async () => {
            const entries = await getAllEntries();
            expect(entries).toEqual([]);
        });

        it('should save and retrieve an entry', async () => {
            const entry = createMockEntry('entry-1');
            await saveEntry(entry);

            const retrieved = await getEntry('entry-1');
            expect(retrieved).toEqual(entry);
        });

        it('should return all entries sorted by date descending', async () => {
            const entry1 = createMockEntry('entry-1', { date: 1000 });
            const entry2 = createMockEntry('entry-2', { date: 3000 });
            const entry3 = createMockEntry('entry-3', { date: 2000 });

            await saveEntry(entry1);
            await saveEntry(entry2);
            await saveEntry(entry3);

            const entries = await getAllEntries();
            expect(entries).toHaveLength(3);
            expect(entries[0].id).toBe('entry-2'); // Most recent first
            expect(entries[1].id).toBe('entry-3');
            expect(entries[2].id).toBe('entry-1');
        });

        it('should update an existing entry', async () => {
            const entry = createMockEntry('entry-1', { intensity: 3 });
            await saveEntry(entry);

            const updated = { ...entry, intensity: 8, updatedAt: Date.now() + 1000 };
            await saveEntry(updated);

            const retrieved = await getEntry('entry-1');
            expect(retrieved?.intensity).toBe(8);
        });

        it('should delete an entry', async () => {
            const entry = createMockEntry('entry-1');
            await saveEntry(entry);

            await deleteEntry('entry-1');

            const retrieved = await getEntry('entry-1');
            expect(retrieved).toBeUndefined();
        });

        it('should delete associated audio notes when deleting entry', async () => {
            const entry = createMockEntry('entry-1');
            await saveEntry(entry);

            const audioNote: AudioNote = {
                id: 'audio-1',
                entryId: 'entry-1',
                encryptedData: 'encrypted-audio',
                duration: 60,
                createdAt: Date.now(),
            };
            await saveAudioNote(audioNote);

            await deleteEntry('entry-1');

            const audioNotes = await getAudioNotes('entry-1');
            expect(audioNotes).toHaveLength(0);
        });

        it('should return undefined for non-existent entry', async () => {
            const retrieved = await getEntry('non-existent');
            expect(retrieved).toBeUndefined();
        });
    });

    describe('Audio Notes', () => {
        const createMockAudioNote = (id: string, entryId: string): AudioNote => ({
            id,
            entryId,
            encryptedData: 'encrypted-audio-' + id,
            duration: 60,
            createdAt: Date.now(),
        });

        it('should save and retrieve audio notes for an entry', async () => {
            const note1 = createMockAudioNote('audio-1', 'entry-1');
            const note2 = createMockAudioNote('audio-2', 'entry-1');

            await saveAudioNote(note1);
            await saveAudioNote(note2);

            const notes = await getAudioNotes('entry-1');
            expect(notes).toHaveLength(2);
            expect(notes.map(n => n.id)).toContain('audio-1');
            expect(notes.map(n => n.id)).toContain('audio-2');
        });

        it('should only return audio notes for specified entry', async () => {
            const note1 = createMockAudioNote('audio-1', 'entry-1');
            const note2 = createMockAudioNote('audio-2', 'entry-2');

            await saveAudioNote(note1);
            await saveAudioNote(note2);

            const notes = await getAudioNotes('entry-1');
            expect(notes).toHaveLength(1);
            expect(notes[0].id).toBe('audio-1');
        });

        it('should delete a specific audio note', async () => {
            const note = createMockAudioNote('audio-1', 'entry-1');
            await saveAudioNote(note);

            await deleteAudioNote('audio-1');

            const notes = await getAudioNotes('entry-1');
            expect(notes).toHaveLength(0);
        });
    });

    describe('Statistics', () => {
        it('should return zero statistics when no entries exist', async () => {
            const stats = await getStatistics();
            expect(stats).toEqual({
                totalEntries: 0,
                averageIntensity: 0,
                entriesWithAudio: 0,
            });
        });

        it('should calculate correct statistics', async () => {
            const entries: JournalEntry[] = [
                {
                    id: 'entry-1',
                    date: Date.now(),
                    encryptedContent: 'content-1',
                    intensity: 3,
                    hasAudio: false,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                },
                {
                    id: 'entry-2',
                    date: Date.now(),
                    encryptedContent: 'content-2',
                    intensity: 7,
                    hasAudio: true,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                },
                {
                    id: 'entry-3',
                    date: Date.now(),
                    encryptedContent: 'content-3',
                    intensity: 8,
                    hasAudio: true,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                },
            ];

            for (const entry of entries) {
                await saveEntry(entry);
            }

            const stats = await getStatistics();
            expect(stats.totalEntries).toBe(3);
            expect(stats.averageIntensity).toBe(6); // (3 + 7 + 8) / 3 = 6
            expect(stats.entriesWithAudio).toBe(2);
        });

        it('should round average intensity to 1 decimal place', async () => {
            const entries: JournalEntry[] = [
                {
                    id: 'entry-1',
                    date: Date.now(),
                    encryptedContent: 'content-1',
                    intensity: 3,
                    hasAudio: false,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                },
                {
                    id: 'entry-2',
                    date: Date.now(),
                    encryptedContent: 'content-2',
                    intensity: 4,
                    hasAudio: false,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                },
            ];

            for (const entry of entries) {
                await saveEntry(entry);
            }

            const stats = await getStatistics();
            expect(stats.averageIntensity).toBe(3.5);
        });
    });

    describe('Initialization', () => {
        it('should return false when app is not initialized', async () => {
            const initialized = await isInitialized();
            expect(initialized).toBe(false);
        });

        it('should return true after settings are saved', async () => {
            const settings: Omit<AppSettings, 'id'> = {
                salt: 'abcdef1234567890',
                verificationBlock: 'encrypted-block',
                language: 'en',
                createdAt: Date.now(),
            };

            await saveSettings(settings);
            const initialized = await isInitialized();
            expect(initialized).toBe(true);
        });
    });

    describe('Panic Button - Delete All Data', () => {
        it('should delete all entries', async () => {
            const entry: JournalEntry = {
                id: 'entry-1',
                date: Date.now(),
                encryptedContent: 'content',
                intensity: 5,
                hasAudio: false,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            await saveEntry(entry);

            await deleteAllData();

            const entries = await getAllEntries();
            expect(entries).toHaveLength(0);
        });

        it('should delete all audio notes', async () => {
            const note: AudioNote = {
                id: 'audio-1',
                entryId: 'entry-1',
                encryptedData: 'encrypted',
                duration: 60,
                createdAt: Date.now(),
            };
            await saveAudioNote(note);

            await deleteAllData();

            const notes = await getAudioNotes('entry-1');
            expect(notes).toHaveLength(0);
        });

        it('should delete all settings', async () => {
            const settings: Omit<AppSettings, 'id'> = {
                salt: 'abcdef',
                verificationBlock: 'block',
                language: 'en',
                createdAt: Date.now(),
            };
            await saveSettings(settings);

            await deleteAllData();

            const retrieved = await getSettings();
            expect(retrieved).toBeUndefined();
        });
    });

    describe('Extended Settings', () => {
        it('should save and retrieve appLock setting', async () => {
            const settings: Omit<AppSettings, 'id'> = {
                salt: 'abcdef',
                verificationBlock: 'block',
                language: 'en',
                createdAt: Date.now(),
                appLock: false,
            };

            await saveSettings(settings);
            const retrieved = await getSettings();

            expect(retrieved?.appLock).toBe(false);
        });

        it('should save and retrieve autoLockMinutes setting', async () => {
            const settings: Omit<AppSettings, 'id'> = {
                salt: 'abcdef',
                verificationBlock: 'block',
                language: 'en',
                createdAt: Date.now(),
                autoLockMinutes: 15,
            };

            await saveSettings(settings);
            const retrieved = await getSettings();

            expect(retrieved?.autoLockMinutes).toBe(15);
        });

        it('should save autoLockMinutes as null', async () => {
            const settings: Omit<AppSettings, 'id'> = {
                salt: 'abcdef',
                verificationBlock: 'block',
                language: 'en',
                createdAt: Date.now(),
                autoLockMinutes: null,
            };

            await saveSettings(settings);
            const retrieved = await getSettings();

            expect(retrieved?.autoLockMinutes).toBeNull();
        });

        it('should save and retrieve offlineMode setting', async () => {
            const settings: Omit<AppSettings, 'id'> = {
                salt: 'abcdef',
                verificationBlock: 'block',
                language: 'en',
                createdAt: Date.now(),
                offlineMode: false,
            };

            await saveSettings(settings);
            const retrieved = await getSettings();

            expect(retrieved?.offlineMode).toBe(false);
        });

        it('should save and retrieve autoDeleteDays setting', async () => {
            const settings: Omit<AppSettings, 'id'> = {
                salt: 'abcdef',
                verificationBlock: 'block',
                language: 'en',
                createdAt: Date.now(),
                autoDeleteDays: 90,
            };

            await saveSettings(settings);
            const retrieved = await getSettings();

            expect(retrieved?.autoDeleteDays).toBe(90);
        });

        it('should save autoDeleteDays as null', async () => {
            const settings: Omit<AppSettings, 'id'> = {
                salt: 'abcdef',
                verificationBlock: 'block',
                language: 'en',
                createdAt: Date.now(),
                autoDeleteDays: null,
            };

            await saveSettings(settings);
            const retrieved = await getSettings();

            expect(retrieved?.autoDeleteDays).toBeNull();
        });

        it('should save and retrieve panicButtonEnabled setting', async () => {
            const settings: Omit<AppSettings, 'id'> = {
                salt: 'abcdef',
                verificationBlock: 'block',
                language: 'en',
                createdAt: Date.now(),
                panicButtonEnabled: false,
            };

            await saveSettings(settings);
            const retrieved = await getSettings();

            expect(retrieved?.panicButtonEnabled).toBe(false);
        });

        it('should save all extended settings together', async () => {
            const settings: Omit<AppSettings, 'id'> = {
                salt: 'abcdef',
                verificationBlock: 'block',
                language: 'ru',
                theme: 'warm',
                createdAt: Date.now(),
                appLock: false,
                autoLockMinutes: 1,
                offlineMode: true,
                autoDeleteDays: 30,
                panicButtonEnabled: true,
            };

            await saveSettings(settings);
            const retrieved = await getSettings();

            expect(retrieved).toMatchObject(settings);
        });

        it('should update individual extended settings', async () => {
            const settings: Omit<AppSettings, 'id'> = {
                salt: 'abcdef',
                verificationBlock: 'block',
                language: 'en',
                createdAt: Date.now(),
                appLock: true,
                autoLockMinutes: 5,
            };

            await saveSettings(settings);
            
            // Update only appLock
            await saveSettings({
                ...settings,
                appLock: false,
            });

            const retrieved = await getSettings();
            expect(retrieved?.appLock).toBe(false);
            expect(retrieved?.autoLockMinutes).toBe(5); // Unchanged
        });
    });
});
