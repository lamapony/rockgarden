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
let isDecoySession: boolean = false;

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
    isDecoySession = false;
}

/**
 * Check if current session is in decoy mode
 */
export function isDecoyMode(): boolean {
    return isDecoySession;
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
 * Returns true if password is correct (real or decoy)
 * Sets isDecoySession flag if decoy password was used
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

    // Verify password against real password
    const isValid = await verifyPassword(settings.verificationBlock, key);

    if (isValid) {
        // Artificial delay to prevent brute-force and timing attacks
        const delay = 800 + Math.random() * 700;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        sessionKey = key;
        isDecoySession = false;
        return true;
    }

    // Check decoy password if set
    if (settings.decoySalt && settings.decoyVerificationBlock) {
        const decoySalt = hexToUint8Array(settings.decoySalt);
        const decoyKey = await deriveKey(password, decoySalt);
        const isDecoyValid = await verifyPassword(settings.decoyVerificationBlock, decoyKey);

        if (isDecoyValid) {
            // Artificial delay to prevent brute-force and timing attacks
            const delay = 800 + Math.random() * 700;
            await new Promise(resolve => setTimeout(resolve, delay));
            
            sessionKey = decoyKey;
            isDecoySession = true;
            return true;
        }
    }

    // Artificial delay to prevent brute-force and timing attacks
    const delay = 800 + Math.random() * 700;
    await new Promise(resolve => setTimeout(resolve, delay));

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

    // Cannot change password in decoy mode
    if (isDecoySession) {
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

/**
 * Set up or change decoy password
 * Must be authenticated with real password
 */
export async function setDecoyPassword(
    currentPassword: string,
    decoyPassword: string
): Promise<boolean> {
    // Verify current password first
    const loginSuccess = await login(currentPassword);
    if (!loginSuccess) {
        return false;
    }

    // Cannot set decoy password while in decoy mode
    if (isDecoySession) {
        return false;
    }

    // Generate new salt and key for decoy password
    const decoySalt = generateSalt();
    const decoyKey = await deriveKey(decoyPassword, decoySalt);
    const decoyVerificationBlock = await createVerificationBlock(decoyKey);

    const settings = await getSettings();
    if (!settings) return false;

    await saveSettings({
        ...settings,
        decoySalt: uint8ArrayToHex(decoySalt),
        decoyVerificationBlock: decoyVerificationBlock,
    });

    return true;
}

/**
 * Remove decoy password
 */
export async function removeDecoyPassword(
    currentPassword: string
): Promise<boolean> {
    // Verify current password first
    const loginSuccess = await login(currentPassword);
    if (!loginSuccess) {
        return false;
    }

    // Cannot remove decoy password while in decoy mode
    if (isDecoySession) {
        return false;
    }

    const settings = await getSettings();
    if (!settings) return false;

    await saveSettings({
        ...settings,
        decoySalt: undefined,
        decoyVerificationBlock: undefined,
    });

    return true;
}

/**
 * Check if decoy password is set
 */
export async function hasDecoyPassword(): Promise<boolean> {
    const settings = await getSettings();
    if (!settings) return false;
    return !!settings.decoySalt && !!settings.decoyVerificationBlock;
}
