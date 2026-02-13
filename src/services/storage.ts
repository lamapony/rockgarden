/**
 * Storage Service for Safe Journal
 * Uses Dexie.js (IndexedDB wrapper) for local encrypted storage
 */

import Dexie, { type EntityTable } from 'dexie';
import { z } from 'zod';

// Supported languages
type Language = 'en' | 'ru' | 'da';

// Zod schema for runtime validation of AppSettings
export const AppSettingsSchema = z.object({
    id: z.string(),
    salt: z.string().regex(/^[a-f0-9]{32}$/i, 'Salt must be 16 bytes hex encoded'),
    verificationBlock: z.string().min(1, 'Verification block is required'),
    language: z.enum(['en', 'ru', 'da']).default('en'),
    theme: z.enum(['monochrome', 'warm', 'cool', 'forest', 'midnight', 'sepia', 'light', 'dark', 'system']).optional(),
    createdAt: z.number().int().positive(),
    appLock: z.boolean().optional(),
    autoLockMinutes: z.union([z.number().int().positive().nullable(), z.literal(null)]).optional(),
    offlineMode: z.boolean().optional(),
    autoDeleteDays: z.union([z.number().int().positive().nullable(), z.literal(null)]).optional(),
    panicButtonEnabled: z.boolean().optional(),
});

// Type inferred from Zod schema
export type AppSettings = z.infer<typeof AppSettingsSchema>;

// Validation helpers
export function validateSettings(data: unknown): AppSettings {
    return AppSettingsSchema.parse(data);
}

export function validateSettingsSafe(data: unknown): { success: true; data: AppSettings } | { success: false; error: z.ZodError } {
    const result = AppSettingsSchema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
}

export interface JournalEntry {
    id: string;
    date: number; // timestamp
    encryptedContent: string; // encrypted JSON { title, text, tags }
    intensity: number; // 1-10, stored unencrypted for statistics
    hasAudio: boolean;
    createdAt: number;
    updatedAt: number;
    isArchived?: boolean;
}

export interface AudioNote {
    id: string;
    entryId: string;
    encryptedData: string; // encrypted base64 audio
    duration: number; // seconds
    createdAt: number;
}

// Entry content (decrypted)
export interface EntryContent {
    title: string;
    text: string;
    tags: string[];
}

// Database class
class SafeJournalDB extends Dexie {
    settings!: EntityTable<AppSettings, 'id'>;
    entries!: EntityTable<JournalEntry, 'id'>;
    audioNotes!: EntityTable<AudioNote, 'id'>;

    constructor() {
        super('SafeJournalDB');

        this.version(1).stores({
            settings: 'id',
            entries: 'id, date, intensity, createdAt',
            audioNotes: 'id, entryId, createdAt',
        });

        // Migration to version 2: add isArchived index
        this.version(2).stores({
            settings: 'id',
            entries: 'id, date, intensity, createdAt, isArchived',
            audioNotes: 'id, entryId, createdAt',
        }).upgrade(tx => {
            // Initialize isArchived to false for existing entries
            return tx.table('entries').toCollection().modify(entry => {
                if (entry.isArchived === undefined) {
                    entry.isArchived = false;
                }
            });
        });
    }
}

// Singleton database instance
export const db = new SafeJournalDB();

// Settings operations
export async function getSettings(): Promise<AppSettings | undefined> {
    const raw = await db.settings.get('main');
    if (!raw) return undefined;
    
    // Validate on read to catch corrupted data
    const result = validateSettingsSafe(raw);
    if (!result.success) {
        console.error('[Storage] Corrupted settings detected:', result.error.format());
        throw new Error('Settings validation failed: data may be corrupted');
    }
    return result.data;
}

export async function saveSettings(settings: Omit<AppSettings, 'id'>): Promise<void> {
    const validated = validateSettings({ ...settings, id: 'main' });
    await db.settings.put(validated);
}

// Partial update without full validation (for individual field updates)
export async function updateSettings(updates: Partial<Omit<AppSettings, 'id'>>): Promise<void> {
    const existing = await db.settings.get('main');
    if (!existing) {
        throw new Error('Cannot update settings: no existing settings found');
    }
    await db.settings.update('main', updates);
}

export async function updateLanguage(language: Language): Promise<void> {
    await db.settings.update('main', { language });
}

// Entry operations
export async function getAllEntries(): Promise<JournalEntry[]> {
    return db.entries.orderBy('date').reverse().toArray();
}

export async function getEntry(id: string): Promise<JournalEntry | undefined> {
    return db.entries.get(id);
}

export async function saveEntry(entry: JournalEntry): Promise<void> {
    await db.entries.put(entry);
}

export async function deleteEntry(id: string): Promise<void> {
    // Delete associated audio notes first
    await db.audioNotes.where('entryId').equals(id).delete();
    await db.entries.delete(id);
}

// Audio operations
export async function getAudioNotes(entryId: string): Promise<AudioNote[]> {
    return db.audioNotes.where('entryId').equals(entryId).toArray();
}

export async function saveAudioNote(note: AudioNote): Promise<void> {
    await db.audioNotes.put(note);
}

export async function deleteAudioNote(id: string): Promise<void> {
    await db.audioNotes.delete(id);
}

// Statistics
export async function getStatistics(): Promise<{
    totalEntries: number;
    averageIntensity: number;
    entriesWithAudio: number;
}> {
    const entries = await db.entries.toArray();
    const totalEntries = entries.length;

    if (totalEntries === 0) {
        return { totalEntries: 0, averageIntensity: 0, entriesWithAudio: 0 };
    }

    const sumIntensity = entries.reduce((sum, e) => sum + e.intensity, 0);
    const entriesWithAudio = entries.filter((e) => e.hasAudio).length;

    return {
        totalEntries,
        averageIntensity: Math.round((sumIntensity / totalEntries) * 10) / 10,
        entriesWithAudio,
    };
}

// PANIC BUTTON - Delete everything
export async function deleteAllData(): Promise<void> {
    await db.entries.clear();
    await db.audioNotes.clear();
    await db.settings.clear();
}

// Check if app is initialized (has settings)
export async function isInitialized(): Promise<boolean> {
    const settings = await getSettings();
    return settings !== undefined;
}
