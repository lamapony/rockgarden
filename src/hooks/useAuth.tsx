/**
 * Authentication hook for Safe Journal
 */

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import {
    isAuthenticated as checkAuth,
    getSessionKey,
    clearSession,
    needsSetup as checkNeedsSetup,
    setupPassword as doSetupPassword,
    login as doLogin,
} from '../services/auth';
import { getSettings, updateLanguage } from '../services/storage';
import { setLanguage as setI18nLanguage } from '../i18n/config';
import type { AuthState } from '../types';

interface AuthContextType extends AuthState {
    login: (password: string) => Promise<boolean>;
    setupPassword: (password: string) => Promise<void>;
    logout: () => void;
    getKey: () => CryptoKey;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        isAuthenticated: false,
        isLoading: true,
        needsSetup: false,
    });

    // Check initial auth state
    useEffect(() => {
        async function checkInitialState() {
            try {
                const needsSetup = await checkNeedsSetup();

                if (!needsSetup) {
                    // Load saved language
                    const settings = await getSettings();
                    if (settings?.language) {
                        setI18nLanguage(settings.language);
                    }
                }

                setState({
                    isAuthenticated: checkAuth(),
                    isLoading: false,
                    needsSetup,
                });
            } catch (error) {
                console.error('Auth check failed:', error);
                setState({
                    isAuthenticated: false,
                    isLoading: false,
                    needsSetup: true,
                });
            }
        }

        checkInitialState();
    }, []);

    const login = useCallback(async (password: string): Promise<boolean> => {
        const success = await doLogin(password);
        if (success) {
            setState((prev) => ({ ...prev, isAuthenticated: true }));
        }
        return success;
    }, []);

    const setupPassword = useCallback(async (password: string): Promise<void> => {
        const settings = await getSettings();
        const language = settings?.language || 'ru';

        await doSetupPassword(password, language);
        await updateLanguage(language);

        setState({
            isAuthenticated: true,
            isLoading: false,
            needsSetup: false,
        });
    }, []);

    const logout = useCallback(() => {
        clearSession();
        setState((prev) => ({ ...prev, isAuthenticated: false }));
    }, []);

    const getKey = useCallback((): CryptoKey => {
        return getSessionKey();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                ...state,
                login,
                setupPassword,
                logout,
                getKey,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
