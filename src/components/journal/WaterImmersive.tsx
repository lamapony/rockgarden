import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import './WaterImmersive.css';

interface WaterImmersiveProps {
    isActive: boolean;
    intensity: number;
    text: string;
    onComplete: () => void;
}

type AnimationPhase = 'idle' | 'hover' | 'drop' | 'splash' | 'ripples' | 'fade' | 'done';

export function WaterImmersive({ isActive, intensity, text, onComplete }: WaterImmersiveProps) {
    const { t } = useTranslation();
    const [phase, setPhase] = useState<AnimationPhase>('idle');
    const [showContent, setShowContent] = useState(false);
    const animationStarted = useRef(false);
    const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    // Generate droplets once using useMemo
    const droplets = useMemo(() => {
        const newDroplets = [];
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const distance = 100 + Math.random() * 100;
            const tx = `${Math.cos(angle) * distance}px`;
            const ty = `${-Math.sin(angle) * distance - 50}px`;
            newDroplets.push({ id: i, tx, ty, delay: Math.random() * 0.2 });
        }
        return newDroplets;
    }, []);

    // Clear all timeouts
    const clearAllTimeouts = () => {
        timeoutsRef.current.forEach(id => clearTimeout(id));
        timeoutsRef.current = [];
    };

    // Animation sequence
    useEffect(() => {
        if (!isActive) {
            setPhase('idle');
            setShowContent(false);
            animationStarted.current = false;
            clearAllTimeouts();
            return;
        }

        // Prevent restarting animation if already started
        if (animationStarted.current) return;
        animationStarted.current = true;

        // Start sequence
        setPhase('hover');
        setShowContent(true);

        // Schedule all phases
        const schedule = (callback: () => void, delay: number) => {
            const id = setTimeout(callback, delay);
            timeoutsRef.current.push(id);
        };

        // Start drop after 2 seconds
        schedule(() => setPhase('drop'), 2000);

        // Splash when stone hits water
        schedule(() => setPhase('splash'), 3500);

        // Ripples phase
        schedule(() => setPhase('ripples'), 4000);

        // Fade out
        schedule(() => setPhase('fade'), 5000);

        // Complete
        schedule(() => {
            setPhase('done');
            onComplete();
        }, 5800);

        return () => {
            clearAllTimeouts();
        };
    }, [isActive, onComplete]);

    // Don't render if not active or animation is done
    if (!isActive || phase === 'done') return null;

    const getIntensityClass = (value: number): string => {
        return `intensity-${value}`;
    };

    const getPhaseClass = (): string => {
        return `phase-${phase}`;
    };

    return (
        <div className={`water-immersive ${phase === 'fade' ? 'fade-out' : ''}`}>
            {/* Water background */}
            <div className="water-surface">
                <div className="water-caustics" />
                <div className="water-waves">
                    <div className="water-wave" />
                    <div className="water-wave" />
                    <div className="water-wave" />
                </div>
            </div>

            {/* Falling stone */}
            {(phase === 'hover' || phase === 'drop') && (
                <div className={`falling-stone-container ${getPhaseClass()}`}>
                    <div className={`falling-stone ${getIntensityClass(intensity)}`} />
                </div>
            )}

            {/* Splash effect */}
            {(phase === 'splash' || phase === 'ripples') && (
                <div className="splash-container">
                    <div className={`splash-main ${phase === 'splash' ? 'active' : ''}`} />
                    <div className="splash-droplets">
                        {droplets.map((d) => (
                            <div
                                key={d.id}
                                className={`droplet ${phase === 'splash' ? 'active' : ''}`}
                                style={{
                                    ['--tx' as string]: d.tx,
                                    ['--ty' as string]: d.ty,
                                    animationDelay: `${d.delay}s`
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Water ripples */}
            {phase === 'ripples' && (
                <div className="water-ripples-container">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="water-ripple-ring active"
                            style={{ animationDelay: `${i * 0.3}s` }}
                        />
                    ))}
                </div>
            )}

            {/* Text content */}
            <div className={`water-content ${showContent ? 'visible' : ''}`}>
                <h2>{t('journal.stoneThrown')}</h2>
                <p>{text.slice(0, 50)}{text.length > 50 ? '...' : ''}</p>
            </div>
        </div>
    );
}
