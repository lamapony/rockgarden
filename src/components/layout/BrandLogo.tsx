/**
 * Brand Logo Component - Unified logo for all screens
 * Fixed positioning and consistent styling across the app
 */

import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import './BrandLogo.css';

interface BrandLogoProps {
    /** Size variant: small (header), medium, large (auth page) */
    size?: 'small' | 'medium' | 'large';
    /** Show text next to logo */
    showText?: boolean;
    /** Custom text (default: 'rockgarden') */
    text?: string;
    /** Additional CSS class */
    className?: string;
    /** Click handler (for panic button) */
    onClick?: () => void;
    /** Whether panic button is enabled (shows indicator) */
    panicEnabled?: boolean;
}

export function BrandLogo({
    size = 'small',
    showText = true,
    text = 'rockgarden',
    className = '',
    onClick,
    panicEnabled = false,
}: BrandLogoProps) {
    const { t } = useTranslation();
    const { settings } = useSettings();
    const clickCountRef = useRef(0);
    const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Triple-click detection for panic button
    const handleClick = useCallback(() => {
        if (!settings.panicButtonEnabled || !panicEnabled) {
            onClick?.();
            return;
        }

        clickCountRef.current += 1;

        if (clickCountRef.current === 3) {
            // Triple click detected
            onClick?.();
            clickCountRef.current = 0;
            if (clickTimerRef.current) {
                clearTimeout(clickTimerRef.current);
                clickTimerRef.current = null;
            }
        } else {
            // Reset counter after 500ms
            if (clickTimerRef.current) {
                clearTimeout(clickTimerRef.current);
            }
            clickTimerRef.current = setTimeout(() => {
                clickCountRef.current = 0;
            }, 500);
        }
    }, [settings.panicButtonEnabled, panicEnabled, onClick]);

    const sizeClass = `brand-logo--${size}`;
    const clickableClass = settings.panicButtonEnabled && panicEnabled ? 'brand-logo--panic-enabled' : '';

    return (
        <div 
            className={`brand-logo ${sizeClass} ${clickableClass} ${className}`}
            onClick={handleClick}
            title={settings.panicButtonEnabled && panicEnabled ? t('a11y.tripleTapPanic') : ''}
        >
            <div className="brand-logo__icon">
                <div className="brand-logo__stone" />
            </div>
            {showText && (
                <span className="brand-logo__text">{text}</span>
            )}
        </div>
    );
}
