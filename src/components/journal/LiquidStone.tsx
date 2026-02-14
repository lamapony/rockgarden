import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './LiquidStone.css';

interface LiquidStoneProps {
    intensity: number;
    isThrowing?: boolean;
    onThrowComplete?: () => void;
}

export function LiquidStone({ intensity, isThrowing = false, onThrowComplete }: LiquidStoneProps) {
    const { t } = useTranslation();
    const [showRipple, setShowRipple] = useState(false);

    // Get label text based on intensity
    const getIntensityLabel = (value: number): string => {
        if (value <= 2) return t('journal.mild');
        if (value <= 4) return t('journal.moderate');
        if (value <= 7) return t('journal.intense');
        return t('journal.severe');
    };

    // Get label class based on intensity
    const getLabelClass = (value: number): string => {
        if (value <= 3) return 'calm';
        if (value <= 6) return 'moderate';
        if (value <= 8) return 'intense';
        return 'severe';
    };

    // Trigger ripple effect when intensity changes
    useEffect(() => {
        setShowRipple(true);
        const timer = setTimeout(() => setShowRipple(false), 500);
        return () => clearTimeout(timer);
    }, [intensity]);

    // Handle throw animation completion
    useEffect(() => {
        if (isThrowing) {
            const timer = setTimeout(() => {
                onThrowComplete?.();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [isThrowing, onThrowComplete]);

    return (
        <div className="liquid-stone-container">
            {/* Ripple effect */}
            <div 
                className="liquid-stone-ripple" 
                style={{
                    transform: showRipple ? 'scaleX(1.3) scaleY(1)' : 'scaleX(1) scaleY(1)',
                    opacity: showRipple ? 0.8 : 0.5,
                    transition: 'all 0.3s ease-out'
                }}
            />
            
            {/* The animated stone */}
            <div 
                className={`liquid-stone intensity-${intensity} ${isThrowing ? 'throwing' : ''}`}
                aria-label={`${t('journal.intensity')}: ${intensity}/10`}
            />
            
            {/* Intensity label */}
            <span className={`liquid-stone-label ${getLabelClass(intensity)}`}>
                {getIntensityLabel(intensity)} • {intensity}/10
            </span>
        </div>
    );
}
