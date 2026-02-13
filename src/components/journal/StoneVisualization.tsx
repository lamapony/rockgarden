import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { DecryptedEntry } from '../../types';
import './StoneVisualization.css';

type LayoutMode = 'layout-piles' | 'layout-cairn';

interface StoneVisualizationProps {
    entries: DecryptedEntry[];
    onEntryClick: (id: string) => void;
    onAddEntry: () => void;
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

export function StoneVisualization({ entries, onEntryClick, onAddEntry }: StoneVisualizationProps) {
    const { t } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const [layoutMode, setLayoutMode] = useState<LayoutMode>('layout-piles');
    const [stones, setStones] = useState<StoneData[]>([]);
    const [hoveredStone, setHoveredStone] = useState<string | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [, setDimensions] = useState({ width: 0, height: 0 });

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
    // Higher intensity = significantly larger stone
    const calculateSize = useCallback((intensity: number, layoutMode: LayoutMode): number => {
        const intensityFactor = intensity / 10;
        
        if (layoutMode === 'layout-piles') {
            // Piles: smaller range for stacking
            const minSize = 30;
            const maxSize = 70;
            return minSize + (intensityFactor * (maxSize - minSize));
        } else {
            // Cairn: larger stones
            const minSize = 60;
            const maxSize = 150;
            return minSize + (intensityFactor * (maxSize - minSize));
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

            if (layoutMode === 'layout-piles') {
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
            setTooltipPos({
                x: rect.left - containerRect.left + rect.width / 2,
                y: rect.top - containerRect.top - 10,
            });
        }
    };

    const hoveredStoneData = hoveredStone ? stones.find(s => s.id === hoveredStone) : null;

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
            {/* View switcher */}
            <div className="view-switcher">
                <button 
                    className={`view-btn ${layoutMode === 'layout-piles' ? 'active' : ''}`}
                    onClick={() => setLayoutMode('layout-piles')}
                    title={t('journal.viewPiles')}
                />
                <button 
                    className={`view-btn ${layoutMode === 'layout-cairn' ? 'active' : ''}`}
                    onClick={() => setLayoutMode('layout-cairn')}
                    title={t('journal.viewCairn')}
                />
            </div>

            {/* Stones container */}
            <div 
                ref={containerRef}
                className={`stones-container ${layoutMode}`}
            >
                {stones.map((stone) => (
                    <div
                        key={stone.id}
                        className={`stone ${stone.intensityClass} ${hoveredStone === stone.id ? 'hovered' : ''}`}
                        style={{
                            left: `${stone.x}px`,
                            top: `${stone.y}px`,
                            width: `${stone.size}px`,
                            height: `${stone.size}px`,
                            opacity: stone.opacity,
                            borderRadius: stone.borderRadius,
                            filter: stone.blur > 0 ? `blur(${stone.blur}px)` : undefined,
                            zIndex: stone.zIndex,
                        }}
                        onClick={() => onEntryClick(stone.id)}
                        onMouseEnter={(e) => handleStoneHover(stone, e)}
                        onMouseLeave={() => setHoveredStone(null)}
                    />
                ))}
            </div>

            {/* Tooltip */}
            {hoveredStoneData && (
                <div 
                    className="stone-tooltip"
                    style={{
                        left: `${tooltipPos.x}px`,
                        top: `${tooltipPos.y}px`,
                    }}
                >
                    <h4>{hoveredStoneData.date.toLocaleDateString()}</h4>
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
