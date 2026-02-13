/**
 * Storage Service for Safe Journal
 * Uses Dexie.js (IndexedDB wrapper) for local encrypted storage
 */

import Dexie, { type EntityTable } from 'dexie';

// Database schema types
export interface AppSettings {
    id: string;
    salt: string; // hex encoded
    verificationBlock: string;
    language: string;
    theme?: string;
    createdAt: number;
    // Extended settings
    appLock?: boolean;
    autoLockMinutes?: number | null;
    offlineMode?: boolean;
    autoDeleteDays?: number | null;
    panicButtonEnabled?: boolean;
}

export interface JournalEntry {
    id: string;
    date: number; // timestamp
    encryptedContent: string; // encrypted JSON { title, text, tags }
    intensity: number; // 1-10, stored unencrypted for statistics
    hasAudio: boolean;
    createdAt: number;
    updatedAt: number;
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
    }
}

// Singleton database instance
export const db = new SafeJournalDB();

// Settings operations
export async function getSettings(): Promise<AppSettings | undefined> {
    return db.settings.get('main');
}

export async function saveSettings(settings: Omit<AppSettings, 'id'>): Promise<void> {
    await db.settings.put({ ...settings, id: 'main' });
}

export async function updateLanguage(language: string): Promise<void> {
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
