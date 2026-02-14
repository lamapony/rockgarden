import { useRef, useCallback, useEffect } from 'react';

interface LongPressOptions {
    onShortPress: () => void;
    onLongPress: () => void;
    delay?: number; // ms before long press triggers
    onPressStart?: () => void;
    onPressEnd?: () => void;
}

interface LongPressResult {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onContextMenu: (e: React.MouseEvent) => void;
}

/**
 * Hook for detecting long press vs short tap on mobile devices
 * - Short tap: triggers onShortPress
 * - Long press (hold for delay ms): triggers onLongPress with haptic feedback
 */
export function useLongPress({
    onShortPress,
    onLongPress,
    delay = 500,
    onPressStart,
    onPressEnd,
}: LongPressOptions): LongPressResult {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isLongPressRef = useRef(false);
    const startPosRef = useRef<{ x: number; y: number } | null>(null);
    const maxMoveDistance = 10; // pixels - if finger moves more than this, cancel

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        const touch = e.touches[0];
        startPosRef.current = { x: touch.clientX, y: touch.clientY };
        isLongPressRef.current = false;

        onPressStart?.();

        timerRef.current = setTimeout(() => {
            isLongPressRef.current = true;
            // Haptic feedback for long press
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            onLongPress();
            timerRef.current = null;
        }, delay);
    }, [delay, onLongPress, onPressStart]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!startPosRef.current) return;

        const touch = e.touches[0];
        const dx = touch.clientX - startPosRef.current.x;
        const dy = touch.clientY - startPosRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If moved too much, cancel the long press
        if (distance > maxMoveDistance) {
            clearTimer();
            startPosRef.current = null;
        }
    }, [clearTimer]);

    const handleTouchEnd = useCallback((_e: React.TouchEvent) => {
        clearTimer();
        startPosRef.current = null;
        onPressEnd?.();

        // If it wasn't a long press, trigger short press
        if (!isLongPressRef.current) {
            onShortPress();
        }

        isLongPressRef.current = false;
    }, [clearTimer, onShortPress, onPressEnd]);

    // Prevent context menu on long press (mobile browsers)
    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearTimer();
        };
    }, [clearTimer]);

    return {
        onTouchStart: handleTouchStart,
        onTouchEnd: handleTouchEnd,
        onTouchMove: handleTouchMove,
        onContextMenu: handleContextMenu,
    };
}
