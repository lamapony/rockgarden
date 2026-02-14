import { useState, useRef, useCallback } from 'react';
import './LiquidInput.css';

interface LiquidInputProps {
    value: string;
    onChange: (value: string) => void;
    intensity: number;
    placeholder?: string;
    onFocus?: () => void;
    onBlur?: () => void;
    isSplashing?: boolean;
}

interface Ripple {
    id: number;
    x: number;
    y: number;
}

export function LiquidInput({ 
    value, 
    onChange, 
    intensity, 
    placeholder,
    onFocus,
    onBlur,
    isSplashing = false
}: LiquidInputProps) {
    const [ripples, setRipples] = useState<Ripple[]>([]);
    const [isFocused, setIsFocused] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const rippleIdRef = useRef(0);

    // Get intensity class for styling
    const getIntensityClass = (value: number): string => {
        if (value <= 3) return 'intensity-low';
        if (value <= 6) return 'intensity-medium';
        if (value <= 8) return 'intensity-high';
        return 'intensity-severe';
    };

    // Create ripple effect on click
    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const newRipple: Ripple = {
            id: rippleIdRef.current++,
            x,
            y
        };
        
        setRipples(prev => [...prev, newRipple]);
        
        // Remove ripple after animation
        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== newRipple.id));
        }, 2000);
    }, []);

    const handleFocus = () => {
        setIsFocused(true);
        onFocus?.();
    };

    const handleBlur = () => {
        setIsFocused(false);
        onBlur?.();
    };

    return (
        <div 
            ref={containerRef}
            className={`liquid-input-container ${getIntensityClass(intensity)} ${isSplashing ? 'splash' : ''} ${isFocused ? 'focused' : ''}`}
            onClick={handleClick}
        >
            {/* Water surface background */}
            <div className="liquid-input-surface" />
            
            {/* Ripple effects */}
            <div className="liquid-ripples">
                {ripples.map(ripple => (
                    <div
                        key={ripple.id}
                        className="liquid-ripple"
                        style={{
                            left: ripple.x,
                            top: ripple.y,
                            marginLeft: '-150px',
                            marginTop: '-150px'
                        }}
                    />
                ))}
            </div>
            
            {/* The textarea */}
            <textarea
                className="liquid-textarea"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder}
            />
        </div>
    );
}
