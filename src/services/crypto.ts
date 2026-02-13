/**
 * Cryptography Service for Safe Journal
 * Uses Web Crypto API with AES-256-GCM encryption
 * Password is NEVER stored - only used to derive key
 */

const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

/**
 * Generate a cryptographically secure salt
 */
export function generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Derive an AES-256 key from password using PBKDF2
 */
export async function deriveKey(
    password: string,
    salt: Uint8Array
): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer as any,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    // Derive AES-256-GCM key
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt as any,
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false, // not extractable
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt data using AES-256-GCM
 * Returns base64 encoded string: IV + ciphertext + tag
 */
export async function encrypt(
    data: string,
    key: CryptoKey
): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // Encrypt
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        dataBuffer
    );

    // Combine IV + ciphertext
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    // Return as base64
    return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt data using AES-256-GCM
 */
export async function decrypt(
    encryptedData: string,
    key: CryptoKey
): Promise<string> {
    // Decode base64
    const combined = new Uint8Array(
        atob(encryptedData)
            .split('')
            .map((c) => c.charCodeAt(0))
    );

    // Extract IV and ciphertext
    const iv = combined.slice(0, IV_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
}

/**
 * Create a verification block - used to verify password on login
 * Contains a known string encrypted with the derived key
 */
const VERIFICATION_STRING = 'SAFE_JOURNAL_VERIFIED_2024';

export async function createVerificationBlock(
    key: CryptoKey
): Promise<string> {
    return encrypt(VERIFICATION_STRING, key);
}

/**
 * Verify password by attempting to decrypt verification block
 */
export async function verifyPassword(
    verificationBlock: string,
    key: CryptoKey
): Promise<boolean> {
    try {
        const decrypted = await decrypt(verificationBlock, key);
        return decrypted === VERIFICATION_STRING;
    } catch {
        return false;
    }
}

/**
 * Convert Uint8Array to hex string for storage
 */
export function uint8ArrayToHex(arr: Uint8Array): string {
    return Array.from(arr)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Convert hex string back to Uint8Array
 */
export function hexToUint8Array(hex: string): Uint8Array {
    const matches = hex.match(/.{1,2}/g);
    if (!matches) return new Uint8Array();
    return new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
}

/**
 * Encrypt a Blob (for audio files)
 */
export async function encryptBlob(
    blob: Blob,
    key: CryptoKey
): Promise<string> {
    // Use FileReader for safe base64 conversion (avoids stack overflow)
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Full = reader.result as string;
            // Remove data URL prefix (e.g. "data:audio/webm;base64,")
            const base64 = base64Full.split(',')[1];
            try {
                const encrypted = await encrypt(base64, key);
                resolve(encrypted);
            } catch (e) {
                reject(e);
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Decrypt a Blob
 */
export async function decryptBlob(
    encryptedData: string,
    key: CryptoKey,
    mimeType: string
): Promise<Blob> {
    const decryptedBase64 = await decrypt(encryptedData, key);

    // Convert base64 back to Uint8Array
    const binaryString = atob(decryptedBase64);
    const uint8Array = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
    }

    return new Blob([uint8Array], { type: mimeType });
}
