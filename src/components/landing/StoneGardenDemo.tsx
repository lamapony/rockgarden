/**
 * Stone Garden Demo - Interactive preview for landing page
 * Matches the actual app design exactly with working view switcher
 * Supports both hover (desktop) and touch (mobile) interactions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './StoneGardenDemo.css';

type ViewMode = 'scatter' | 'piles' | 'cairn';

interface DemoStone {
    id: string;
    x: number;
    y: number;
    size: number;
    opacity: number;
    intensity: number;
    title: string;
    date: string;
}

// Long press duration in ms
const LONG_PRESS_DURATION = 400;

export function StoneGardenDemo() {
    const { t, i18n } = useTranslation();
    const [viewMode, setViewMode] = useState<ViewMode>('scatter');
    const [stones, setStones] = useState<DemoStone[]>([]);
    const [hoveredStone, setHoveredStone] = useState<string | null>(null);
    const [tappedStone, setTappedStone] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState<{ x: number; y: number; placement?: 'above' | 'below' }>({ x: 0, y: 0, placement: 'above' });
    
    // Refs for touch handling
    const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Generate demo stones based on current language and view mode
    useEffect(() => {
        const generateStones = (): DemoStone[] => {
            const lang = i18n.language;
            
            const titles: Record<string, string[]> = {
                en: ['Difficult conversation', 'Feeling anxious', 'Small win today', 'Overwhelmed at work', 'Peaceful morning'],
                ru: ['Трудный разговор', 'Тревожность', 'Маленькая победа', 'Перегруз на работе', 'Спокойное утро'],
                da: ['Svær samtale', 'Føler mig ængstelig', 'Lille sejr i dag', 'Overvældet på arbejde', 'Fredelig morgen'],
                lt: ['Sunkus pokalbis', 'Jauciu nerima', 'Maza pergale', 'Permetimas darbe', 'Ramus rytas'],
                lv: ['Grūta saruna', 'Jūtu trauksmi', 'Maza uzvara', 'Pārslodze darbā', 'Mierīgs rīts'],
                et: ['Raske vestlus', 'Ärevustunne', 'Väike võit', 'Ülekoormus tööl', 'Rahulik hommik'],
                uk: ['Важка розмова', 'Тривожність', 'Маленька перемога', 'Перевантаження', 'Спокійний ранок'],
                pl: ['Trudna rozmowa', 'Niepokój', 'Małe zwycięstwo', 'Przeładowanie', 'Spokojny poranek'],
                pt: ['Conversa difícil', 'Ansiedade', 'Pequena vitória', 'Sobrecarga', 'Manhã tranquila'],
                es: ['Conversación difícil', 'Ansiedad', 'Pequeña victoria', 'Sobrecarga', 'Mañana tranquila'],
                fr: ['Conversation difficile', 'Anxiété', 'Petite victoire', 'Surcharge', 'Matin paisible'],
                de: ['Schwieriges Gespräch', 'Angst', 'Kleiner Sieg', 'Überlastung', 'Ruhiger Morgen'],
                it: ['Conversazione difficile', 'Ansia', 'Piccola vittoria', 'Sovraccarico', 'Mattina tranquilla'],
                tr: ['Zor konuşma', 'Kaygı', 'Küçük zafer', 'Aşırı yük', 'Huzurlu sabah'],
            };
            
            const currentTitles = titles[lang] || titles.en;
            
            const baseStones = [
                { id: '1', intensity: 9, title: currentTitles[0], dateOffset: 86400000 },
                { id: '2', intensity: 6, title: currentTitles[1], dateOffset: 172800000 },
                { id: '3', intensity: 4, title: currentTitles[2], dateOffset: 259200000 },
                { id: '4', intensity: 7, title: currentTitles[3], dateOffset: 43200000 },
                { id: '5', intensity: 3, title: currentTitles[4], dateOffset: 604800000 },
            ];

            return baseStones.map((stone, index) => {
                let x = 0, y = 0, size = 0, opacity = 0;
                
                // Calculate opacity based on time (same for all modes)
                const ageDays = stone.dateOffset / (1000 * 60 * 60 * 24);
                opacity = Math.max(0.3, 1 - (ageDays / 30));
                
                // Calculate size based on intensity
                const intensityFactor = stone.intensity / 10;
                
                if (viewMode === 'scatter') {
                    // Scatter: random positions, size based on intensity
                    size = 35 + (intensityFactor * 65); // 35-100px
                    x = 10 + (index * 18) + Math.random() * 10;
                    y = 20 + Math.random() * 50;
                } else if (viewMode === 'piles') {
                    // Piles: columns from bottom
                    size = 30 + (intensityFactor * 40); // 30-70px
                    const col = index % 3;
                    x = 20 + (col * 30);
                    y = 75 - (Math.floor(index / 3) * 25) - (index % 3) * 5;
                } else {
                    // Cairn: stacked center
                    size = 50 + (intensityFactor * 60); // 50-110px
                    x = 50 + (Math.random() - 0.5) * 15;
                    y = 75 - (index * 15);
                }
                
                return {
                    ...stone,
                    x,
                    y,
                    size,
                    opacity,
                    date: new Date(Date.now() - stone.dateOffset).toLocaleDateString(),
                };
            });
        };

        setStones(generateStones());
    }, [i18n.language, viewMode]);

    // Clear tapped stone when changing view mode
    useEffect(() => {
        setTappedStone(null);
    }, [viewMode]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const containerHeight = rect.height;
        
        // If mouse is in top 25% of container, show tooltip below cursor
        const isTopPosition = y < containerHeight * 0.25;
        
        setMousePos({
            x: e.clientX - rect.left,
            y: y,
            placement: isTopPosition ? 'below' : 'above',
        });
    }, []);

    // Touch event handlers for mobile
    const handleTouchStart = useCallback((e: React.TouchEvent, stoneId: string) => {
        const touch = e.touches[0];
        touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
        
        // Start long press timer
        touchTimerRef.current = setTimeout(() => {
            // Long press detected
            const stone = stones.find(s => s.id === stoneId);
            if (stone && containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const isTopPosition = (stone.y / 100) * rect.height < rect.height * 0.35;
                
                setMousePos({
                    x: (stone.x / 100) * rect.width + (stone.size / 2),
                    y: (stone.y / 100) * rect.height + (stone.size / 2),
                    placement: isTopPosition ? 'below' : 'above',
                });
                setTappedStone(stoneId);
            }
            touchTimerRef.current = null;
        }, LONG_PRESS_DURATION);
    }, [stones]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!touchStartPosRef.current) return;
        
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStartPosRef.current.x);
        const deltaY = Math.abs(touch.clientY - touchStartPosRef.current.y);
        
        // If moved more than 10px, cancel long press
        if (deltaX > 10 || deltaY > 10) {
            if (touchTimerRef.current) {
                clearTimeout(touchTimerRef.current);
                touchTimerRef.current = null;
            }
        }
    }, []);

    const handleTouchEnd = useCallback((stoneId: string) => {
        // If timer still exists, it was a tap (not long press)
        if (touchTimerRef.current) {
            clearTimeout(touchTimerRef.current);
            touchTimerRef.current = null;
            
            // Toggle tapped stone on tap
            if (tappedStone === stoneId) {
                setTappedStone(null);
            } else {
                const stone = stones.find(s => s.id === stoneId);
                if (stone && containerRef.current) {
                    const rect = containerRef.current.getBoundingClientRect();
                    const isTopPosition = (stone.y / 100) * rect.height < rect.height * 0.35;
                    
                    setMousePos({
                        x: (stone.x / 100) * rect.width + (stone.size / 2),
                        y: (stone.y / 100) * rect.height + (stone.size / 2),
                        placement: isTopPosition ? 'below' : 'above',
                    });
                    setTappedStone(stoneId);
                }
            }
        }
        touchStartPosRef.current = null;
    }, [tappedStone, stones]);

    // Handle tap outside to close tooltip
    const handleContainerTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        // Check if tap was on a stone
        const target = e.target as HTMLElement;
        if (!target.closest('.demo-stone-item')) {
            setTappedStone(null);
        }
    }, []);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (touchTimerRef.current) {
                clearTimeout(touchTimerRef.current);
            }
        };
    }, []);

    // Determine which stone to show tooltip for (hover on desktop, tap on mobile)
    const activeStoneId = hoveredStone || tappedStone;
    const activeStoneData = activeStoneId ? stones.find(s => s.id === activeStoneId) : null;

    return (
        <div 
            ref={containerRef}
            className="stone-garden-demo" 
            onMouseMove={handleMouseMove}
            onClick={handleContainerTap}
            onTouchStart={handleContainerTap}
        >
            {/* View switcher - matches app */}
            <div className="demo-view-switcher">
                <button 
                    className={`demo-view-btn ${viewMode === 'scatter' ? 'active' : ''}`}
                    onClick={() => setViewMode('scatter')}
                    title={t('landing.viewScatter')}
                />
                <button 
                    className={`demo-view-btn ${viewMode === 'piles' ? 'active' : ''}`}
                    onClick={() => setViewMode('piles')}
                    title={t('landing.viewPiles')}
                />
                <button 
                    className={`demo-view-btn ${viewMode === 'cairn' ? 'active' : ''}`}
                    onClick={() => setViewMode('cairn')}
                    title={t('landing.viewCairn')}
                />
            </div>

            <div className={`demo-garden-container layout-${viewMode}`}>
                {stones.map((stone) => (
                    <div
                        key={stone.id}
                        className={`demo-stone-item ${activeStoneId === stone.id ? 'active' : ''}`}
                        style={{
                            left: `${stone.x}%`,
                            top: `${stone.y}%`,
                            width: `${stone.size}px`,
                            height: `${stone.size}px`,
                            opacity: stone.opacity,
                            zIndex: viewMode === 'cairn' ? 100 - parseInt(stone.id) : Math.floor(stone.opacity * 100),
                        }}
                        onMouseEnter={() => setHoveredStone(stone.id)}
                        onMouseLeave={() => setHoveredStone(null)}
                        onTouchStart={(e) => handleTouchStart(e, stone.id)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={() => handleTouchEnd(stone.id)}
                    />
                ))}
            </div>

            {/* Tooltip - identical to app */}
            {activeStoneData && (
                <div 
                    className={`demo-stone-tooltip ${mousePos.placement === 'below' ? 'tooltip-below' : 'tooltip-above'} ${tappedStone ? 'touch-visible' : ''}`}
                    style={{
                        left: `${mousePos.x}px`,
                        top: mousePos.placement === 'below' 
                            ? `${mousePos.y + 20}px`  // Below cursor
                            : `${mousePos.y - 10}px`, // Above cursor
                    }}
                >
                    <h4>{activeStoneData.date}</h4>
                    <p className="demo-tooltip-title">{activeStoneData.title}</p>
                    <p className="demo-tooltip-intensity">
                        {t('journal.intensity')}: {activeStoneData.intensity}/10
                    </p>
                </div>
            )}

            {/* Mobile hint */}
            <div className="demo-mobile-hint">
                {t('landing.tapOrHold')}
            </div>
        </div>
    );
}
