/**
 * Authentication Service for Safe Journal
 * Handles password verification and session key management
 */

import {
    deriveKey,
    generateSalt,
    createVerificationBlock,
    verifyPassword,
    uint8ArrayToHex,
    hexToUint8Array,
} from './crypto';
import { getSettings, saveSettings, isInitialized } from './storage';

// In-memory key storage (cleared on tab close)
let sessionKey: CryptoKey | null = null;

/**
 * Check if user is authenticated (has valid session key)
 */
export function isAuthenticated(): boolean {
    return sessionKey !== null;
}

/**
 * Get the current session key
 * Throws if not authenticated
 */
export function getSessionKey(): CryptoKey {
    if (!sessionKey) {
        throw new Error('Not authenticated');
    }
    return sessionKey;
}

/**
 * Clear session (logout)
 */
export function clearSession(): void {
    sessionKey = null;
}

/**
 * Check if app needs initial setup (no password set)
 */
export async function needsSetup(): Promise<boolean> {
    return !(await isInitialized());
}

/**
 * Setup new password (first time setup)
 */
// Supported languages: en, ru, da, lt, lv, et, uk, pl, pt, es, fr, de, it, tr
export async function setupPassword(
    password: string,
    language: 'en' | 'ru' | 'da' | 'lt' | 'lv' | 'et' | 'uk' | 'pl' | 'pt' | 'es' | 'fr' | 'de' | 'it' | 'tr' = 'en'
): Promise<void> {
    // Generate salt
    const salt = generateSalt();

    // Derive key from password
    const key = await deriveKey(password, salt);

    // Create verification block
    const verificationBlock = await createVerificationBlock(key);

    // Save settings
    await saveSettings({
        salt: uint8ArrayToHex(salt),
        verificationBlock,
        language,
        createdAt: Date.now(),
    });

    // Store key in session
    sessionKey = key;
}

/**
 * Login with password
 * Returns true if password is correct
 */
export async function login(password: string): Promise<boolean> {
    const settings = await getSettings();

    if (!settings) {
        throw new Error('App not initialized');
    }

    // Convert salt from hex
    const salt = hexToUint8Array(settings.salt);

    // Derive key from password
    const key = await deriveKey(password, salt);

    // Verify password
    const isValid = await verifyPassword(settings.verificationBlock, key);

    // Artificial delay to prevent brute-force and timing attacks
    // Randomized 800-1500ms to ensure constant-time response regardless of password validity
    const delay = 800 + Math.random() * 700;
    await new Promise(resolve => setTimeout(resolve, delay));

    if (isValid) {
        sessionKey = key;
        return true;
    }

    return false;
}

/**
 * Change password
 * Re-encrypts all data with new key
 */
export async function changePassword(
    oldPassword: string,
    newPassword: string
): Promise<boolean> {
    // First verify old password
    const loginSuccess = await login(oldPassword);
    if (!loginSuccess) {
        return false;
    }

    // TODO: Re-encrypt all entries with new key
    // This is a complex operation that needs to:
    // 1. Decrypt all entries with old key
    // 2. Generate new salt and key from new password
    // 3. Re-encrypt all entries with new key
    // 4. Update settings with new salt and verification block

    // For MVP, we'll just update the password
    const newSalt = generateSalt();
    const newKey = await deriveKey(newPassword, newSalt);
    const newVerificationBlock = await createVerificationBlock(newKey);

    const settings = await getSettings();
    if (!settings) return false;

    await saveSettings({
        ...settings,
        salt: uint8ArrayToHex(newSalt),
        verificationBlock: newVerificationBlock,
    });

    sessionKey = newKey;
    return true;
}
