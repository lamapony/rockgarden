import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Grid3X3, Columns2, Layers } from 'lucide-react';
import type { DecryptedEntry } from '../../types';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useLongPress } from '../../hooks/useLongPress';
import './StoneVisualization.css';

type LayoutMode = 'layout-scatter' | 'layout-piles' | 'layout-cairn';

interface StoneComponentProps {
    stone: StoneData;
    isMobile: boolean;
    isHovered: boolean;
    onPreview?: (id: string) => void;
    onEdit: (id: string) => void;
    onHover: (stone: StoneData, e: React.MouseEvent) => void;
    onLeave: () => void;
    getStoneFilters: (intensity: number, opacity: number) => string;
    getStoneGlow: (intensity: number, opacity: number) => string;
}

function StoneComponent({ 
    stone, 
    isMobile, 
    isHovered, 
    onPreview, 
    onEdit, 
    onHover, 
    onLeave,
    getStoneFilters,
    getStoneGlow,
}: StoneComponentProps) {
    const [isPressed, setIsPressed] = useState(false);

    const longPressHandlers = useLongPress({
        onShortPress: () => {
            // On mobile: short tap = preview
            // On desktop: click = edit (backward compatible)
            if (isMobile && onPreview) {
                onPreview(stone.id);
            } else {
                onEdit(stone.id);
            }
        },
        onLongPress: () => {
            // On mobile: long press = edit
            if (isMobile) {
                onEdit(stone.id);
            }
        },
        delay: 400,
        onPressStart: () => setIsPressed(true),
        onPressEnd: () => setIsPressed(false),
    });

    const handleClick = () => {
        // Desktop behavior: click opens edit
        if (!isMobile) {
            onEdit(stone.id);
        }
    };

    return (
        <div
            className={`stone ${stone.intensityClass} ${isHovered ? 'hovered' : ''} ${isPressed ? 'pressed' : ''}`}
            style={{
                left: `${stone.x}px`,
                top: `${stone.y}px`,
                width: `${stone.size}px`,
                height: `${stone.size}px`,
                opacity: stone.opacity,
                borderRadius: stone.borderRadius,
                filter: `${getStoneFilters(stone.intensity, stone.opacity)}${stone.blur > 0 ? ` blur(${stone.blur}px)` : ''}`,
                boxShadow: getStoneGlow(stone.intensity, stone.opacity),
                zIndex: isPressed ? 1000 : stone.zIndex,
                transform: isPressed ? 'scale(0.95)' : 'scale(1)',
            }}
            onClick={handleClick}
            onMouseEnter={(e) => onHover(stone, e)}
            onMouseLeave={onLeave}
            {...(isMobile ? longPressHandlers : {})}
        />
    );
}

interface StoneVisualizationProps {
    entries: DecryptedEntry[];
    onEntryClick: (id: string) => void;
    onAddEntry: () => void;
    onEntryPreview?: (id: string) => void;
}

interface StoneData {
    id: string;
    date: Date;
    intensity: number;
    title: string;
    x: number;
    y: number;
    size: number;
    opacity: number;
    borderRadius: string;
    blur: number;
    zIndex: number;
    intensityClass: string;
}

export function StoneVisualization({ entries, onEntryClick, onAddEntry, onEntryPreview }: StoneVisualizationProps) {
    const { t, i18n } = useTranslation();
    const isMobile = useIsMobile();
    const containerRef = useRef<HTMLDivElement>(null);
    const [layoutMode, setLayoutMode] = useState<LayoutMode>('layout-scatter');
    const [stones, setStones] = useState<StoneData[]>([]);
    const [hoveredStone, setHoveredStone] = useState<string | null>(null);
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number; placement?: 'above' | 'below' }>({ x: 0, y: 0, placement: 'above' });
    const [, setDimensions] = useState({ width: 0, height: 0 });
    
    // Swipe handling refs
    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);
    const minSwipeDistance = 50;
    
    const layoutModes: LayoutMode[] = ['layout-scatter', 'layout-piles', 'layout-cairn'];

    // Filter out archived entries
    const visibleEntries = useMemo(() => {
        return entries.filter(entry => !entry.isArchived);
    }, [entries]);

    // Sort entries by date
    const sortedEntries = useMemo(() => {
        return [...visibleEntries].sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
    }, [visibleEntries]);

    // Calculate fade based on time and intensity
    // Small stones (low intensity) fade faster, large stones (high intensity) fade slower
    const calculateOpacity = useCallback((entry: DecryptedEntry): number => {
        const now = Date.now();
        const ageMs = now - entry.createdAt;
        const ageDays = ageMs / (1000 * 60 * 60 * 24);
        
        // Intensity factor: higher intensity = slower fade
        // intensity 1 → fade multiplier 1.5 (faster fade)
        // intensity 10 → fade multiplier 0.5 (slower fade)
        const intensityFactor = 1.6 - (entry.intensity / 10); // 1.5 to 0.6
        
        // Base fade: entries fade over time
        // Small stones (intensity 1): fade over ~7 days
        // Large stones (intensity 10): fade over ~60 days
        const baseFadeDays = 7 + (entry.intensity * 6); // 7 to 67 days
        const adjustedFadeDays = baseFadeDays / intensityFactor;
        
        // Calculate opacity: starts at 1, fades to minimum 0.15
        const fadeProgress = Math.min(ageDays / adjustedFadeDays, 1);
        const minOpacity = 0.15;
        const maxOpacity = 1.0;
        
        return maxOpacity - (fadeProgress * (maxOpacity - minOpacity));
    }, []);

    // Calculate stone size based on intensity
    // INVERTED: Lower intensity (calm) = larger stone, Higher intensity (strong) = smaller stone
    // This creates a visual metaphor: calm moments are 'bigger' in memory
    const calculateSize = useCallback((intensity: number, layoutMode: LayoutMode): number => {
        // Invert intensity: 1 becomes 1.0, 10 becomes 0.0
        const invertedFactor = (11 - intensity) / 10;
        
        if (layoutMode === 'layout-scatter') {
            // Scatter: small 40px (strong) to large 110px (calm)
            const minSize = 40;
            const maxSize = 110;
            return minSize + (invertedFactor * (maxSize - minSize));
        } else if (layoutMode === 'layout-piles') {
            // Piles: smaller range for stacking
            const minSize = 35;
            const maxSize = 75;
            return minSize + (invertedFactor * (maxSize - minSize));
        } else {
            // Cairn: larger stones
            const minSize = 50;
            const maxSize = 140;
            return minSize + (invertedFactor * (maxSize - minSize));
        }
    }, []);

    // Calculate stone positions based on layout mode
    const calculateStones = useCallback((): StoneData[] => {
        if (!containerRef.current || sortedEntries.length === 0) return [];

        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight;
        setDimensions({ width, height });

        return sortedEntries.map((entry, index) => {
            const recency = index / sortedEntries.length;
            
            // Calculate opacity based on time and intensity
            const opacity = calculateOpacity(entry);
            
            // Generate organic stone shape
            const r1 = 40 + Math.random() * 20;
            const r2 = 40 + Math.random() * 20;
            const r3 = 40 + Math.random() * 20;
            const r4 = 40 + Math.random() * 20;
            const borderRadius = `${r1}% ${100 - r1}% ${r3}% ${100 - r3}% / ${r2}% ${r4}% ${100 - r4}% ${100 - r2}%`;

            // CSS class for intensity color
            const intensityClass = `stone-intensity-${entry.intensity}`;

            let x = 0, y = 0, size = 0, zIndex = 0, blur = 0;

            if (layoutMode === 'layout-scatter') {
                // Scatter view: size based on intensity, position with some randomness
                size = calculateSize(entry.intensity, layoutMode);
                x = Math.random() * (width - size - 20) + 10;
                const yBase = (1 - recency) * (height - size - 20);
                const yNoise = (Math.random() - 0.5) * 100;
                y = Math.max(10, Math.min(height - size - 10, yBase + yNoise));
                zIndex = Math.floor(recency * 100);
                // Slight blur for very old entries
                const ageDays = (Date.now() - entry.createdAt) / (1000 * 60 * 60 * 24);
                blur = ageDays > 30 ? Math.min((ageDays - 30) / 30, 3) : 0;
            } else if (layoutMode === 'layout-piles') {
                // Piles view: columns by time period
                const colCount = Math.min(10, Math.max(3, Math.floor(width / 80)));
                const colIndex = Math.floor(recency * colCount);
                size = calculateSize(entry.intensity, layoutMode);
                const colWidth = width / colCount;
                const centerX = (colIndex * colWidth) + (colWidth / 2) - (size / 2);
                const jitterX = (Math.random() - 0.5) * 20;
                x = centerX + jitterX;
                
                const myIndexInCol = sortedEntries.filter((_, i) => 
                    i < index && Math.floor((i / sortedEntries.length) * colCount) === colIndex
                ).length;
                
                y = height - size - 10 - (myIndexInCol * 35);
                zIndex = myIndexInCol;
                blur = 0;
            } else if (layoutMode === 'layout-cairn') {
                // Cairn view: stacked stones
                size = calculateSize(entry.intensity, layoutMode);
                const centerX = (width / 2) - (size / 2);
                const jitterX = (Math.random() - 0.5) * 40;
                x = centerX + jitterX;
                const step = height / (sortedEntries.length + 5);
                y = height - size - 20 - (index * step * 0.8);
                zIndex = index;
                blur = 0;
            }

            return {
                id: entry.id,
                date: new Date(entry.createdAt),
                intensity: entry.intensity,
                title: entry.content.title || t('journal.untitled'),
                x,
                y,
                size,
                opacity,
                borderRadius,
                blur,
                zIndex,
                intensityClass,
            };
        });
    }, [sortedEntries, layoutMode, t, calculateOpacity, calculateSize]);

    // Recalculate stones when entries or layout changes
    useEffect(() => {
        const stones = calculateStones();
        setStones(stones);
    }, [calculateStones]);

    // Periodically update opacity to simulate fading over time
    useEffect(() => {
        const interval = setInterval(() => {
            setStones(currentStones => 
                currentStones.map(stone => {
                    const entry = sortedEntries.find(e => e.id === stone.id);
                    if (!entry) return stone;
                    return {
                        ...stone,
                        opacity: calculateOpacity(entry),
                    };
                })
            );
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [sortedEntries, calculateOpacity]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            const newStones = calculateStones();
            setStones(newStones);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [calculateStones]);

    const handleStoneHover = (stone: StoneData, e: React.MouseEvent) => {
        setHoveredStone(stone.id);
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
            const stoneY = rect.top - containerRect.top;
            const stoneHeight = rect.height;
            const containerHeight = containerRect.height;
            
            // If stone is in top 30% of container, show tooltip below
            const isTopPosition = stoneY < containerHeight * 0.3;
            
            setTooltipPos({
                x: rect.left - containerRect.left + rect.width / 2,
                y: isTopPosition 
                    ? stoneY + stoneHeight + 10  // Below stone
                    : stoneY - 10,               // Above stone
                placement: isTopPosition ? 'below' : 'above',
            });
        }
    };

    const hoveredStoneData = hoveredStone ? stones.find(s => s.id === hoveredStone) : null;

    // Swipe handlers
    const onTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.targetTouches[0].clientX;
        touchStartY.current = e.targetTouches[0].clientY;
    };

    const onTouchMove = (e: React.TouchEvent) => {
        // Prevent default only for horizontal swipes
        if (touchStartX.current !== null && touchStartY.current !== null) {
            const diffX = Math.abs(e.targetTouches[0].clientX - touchStartX.current);
            const diffY = Math.abs(e.targetTouches[0].clientY - touchStartY.current);
            if (diffX > diffY && diffX > 10) {
                e.preventDefault();
            }
        }
    };

    const onTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartX.current || !touchStartY.current) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const diffX = touchStartX.current - touchEndX;
        const diffY = touchStartY.current - touchEndY;
        
        // Only handle horizontal swipes
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > minSwipeDistance) {
            const currentIndex = layoutModes.indexOf(layoutMode);
            
            if (diffX > 0) {
                // Swipe left - next view
                const nextIndex = (currentIndex + 1) % layoutModes.length;
                setLayoutMode(layoutModes[nextIndex]);
            } else {
                // Swipe right - previous view
                const prevIndex = (currentIndex - 1 + layoutModes.length) % layoutModes.length;
                setLayoutMode(layoutModes[prevIndex]);
            }
        }
        
        touchStartX.current = null;
        touchStartY.current = null;
    };

    const getLayoutIcon = (mode: LayoutMode) => {
        switch (mode) {
            case 'layout-scatter':
                return <Grid3X3 size={14} />;
            case 'layout-piles':
                return <Columns2 size={14} />;
            case 'layout-cairn':
                return <Layers size={14} />;
        }
    };

    // Calculate visual saturation and brightness based on intensity and age
    // High intensity = more saturated, New = brighter (strong white)
    const getStoneFilters = (intensity: number, opacity: number): string => {
        // Saturation: 1 (low intensity) to 2.2 (high intensity) - much more saturated
        const saturation = 1 + ((intensity - 1) / 10) * 1.5;
        
        // Brightness: newer stones (higher opacity) are brighter
        // Base brightness 1.0 to 1.5 for very fresh stones
        const brightness = 1 + (opacity - 0.4) * 0.8;
        
        // Contrast: slightly increase for vividness
        const contrast = 1 + ((intensity - 1) / 10) * 0.4;
        
        return `saturate(${saturation.toFixed(2)}) brightness(${brightness.toFixed(2)}) contrast(${contrast.toFixed(2)})`;
    };

    // Calculate box shadow for glow effect on bright/new stones
    const getStoneGlow = (intensity: number, opacity: number): string => {
        // Only bright stones get glow
        if (opacity < 0.6) return '0 4px 30px rgba(0, 0, 0, 0.5)';
        
        // Higher intensity = stronger glow (even for dark colors, the glow is more pronounced)
        const glowIntensity = 0.1 + (intensity / 10) * 0.4;
        const glowSize = 10 + (intensity / 10) * 30;
        
        return `0 4px 30px rgba(0, 0, 0, 0.5), 0 0 ${glowSize}px rgba(255, 255, 255, ${glowIntensity})`;
    };

    if (entries.length === 0) {
        return (
            <div className="stone-visualization-empty">
                <div className="stone-empty-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v8M8 12h8" />
                    </svg>
                </div>
                <p className="stone-empty-text">{t('journal.empty')}</p>
                <p className="stone-empty-hint">{t('journal.emptyHint')}</p>
                <button className="stone-add-btn" onClick={onAddEntry}>
                    + {t('journal.addEntry')}
                </button>
            </div>
        );
    }

    return (
        <div className="stone-visualization">
            {/* View switcher with labels */}
            <div className="view-switcher">
                <button 
                    className={`view-btn ${layoutMode === 'layout-scatter' ? 'active' : ''}`}
                    onClick={() => setLayoutMode('layout-scatter')}
                    title={t('journal.viewScatter')}
                >
                    {getLayoutIcon('layout-scatter')}
                    <span className="view-label">{t('journal.viewScatter')}</span>
                </button>
                <button 
                    className={`view-btn ${layoutMode === 'layout-piles' ? 'active' : ''}`}
                    onClick={() => setLayoutMode('layout-piles')}
                    title={t('journal.viewPiles')}
                >
                    {getLayoutIcon('layout-piles')}
                    <span className="view-label">{t('journal.viewPiles')}</span>
                </button>
                <button 
                    className={`view-btn ${layoutMode === 'layout-cairn' ? 'active' : ''}`}
                    onClick={() => setLayoutMode('layout-cairn')}
                    title={t('journal.viewCairn')}
                >
                    {getLayoutIcon('layout-cairn')}
                    <span className="view-label">{t('journal.viewCairn')}</span>
                </button>
            </div>

            {/* Stones container with swipe support */}
            <div 
                ref={containerRef}
                className={`stones-container ${layoutMode}`}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {stones.map((stone) => (
                    <StoneComponent
                        key={stone.id}
                        stone={stone}
                        isMobile={isMobile}
                        isHovered={hoveredStone === stone.id}
                        onPreview={onEntryPreview}
                        onEdit={onEntryClick}
                        onHover={handleStoneHover}
                        onLeave={() => setHoveredStone(null)}
                        getStoneFilters={getStoneFilters}
                        getStoneGlow={getStoneGlow}
                    />
                ))}
            </div>

            {/* Tooltip */}
            {hoveredStoneData && (
                <div 
                    className={`stone-tooltip ${tooltipPos.placement === 'below' ? 'tooltip-below' : 'tooltip-above'}`}
                    style={{
                        left: `${tooltipPos.x}px`,
                        top: `${tooltipPos.y}px`,
                    }}
                >
                    <h4>{hoveredStoneData.date.toLocaleDateString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric' })}</h4>
                    <p className="stone-tooltip-title">{hoveredStoneData.title}</p>
                    <p className="stone-tooltip-intensity">
                        {t('journal.intensity')}: {hoveredStoneData.intensity}/10
                    </p>
                </div>
            )}

            {/* Add entry button */}
            <button className="entry-trigger" onClick={onAddEntry}>
                <span className="entry-trigger-icon">+</span>
                <span className="entry-trigger-text">{t('journal.captureEntry')}</span>
            </button>
        </div>
    );
}
