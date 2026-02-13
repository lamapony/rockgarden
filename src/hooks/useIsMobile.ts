/**
 * Hook to detect if device is mobile/tablet (touch-based)
 * Uses both user agent and pointer media query
 */

import { useState, useEffect } from 'react';

export function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = useState<boolean>(false);

    useEffect(() => {
        const checkMobile = () => {
            // Check if device has coarse pointer (touch)
            const hasTouch = window.matchMedia('(pointer: coarse)').matches;
            
            // Check if device has hover capability
            const noHover = window.matchMedia('(hover: none)').matches;
            
            // Check user agent for mobile devices
            const userAgent = navigator.userAgent.toLowerCase();
            const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(userAgent);
            
            setIsMobile(hasTouch || noHover || isMobileUA);
        };

        checkMobile();

        // Re-check on resize (in case of device rotation or window changes)
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
}

/**
 * Hook to detect if virtual keyboard is open on mobile
 * Uses Visual Viewport API
 */
export function useKeyboardOpen(): boolean {
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    useEffect(() => {
        if (!('visualViewport' in window)) {
            return;
        }

        const visualViewport = window.visualViewport;
        if (!visualViewport) return;

        const handleResize = () => {
            // If visual viewport height is significantly less than window height,
            // keyboard is likely open
            const windowHeight = window.innerHeight;
            const viewportHeight = visualViewport.height;
            const keyboardOpen = windowHeight - viewportHeight > 100; // Threshold of 100px
            
            setIsKeyboardOpen(keyboardOpen);
        };

        visualViewport.addEventListener('resize', handleResize);
        handleResize(); // Check initial state

        return () => visualViewport.removeEventListener('resize', handleResize);
    }, []);

    return isKeyboardOpen;
}

/**
 * Hook to handle scroll to element when keyboard opens
 * Ensures input field is visible above keyboard
 */
export function useKeyboardAwareScroll(ref: React.RefObject<HTMLElement | null>) {
    useEffect(() => {
        if (!('visualViewport' in window)) {
            return;
        }

        const visualViewport = window.visualViewport;
        if (!visualViewport) return;

        const handleResize = () => {
            if (ref.current && document.activeElement === ref.current) {
                const rect = ref.current.getBoundingClientRect();
                const viewportHeight = visualViewport.height;
                
                // If element is below the visible viewport, scroll it into view
                if (rect.bottom > viewportHeight) {
                    const scrollAmount = rect.bottom - viewportHeight + 20; // 20px padding
                    window.scrollBy({
                        top: scrollAmount,
                        behavior: 'smooth'
                    });
                }
            }
        };

        visualViewport.addEventListener('resize', handleResize);
        return () => visualViewport.removeEventListener('resize', handleResize);
    }, [ref]);
}
