/**
 * Unit tests for Authentication Service
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
    isAuthenticated,
    getSessionKey,
    clearSession,
    needsSetup,
    setupPassword,
    login,
    changePassword,
} from './auth';
import { deleteAllData, getSettings, saveSettings } from './storage';
import { generateSalt } from './crypto';

describe('Authentication Service', () => {
    beforeEach(async () => {
        await deleteAllData();
        clearSession();
    });

    describe('Session Management', () => {
        it('should return false when not authenticated', () => {
            expect(isAuthenticated()).toBe(false);
        });

        it('should throw when getting session key without authentication', () => {
            expect(() => getSessionKey()).toThrow('Not authenticated');
        });

        it('should clear session on logout', async () => {
            // Setup and login
            await setupPassword('test-password');
            expect(isAuthenticated()).toBe(true);

            // Logout
            clearSession();
            expect(isAuthenticated()).toBe(false);
        });
    });

    describe('Setup', () => {
        it('should return true for needsSetup when app is not initialized', async () => {
            const needsSetupResult = await needsSetup();
            expect(needsSetupResult).toBe(true);
        });

        it('should setup password and authenticate user', async () => {
            await setupPassword('my-secure-password', 'en');

            expect(isAuthenticated()).toBe(true);
            const key = getSessionKey();
            expect(key).toBeDefined();
            expect(key.type).toBe('secret');
        });

        it('should save settings after setup', async () => {
            await setupPassword('my-password', 'ru');

            const settings = await getSettings();
            expect(settings).toBeDefined();
            expect(settings?.language).toBe('ru');
            expect(settings?.salt).toBeDefined();
            expect(settings?.verificationBlock).toBeDefined();
        });

        it('should return false for needsSetup after initialization', async () => {
            await setupPassword('password');
            const needsSetupResult = await needsSetup();
            expect(needsSetupResult).toBe(false);
        });
    });

    describe('Login', () => {
        beforeEach(async () => {
            await setupPassword('correct-password', 'en');
            clearSession(); // Clear session to simulate fresh login
        });

        it('should login with correct password', async () => {
            expect(isAuthenticated()).toBe(false);

            const result = await login('correct-password');

            expect(result).toBe(true);
            expect(isAuthenticated()).toBe(true);
        });

        it('should not login with incorrect password', async () => {
            const result = await login('wrong-password');

            expect(result).toBe(false);
            expect(isAuthenticated()).toBe(false);
        });

        it('should set session key on successful login', async () => {
            await login('correct-password');

            const key = getSessionKey();
            expect(key).toBeDefined();
        });

        it('should throw when app is not initialized', async () => {
            await deleteAllData();

            await expect(login('any-password')).rejects.toThrow('App not initialized');
        });

        it('should have artificial delay to prevent brute force', async () => {
            const startTime = Date.now();
            await login('correct-password');
            const endTime = Date.now();

            // Should take at least 1000ms due to artificial delay
            expect(endTime - startTime).toBeGreaterThanOrEqual(900);
        });
    });

    describe('Change Password', () => {
        beforeEach(async () => {
            await setupPassword('old-password');
        });

        it('should change password with correct old password', async () => {
            const result = await changePassword('old-password', 'new-password');

            expect(result).toBe(true);

            // Should still be authenticated
            expect(isAuthenticated()).toBe(true);
        });

        it('should not change password with incorrect old password', async () => {
            const result = await changePassword('wrong-password', 'new-password');

            expect(result).toBe(false);
        });

        it('should update settings after password change', async () => {
            const oldSettings = await getSettings();
            const oldSalt = oldSettings?.salt;

            await changePassword('old-password', 'new-password');

            const newSettings = await getSettings();
            // Salt should be different after password change
            expect(newSettings?.salt).not.toBe(oldSalt);
        });

        it('should allow login with new password after change', async () => {
            await changePassword('old-password', 'new-password');
            clearSession();

            const result = await login('new-password');
            expect(result).toBe(true);
        });

        it('should not allow login with old password after change', async () => {
            await changePassword('old-password', 'new-password');
            clearSession();

            const result = await login('old-password');
            expect(result).toBe(false);
        });

        it('should keep language setting after password change', async () => {
            // Setup with specific language
            await deleteAllData();
            await setupPassword('old-password', 'da');

            await changePassword('old-password', 'new-password');

            const settings = await getSettings();
            expect(settings?.language).toBe('da');
        });
    });

    describe('Key Consistency', () => {
        it('should derive same key for same password and salt', async () => {
            await setupPassword('test-password');
            const settings = await getSettings();
            const salt = settings?.salt;

            clearSession();
            await login('test-password');

            const settingsAfterLogin = await getSettings();
            // Salt should remain the same
            expect(settingsAfterLogin?.salt).toBe(salt);
        });

        it('should maintain session across multiple checks', async () => {
            await setupPassword('password');

            expect(isAuthenticated()).toBe(true);
            expect(getSessionKey()).toBeDefined();
            expect(isAuthenticated()).toBe(true);
        });
    });
});
