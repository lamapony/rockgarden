/**
 * Auto-lock provider
 * Automatically logs out user after period of inactivity
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';

const INACTIVITY_LIMIT_MS = 2 * 60 * 1000; // 2 minutes

export function AutoLockProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, logout } = useAuth();
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        if (!isAuthenticated) return;

        const resetTimer = () => {
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = window.setTimeout(() => {
                console.log('Auto-locking due to inactivity');
                logout();
            }, INACTIVITY_LIMIT_MS);
        };

        // Events to track activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

        // Initial setup
        resetTimer();

        // Add listeners
        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [isAuthenticated, logout]);

    return <>{children}</>;
}
