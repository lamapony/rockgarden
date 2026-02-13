/**
 * Stone Garden Demo - Interactive preview for landing page
 * Matches the actual app design exactly with working view switcher
 */

import { useState, useEffect, useCallback } from 'react';
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

export function StoneGardenDemo() {
    const { t, i18n } = useTranslation();
    const [viewMode, setViewMode] = useState<ViewMode>('scatter');
    const [stones, setStones] = useState<DemoStone[]>([]);
    const [hoveredStone, setHoveredStone] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState<{ x: number; y: number; placement?: 'above' | 'below' }>({ x: 0, y: 0, placement: 'above' });

    // Generate demo stones based on current language and view mode
    useEffect(() => {
        const generateStones = (): DemoStone[] => {
            const lang = i18n.language;
            
            const titles: Record<string, string[]> = {
                en: ['Difficult conversation', 'Feeling anxious', 'Small win today', 'Overwhelmed at work', 'Peaceful morning'],
                ru: ['Трудный разговор', 'Тревожность', 'Маленькая победа', 'Перегруз на работе', 'Спокойное утро'],
                da: ['Svær samtale', 'Føler mig ængstelig', 'Lille sejr i dag', 'Overvældet på arbejde', 'Fredelig morgen'],
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

    const hoveredStoneData = hoveredStone ? stones.find(s => s.id === hoveredStone) : null;

    return (
        <div className="stone-garden-demo" onMouseMove={handleMouseMove}>
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
                        className={`demo-stone-item ${hoveredStone === stone.id ? 'hovered' : ''}`}
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
                    />
                ))}
            </div>

            {/* Tooltip - identical to app */}
            {hoveredStoneData && (
                <div 
                    className={`demo-stone-tooltip ${mousePos.placement === 'below' ? 'tooltip-below' : 'tooltip-above'}`}
                    style={{
                        left: `${mousePos.x}px`,
                        top: mousePos.placement === 'below' 
                            ? `${mousePos.y + 20}px`  // Below cursor
                            : `${mousePos.y - 10}px`, // Above cursor
                    }}
                >
                    <h4>{hoveredStoneData.date}</h4>
                    <p className="demo-tooltip-title">{hoveredStoneData.title}</p>
                    <p className="demo-tooltip-intensity">
                        {t('journal.intensity')}: {hoveredStoneData.intensity}/10
                    </p>
                </div>
            )}
        </div>
    );
}
