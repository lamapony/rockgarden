/**
 * Unit tests for useEntries hook
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEntries } from './useEntries';
import { useAuth } from './useAuth';
import { deleteAllData, saveEntry, type EntryContent } from '../services/storage';
import { encrypt, generateSalt, deriveKey } from '../services/crypto';

// Mock useAuth
vi.mock('./useAuth', () => ({
    useAuth: vi.fn(),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('useEntries hook', () => {
    let mockKey: CryptoKey;

    beforeEach(async () => {
        await deleteAllData();
        vi.clearAllMocks();
        
        // Create a mock key for testing
        const salt = generateSalt();
        mockKey = await deriveKey('test-password', salt);
        
        // Mock useAuth to return the key
        vi.mocked(useAuth).mockReturnValue({
            getKey: () => mockKey,
            isAuthenticated: true,
            isLoading: false,
            needsSetup: false,
            login: vi.fn(),
            setupPassword: vi.fn(),
            logout: vi.fn(),
        });
    });

    const createEncryptedEntry = async (id: string, content: EntryContent, intensity: number = 5) => {
        const encryptedContent = await encrypt(JSON.stringify(content), mockKey);
        await saveEntry({
            id,
            date: Date.now(),
            encryptedContent,
            intensity,
            hasAudio: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    };

    it('should start with empty entries', () => {
        const { result } = renderHook(() => useEntries());

        expect(result.current.entries).toEqual([]);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('should load entries', async () => {
        // Create a test entry
        await createEncryptedEntry('entry-1', { title: 'Test', text: 'Content', tags: [] });

        const { result } = renderHook(() => useEntries());

        await act(async () => {
            await result.current.loadEntries();
        });

        expect(result.current.entries).toHaveLength(1);
        expect(result.current.entries[0].content.title).toBe('Test');
        expect(result.current.entries[0].content.text).toBe('Content');
    });

    it('should create a new entry', async () => {
        const { result } = renderHook(() => useEntries());

        let entryId = '';
        await act(async () => {
            entryId = await result.current.createEntry(
                { title: 'New Entry', text: 'New Content', tags: ['tag1'] },
                7
            );
        });

        expect(entryId).toBeTruthy();
        expect(result.current.entries).toHaveLength(1);
        expect(result.current.entries[0].content.title).toBe('New Entry');
        expect(result.current.entries[0].intensity).toBe(7);
    });

    it('should load a single entry', async () => {
        const { result } = renderHook(() => useEntries());

        // Create entry first
        let entryId = '';
        await act(async () => {
            entryId = await result.current.createEntry(
                { title: 'Single', text: 'Entry', tags: [] },
                5
            );
        });

        // Load single entry
        let loadedEntry = null;
        await act(async () => {
            loadedEntry = await result.current.loadEntry(entryId);
        });

        expect(loadedEntry).not.toBeNull();
        expect((loadedEntry as unknown as { content: { title: string } }).content.title).toBe('Single');
    });

    it('should return null for non-existent entry', async () => {
        const { result } = renderHook(() => useEntries());

        let loadedEntry: any = 'initial';
        await act(async () => {
            loadedEntry = await result.current.loadEntry('non-existent');
        });

        expect(loadedEntry).toBeNull();
    });

    it('should update an entry', async () => {
        const { result } = renderHook(() => useEntries());

        // Create entry
        let entryId = '';
        await act(async () => {
            entryId = await result.current.createEntry(
                { title: 'Original', text: 'Content', tags: [] },
                3
            );
        });

        // Update entry
        await act(async () => {
            await result.current.updateEntry(
                entryId,
                { title: 'Updated', text: 'New Content', tags: ['updated'] },
                8
            );
        });

        const updatedEntry = result.current.entries.find(e => e.id === entryId);
        expect(updatedEntry?.content.title).toBe('Updated');
        expect(updatedEntry?.intensity).toBe(8);
    });

    it('should throw when updating non-existent entry', async () => {
        const { result } = renderHook(() => useEntries());

        await expect(
            act(async () => {
                await result.current.updateEntry(
                    'non-existent',
                    { title: 'Test', text: 'Test', tags: [] },
                    5
                );
            })
        ).rejects.toThrow('Entry not found');
    });

    it('should delete an entry', async () => {
        const { result } = renderHook(() => useEntries());

        // Create entry
        let entryId = '';
        await act(async () => {
            entryId = await result.current.createEntry(
                { title: 'To Delete', text: 'Content', tags: [] },
                5
            );
        });

        expect(result.current.entries).toHaveLength(1);

        // Delete entry
        await act(async () => {
            await result.current.deleteEntry(entryId);
        });

        expect(result.current.entries).toHaveLength(0);
    });

    it('should handle decryption errors gracefully', async () => {
        // Create entry with wrong key (simulating corruption)
        const wrongKey = await deriveKey('wrong-password', generateSalt());
        const encryptedContent = await encrypt(JSON.stringify({ title: 'Test', text: 'Test', tags: [] }), wrongKey);
        
        await saveEntry({
            id: 'corrupted',
            date: Date.now(),
            encryptedContent,
            intensity: 5,
            hasAudio: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        const { result } = renderHook(() => useEntries());

        await act(async () => {
            await result.current.loadEntries();
        });

        // Should have 0 entries because decryption failed
        expect(result.current.entries).toHaveLength(0);
    });

    it('should set loading state during operations', async () => {
        const { result } = renderHook(() => useEntries());

        let loadingStates: boolean[] = [];
        
        await act(async () => {
            loadingStates.push(result.current.loading);
            await result.current.loadEntries();
            loadingStates.push(result.current.loading);
        });

        expect(loadingStates[0]).toBe(false); // Initial state
        expect(loadingStates[1]).toBe(false); // After load
    });
});
