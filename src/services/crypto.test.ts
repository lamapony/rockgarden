/**
 * Unit tests for Cryptography Service
 */
import { describe, it, expect, beforeAll } from 'vitest';
import {
    deriveKey,
    encrypt,
    decrypt,
    generateSalt,
    createVerificationBlock,
    verifyPassword,
    uint8ArrayToHex,
    hexToUint8Array,
    encryptBlob,
    decryptBlob,
} from './crypto';

describe('Cryptography Service', () => {
    const password = 'test-password-123';
    let salt: Uint8Array;
    let key: CryptoKey;

    beforeAll(async () => {
        salt = generateSalt();
        key = await deriveKey(password, salt);
    });

    it('should generate salt of correct length', () => {
        const salt = generateSalt();
        expect(salt.length).toBe(16);
        expect(salt).not.toEqual(new Uint8Array(16)); // not empty
    });

    it('should derive different keys for different salts', async () => {
        const salt1 = generateSalt();
        const salt2 = generateSalt();

        // Check they are different
        expect(uint8ArrayToHex(salt1)).not.toBe(uint8ArrayToHex(salt2));

        const key1 = await deriveKey(password, salt1);
        const key2 = await deriveKey(password, salt2);

        // Testing CryptoKey equality is tricky, so let's test their effect
        const plainText = 'secret';
        const encrypted1 = await encrypt(plainText, key1);

        // Key2 should NOT be able to decrypt what Key1 encrypted
        await expect(decrypt(encrypted1, key2)).rejects.toThrow();
    });

    it('should encrypt and decrypt string correctly', async () => {
        const originalText = 'This is a secret message with emojis 🤐🔐';
        const encrypted = await encrypt(originalText, key);

        expect(encrypted).not.toBe(originalText);
        expect(typeof encrypted).toBe('string');

        const decrypted = await decrypt(encrypted, key);
        expect(decrypted).toBe(originalText);
    });

    it('should fail to decrypt with wrong key', async () => {
        const originalText = 'secret data';
        const encrypted = await encrypt(originalText, key);

        const wrongKey = await deriveKey('wrong-password', salt);

        await expect(decrypt(encrypted, wrongKey)).rejects.toThrow();
    });

    it('should create and verify verification block', async () => {
        const verificationBlock = await createVerificationBlock(key);
        expect(verificationBlock).toBeTruthy();

        const isValid = await verifyPassword(verificationBlock, key);
        expect(isValid).toBe(true);

        const wrongKey = await deriveKey('wrong-password', salt);
        const isValidWrong = await verifyPassword(verificationBlock, wrongKey);
        expect(isValidWrong).toBe(false);
    });

    it('should handle hex conversion correctly', () => {
        const original = new Uint8Array([0, 255, 127, 42]);
        const hex = uint8ArrayToHex(original);
        expect(hex).toBe('00ff7f2a');

        const restored = hexToUint8Array(hex);
        expect(restored).toEqual(original);
    });

    describe('Blob encryption', () => {
        it('should encrypt and decrypt blob correctly', async () => {
            // Create a sample blob (simulating audio data)
            const originalData = new Uint8Array([0, 1, 2, 3, 255, 254, 253]);
            const originalBlob = new Blob([originalData], { type: 'audio/webm' });

            const encrypted = await encryptBlob(originalBlob, key);
            expect(encrypted).toBeTruthy();
            expect(typeof encrypted).toBe('string');
            expect(encrypted).not.toBe(originalData);

            const decryptedBlob = await decryptBlob(encrypted, key, 'audio/webm');
            expect(decryptedBlob.type).toBe('audio/webm');
            expect(decryptedBlob.size).toBe(originalBlob.size);
        });

        it('should fail to decrypt blob with wrong key', async () => {
            const originalData = new Uint8Array([0, 1, 2, 3]);
            const originalBlob = new Blob([originalData], { type: 'audio/webm' });

            const encrypted = await encryptBlob(originalBlob, key);
            const wrongKey = await deriveKey('wrong-password', salt);

            await expect(decryptBlob(encrypted, wrongKey, 'audio/webm')).rejects.toThrow();
        });

        it('should preserve different mime types', async () => {
            const textBlob = new Blob(['Hello World'], { type: 'text/plain' });
            const encrypted = await encryptBlob(textBlob, key);
            const decrypted = await decryptBlob(encrypted, key, 'text/plain');

            expect(decrypted.type).toBe('text/plain');
        });

        it('should handle empty blob', async () => {
            const emptyBlob = new Blob([], { type: 'audio/webm' });
            const encrypted = await encryptBlob(emptyBlob, key);
            const decrypted = await decryptBlob(encrypted, key, 'audio/webm');

            expect(decrypted.size).toBe(0);
        });

        it('should handle large blob data', async () => {
            // Create a larger blob (simulating longer audio)
            const largeData = new Uint8Array(10000).fill(42);
            const largeBlob = new Blob([largeData], { type: 'audio/webm' });

            const encrypted = await encryptBlob(largeBlob, key);
            const decrypted = await decryptBlob(encrypted, key, 'audio/webm');

            expect(decrypted.size).toBe(largeBlob.size);
        });
    });
});
