/**
 * TypeScript types for Safe Journal
 */

// Entry content (decrypted form)
export interface EntryContent {
    title: string;
    text: string;
    tags: string[];
}

// Full entry with decrypted content
export interface DecryptedEntry {
    id: string;
    date: number;
    content: EntryContent;
    intensity: number;
    hasAudio: boolean;
    createdAt: number;
    updatedAt: number;
    isArchived?: boolean;
}

// Audio note with decrypted blob
export interface DecryptedAudioNote {
    id: string;
    entryId: string;
    audioBlob: Blob;
    duration: number;
    createdAt: number;
}

// Auth state
export interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    needsSetup: boolean;
}

// App theme
export type Theme = 'dark' | 'light';

// Navigation routes
export type Route =
    | '/'
    | '/entry/:id'
    | '/new'
    | '/export'
    | '/settings';
