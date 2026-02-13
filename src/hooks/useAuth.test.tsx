/**
 * Unit tests for useAuth hook
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './useAuth';
import { deleteAllData } from '../services/storage';

// Helper to wrap hook with provider
function wrapper({ children }: { children: React.ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
}

describe('useAuth hook', () => {
    beforeEach(async () => {
        await deleteAllData();
    });

    it('should show loading state initially', () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        expect(result.current.isLoading).toBe(true);
    });

    it('should detect that setup is needed for new app', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.needsSetup).toBe(true);
        expect(result.current.isAuthenticated).toBe(false);
    });

    it('should setup password and authenticate', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        await act(async () => {
            await result.current.setupPassword('test-password');
        });

        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.needsSetup).toBe(false);
    });

    it('should get encryption key when authenticated', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        await act(async () => {
            await result.current.setupPassword('test-password');
        });

        const key = result.current.getKey();
        expect(key).toBeDefined();
        expect(key.type).toBe('secret');
    });

    it('should throw when getting key without authentication', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        // Setup and then logout to ensure we're not authenticated
        await act(async () => {
            await result.current.setupPassword('test-password');
        });
        
        act(() => {
            result.current.logout();
        });

        expect(result.current.isAuthenticated).toBe(false);
        expect(() => result.current.getKey()).toThrow('Not authenticated');
    });

    it('should login with correct password', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        // Setup first
        await act(async () => {
            await result.current.setupPassword('correct-password');
        });

        // Logout
        act(() => {
            result.current.logout();
        });

        expect(result.current.isAuthenticated).toBe(false);

        // Login again
        let loginResult = false;
        await act(async () => {
            loginResult = await result.current.login('correct-password');
        });

        expect(loginResult).toBe(true);
        expect(result.current.isAuthenticated).toBe(true);
    });

    it('should fail login with wrong password', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        // Setup first
        await act(async () => {
            await result.current.setupPassword('correct-password');
        });

        // Logout
        act(() => {
            result.current.logout();
        });

        // Try wrong password
        let loginResult = true;
        await act(async () => {
            loginResult = await result.current.login('wrong-password');
        });

        expect(loginResult).toBe(false);
        expect(result.current.isAuthenticated).toBe(false);
    });

    it('should logout and clear session', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        await act(async () => {
            await result.current.setupPassword('test-password');
        });

        expect(result.current.isAuthenticated).toBe(true);

        act(() => {
            result.current.logout();
        });

        expect(result.current.isAuthenticated).toBe(false);
    });

    it('should throw when used outside AuthProvider', () => {
        // Render without wrapper
        expect(() => {
            renderHook(() => useAuth());
        }).toThrow('useAuth must be used within AuthProvider');
    });
});
