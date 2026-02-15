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
 * Key is extractable for session storage (safe - only in memory, cleared on tab close)
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

    // Derive AES-256-GCM key (extractable for session persistence)
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt as any,
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true, // extractable for session storage
        ['encrypt', 'decrypt']
    );
}

/**
 * Export raw key material for session storage
 */
export async function exportKey(key: CryptoKey): Promise<Uint8Array> {
    const rawKey = await crypto.subtle.exportKey('raw', key);
    return new Uint8Array(rawKey);
}

/**
 * Import raw key material (from session storage)
 */
export async function importKey(rawKey: Uint8Array): Promise<CryptoKey> {
    return crypto.subtle.importKey(
        'raw',
        rawKey.buffer as ArrayBuffer,
        { name: 'AES-GCM', length: 256 },
        true,
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
    encryptedBase64: string,
    key: CryptoKey
): Promise<string> {
    // Decode base64
    const encryptedData = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

    // Extract IV and ciphertext
    const iv = encryptedData.slice(0, IV_LENGTH);
    const ciphertext = encryptedData.slice(IV_LENGTH);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
    );

    // Decode as string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
}

/**
 * Create a verification block to verify password correctness
 * Encrypts a known plaintext to verify key derivation
 */
export async function createVerificationBlock(key: CryptoKey): Promise<string> {
    return encrypt('VERIFICATION_BLOCK', key);
}

/**
 * Verify password by attempting to decrypt verification block
 */
export async function verifyPassword(
    key: CryptoKey,
    verificationBlock: string
): Promise<boolean> {
    try {
        const decrypted = await decrypt(verificationBlock, key);
        return decrypted === 'VERIFICATION_BLOCK';
    } catch {
        return false;
    }
}

/**
 * Convert Uint8Array to hex string
 */
export function uint8ArrayToHex(arr: Uint8Array): string {
    return Array.from(arr)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Convert hex string to Uint8Array
 */
export function hexToUint8Array(hex: string): Uint8Array {
    const arr = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        arr[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return arr;
}

/**
 * Encrypt a Blob (for audio recordings)
 */
export async function encryptBlob(
    blob: Blob,
    key: CryptoKey
): Promise<string> {
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Convert to base64 for encryption
    const base64String = btoa(String.fromCharCode(...uint8Array));

    return encrypt(base64String, key);
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
