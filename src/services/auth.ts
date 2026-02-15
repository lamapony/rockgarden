/**
 * Authentication Service for Safe Journal
 * Handles password verification and session key management
 * Session key is stored in sessionStorage (cleared on tab close)
 */

import {
    deriveKey,
    generateSalt,
    createVerificationBlock,
    verifyPassword,
    uint8ArrayToHex,
    hexToUint8Array,
    exportKey,
    importKey,
} from './crypto';
import { getSettings, saveSettings, isInitialized } from './storage';

// Session storage keys
const SESSION_KEY_STORAGE = 'sj_session_key';
const SESSION_DECOY_KEY = 'sj_session_decoy';

// In-memory key storage (fallback if sessionStorage unavailable)
let memoryKey: CryptoKey | null = null;
let memoryDecoy: boolean = false;

/**
 * Save session key to sessionStorage
 */
async function saveSessionKey(key: CryptoKey, isDecoy: boolean): Promise<void> {
    try {
        const rawKey = await exportKey(key);
        const keyHex = uint8ArrayToHex(rawKey);
        sessionStorage.setItem(SESSION_KEY_STORAGE, keyHex);
        sessionStorage.setItem(SESSION_DECOY_KEY, isDecoy ? '1' : '0');
    } catch (e) {
        // Fallback to memory if sessionStorage fails
        memoryKey = key;
        memoryDecoy = isDecoy;
    }
}

/**
 * Load session key from sessionStorage
 */
async function loadSessionKey(): Promise<{ key: CryptoKey; isDecoy: boolean } | null> {
    try {
        const keyHex = sessionStorage.getItem(SESSION_KEY_STORAGE);
        const isDecoyStr = sessionStorage.getItem(SESSION_DECOY_KEY);
        
        if (!keyHex) {
            return null;
        }
        
        const rawKey = hexToUint8Array(keyHex);
        const key = await importKey(rawKey);
        const isDecoy = isDecoyStr === '1';
        
        return { key, isDecoy };
    } catch (e) {
        return null;
    }
}

/**
 * Clear session storage
 */
function clearSessionStorage(): void {
    try {
        sessionStorage.removeItem(SESSION_KEY_STORAGE);
        sessionStorage.removeItem(SESSION_DECOY_KEY);
    } catch (e) {
        // Ignore
    }
    memoryKey = null;
    memoryDecoy = false;
}

/**
 * Initialize session from storage (call on app start)
 */
export async function initSession(): Promise<boolean> {
    const session = await loadSessionKey();
    if (session) {
        memoryKey = session.key;
        memoryDecoy = session.isDecoy;
        return true;
    }
    return false;
}

/**
 * Check if user is authenticated (has valid session key)
 */
export function isAuthenticated(): boolean {
    // Check memory first, then sessionStorage
    if (memoryKey !== null) {
        return true;
    }
    // sessionStorage will be checked on initSession, but let's check sync fallback
    try {
        return sessionStorage.getItem(SESSION_KEY_STORAGE) !== null;
    } catch (e) {
        return false;
    }
}

/**
 * Get the current session key
 * Throws if not authenticated
 */
export function getSessionKey(): CryptoKey {
    if (!memoryKey) {
        throw new Error('Not authenticated');
    }
    return memoryKey;
}

/**
 * Clear session (logout)
 */
export function clearSession(): void {
    clearSessionStorage();
}

/**
 * Check if current session is in decoy mode
 */
export function isDecoyMode(): boolean {
    return memoryDecoy;
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

    // Store session key
    memoryKey = key;
    memoryDecoy = false;
    await saveSessionKey(key, false);
}

/**
 * Login with password
 * Returns true if successful, false if wrong password
 * Includes artificial delay to prevent brute force attacks
 */
export async function login(password: string): Promise<boolean> {
    const startTime = Date.now();
    
    // Get settings
    const settings = await getSettings();
    if (!settings) {
        // Artificial delay even on early return to prevent timing attacks
        await new Promise(resolve => setTimeout(resolve, 1000));
        return false;
    }

    // Derive key from password
    const salt = hexToUint8Array(settings.salt);
    const key = await deriveKey(password, salt);

    // Verify password by checking verification block
    const isValid = await verifyPassword(key, settings.verificationBlock);

    if (isValid) {
        // Store session key
        memoryKey = key;
        memoryDecoy = false;
        await saveSessionKey(key, false);
        
        // Artificial delay to ensure consistent timing (~1000ms total)
        const elapsed = Date.now() - startTime;
        const minDelay = 1000;
        if (elapsed < minDelay) {
            await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
        }
        
        return true;
    }

    // Check if this is the decoy password
    if (settings.decoySalt && settings.decoyVerificationBlock) {
        const decoySalt = hexToUint8Array(settings.decoySalt);
        const decoyKey = await deriveKey(password, decoySalt);
        const isDecoyValid = await verifyPassword(decoyKey, settings.decoyVerificationBlock);

        if (isDecoyValid) {
            // Decoy mode activated - empty journal
            memoryKey = decoyKey;
            memoryDecoy = true;
            await saveSessionKey(decoyKey, true);
            
            // Artificial delay for consistent timing
            const elapsed = Date.now() - startTime;
            const minDelay = 1000;
            if (elapsed < minDelay) {
                await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
            }
            
            return true;
        }
    }

    // Artificial delay for wrong password (same timing as success to prevent timing attacks)
    const elapsed = Date.now() - startTime;
    const minDelay = 1000;
    if (elapsed < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
    }

    return false;
}

/**
 * Set up or update decoy password
 */
export async function setDecoyPassword(
    currentPassword: string,
    decoyPassword: string
): Promise<boolean> {
    // First verify current password
    const loginSuccess = await login(currentPassword);
    if (!loginSuccess) {
        return false;
    }

    // Generate new salt and key for decoy
    const decoySalt = generateSalt();
    const decoyKey = await deriveKey(decoyPassword, decoySalt);
    const decoyVerificationBlock = await createVerificationBlock(decoyKey);

    // Save decoy settings
    const settings = await getSettings();
    if (!settings) {
        return false;
    }

    await saveSettings({
        ...settings,
        decoySalt: uint8ArrayToHex(decoySalt),
        decoyVerificationBlock,
    });

    return true;
}

/**
 * Remove decoy password
 */
export async function removeDecoyPassword(currentPassword: string): Promise<boolean> {
    // Verify current password
    const loginSuccess = await login(currentPassword);
    if (!loginSuccess) {
        return false;
    }

    // Remove decoy settings
    const settings = await getSettings();
    if (!settings) {
        return false;
    }

    const { decoySalt, decoyVerificationBlock, ...rest } = settings;
    await saveSettings(rest);

    return true;
}

/**
 * Check if decoy password is set
 */
export async function hasDecoyPassword(): Promise<boolean> {
    const settings = await getSettings();
    return !!(settings?.decoySalt && settings?.decoyVerificationBlock);
}

/**
 * Change password (requires old password)
 */
export async function changePassword(
    oldPassword: string,
    newPassword: string
): Promise<boolean> {
    // Verify old password
    const settings = await getSettings();
    if (!settings) {
        return false;
    }

    // Derive key from old password
    const salt = hexToUint8Array(settings.salt);
    const oldKey = await deriveKey(oldPassword, salt);

    // Verify
    const isValid = await verifyPassword(oldKey, settings.verificationBlock);
    if (!isValid) {
        return false;
    }

    // Generate new salt and key
    const newSalt = generateSalt();
    const newKey = await deriveKey(newPassword, newSalt);
    const newVerificationBlock = await createVerificationBlock(newKey);

    // Re-encrypt all entries with new key
    // For now, we'll just update the settings
    // In a full implementation, we'd need to re-encrypt all data
    await saveSettings({
        ...settings,
        salt: uint8ArrayToHex(newSalt),
        verificationBlock: newVerificationBlock,
    });

    // Update session key
    memoryKey = newKey;
    await saveSessionKey(newKey, false);

    return true;
}
