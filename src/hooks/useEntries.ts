/**
 * Entries hook for Safe Journal
 * Handles CRUD operations with encryption/decryption
 */

import { useState, useCallback } from 'react';
import { encrypt, decrypt } from '../services/crypto';
import {
    getAllEntries,
    getEntry,
    saveEntry,
    deleteEntry as deleteStorageEntry,
    type JournalEntry,
    type EntryContent,
} from '../services/storage';
import { useAuth } from './useAuth';
import type { DecryptedEntry } from '../types';

export function useEntries() {
    const { getKey } = useAuth();
    const [entries, setEntries] = useState<DecryptedEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load all entries
    const loadEntries = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const key = getKey();
            const rawEntries = await getAllEntries();

            const decrypted = await Promise.all(
                rawEntries.map(async (entry) => {
                    try {
                        const contentJson = await decrypt(entry.encryptedContent, key);
                        const content: EntryContent = JSON.parse(contentJson);

                        return {
                            id: entry.id,
                            date: entry.date,
                            content,
                            intensity: entry.intensity,
                            hasAudio: entry.hasAudio,
                            createdAt: entry.createdAt,
                            updatedAt: entry.updatedAt,
                        };
                    } catch (e) {
                        console.error('Failed to decrypt entry:', entry.id, e);
                        return null;
                    }
                })
            );

            setEntries(decrypted.filter((e): e is DecryptedEntry => e !== null));
        } catch (e) {
            setError('Failed to load entries');
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [getKey]);

    // Load single entry
    const loadEntry = useCallback(async (id: string): Promise<DecryptedEntry | null> => {
        try {
            const key = getKey();
            const entry = await getEntry(id);

            if (!entry) return null;

            const contentJson = await decrypt(entry.encryptedContent, key);
            const content: EntryContent = JSON.parse(contentJson);

            return {
                id: entry.id,
                date: entry.date,
                content,
                intensity: entry.intensity,
                hasAudio: entry.hasAudio,
                createdAt: entry.createdAt,
                updatedAt: entry.updatedAt,
            };
        } catch (e) {
            console.error('Failed to load entry:', e);
            return null;
        }
    }, [getKey]);

    // Create new entry
    const createEntry = useCallback(async (
        content: EntryContent,
        intensity: number,
        date?: number
    ): Promise<string> => {
        const key = getKey();
        const now = Date.now();
        const id = crypto.randomUUID();

        const encryptedContent = await encrypt(JSON.stringify(content), key);

        const entry: JournalEntry = {
            id,
            date: date || now,
            encryptedContent,
            intensity,
            hasAudio: false,
            createdAt: now,
            updatedAt: now,
        };

        await saveEntry(entry);
        await loadEntries();

        return id;
    }, [getKey, loadEntries]);

    // Update entry
    const updateEntry = useCallback(async (
        id: string,
        content: EntryContent,
        intensity: number,
        date?: number
    ): Promise<void> => {
        const key = getKey();
        const existing = await getEntry(id);

        if (!existing) {
            throw new Error('Entry not found');
        }

        const encryptedContent = await encrypt(JSON.stringify(content), key);

        const entry: JournalEntry = {
            ...existing,
            date: date || existing.date,
            encryptedContent,
            intensity,
            updatedAt: Date.now(),
        };

        await saveEntry(entry);
        await loadEntries();
    }, [getKey, loadEntries]);

    // Delete entry
    const deleteEntry = useCallback(async (id: string): Promise<void> => {
        await deleteStorageEntry(id);
        await loadEntries();
    }, [loadEntries]);

    // Mark entry as having audio
    const markHasAudio = useCallback(async (id: string, hasAudio: boolean): Promise<void> => {
        const existing = await getEntry(id);
        if (!existing) return;

        await saveEntry({
            ...existing,
            hasAudio,
            updatedAt: Date.now(),
        });
    }, []);

    return {
        entries,
        loading,
        error,
        loadEntries,
        loadEntry,
        createEntry,
        updateEntry,
        deleteEntry,
        markHasAudio,
    };
}
