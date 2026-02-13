/**
 * Stone Garden Demo - Interactive preview for landing page
 * Matches the actual app design exactly
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import './StoneGardenDemo.css';

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
    const [stones, setStones] = useState<DemoStone[]>([]);
    const [hoveredStone, setHoveredStone] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Generate demo stones based on current language
    useEffect(() => {
        const generateStones = (): DemoStone[] => {
            const lang = i18n.language;
            
            const titles: Record<string, string[]> = {
                en: ['Difficult conversation', 'Feeling anxious', 'Small win today', 'Overwhelmed at work', 'Peaceful morning'],
                ru: ['Трудный разговор', 'Тревожность', 'Маленькая победа', 'Перегруз на работе', 'Спокойное утро'],
                da: ['Svær samtale', 'Føler mig ængstelig', 'Lille sejr i dag', 'Overvældet på arbejde', 'Fredelig morgen'],
            };
            
            const currentTitles = titles[lang] || titles.en;
            
            return [
                {
                    id: '1',
                    x: 20,
                    y: 30,
                    size: 90,
                    opacity: 1,
                    intensity: 9,
                    title: currentTitles[0],
                    date: new Date(Date.now() - 86400000).toLocaleDateString(),
                },
                {
                    id: '2',
                    x: 65,
                    y: 45,
                    size: 65,
                    opacity: 0.8,
                    intensity: 6,
                    title: currentTitles[1],
                    date: new Date(Date.now() - 172800000).toLocaleDateString(),
                },
                {
                    id: '3',
                    x: 40,
                    y: 70,
                    size: 50,
                    opacity: 0.6,
                    intensity: 4,
                    title: currentTitles[2],
                    date: new Date(Date.now() - 259200000).toLocaleDateString(),
                },
                {
                    id: '4',
                    x: 75,
                    y: 20,
                    size: 75,
                    opacity: 0.9,
                    intensity: 7,
                    title: currentTitles[3],
                    date: new Date(Date.now() - 43200000).toLocaleDateString(),
                },
                {
                    id: '5',
                    x: 50,
                    y: 15,
                    size: 40,
                    opacity: 0.4,
                    intensity: 3,
                    title: currentTitles[4],
                    date: new Date(Date.now() - 604800000).toLocaleDateString(),
                },
            ];
        };

        setStones(generateStones());
    }, [i18n.language]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    }, []);

    const hoveredStoneData = hoveredStone ? stones.find(s => s.id === hoveredStone) : null;

    return (
        <div className="stone-garden-demo" onMouseMove={handleMouseMove}>
            {/* View switcher - matches app */}
            <div className="demo-view-switcher">
                <div className="demo-view-btn active" title="Scatter View"></div>
                <div className="demo-view-btn" title="Piles View"></div>
                <div className="demo-view-btn" title="Cairn View"></div>
            </div>

            <div className="demo-garden-container">
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
                            zIndex: Math.floor(stone.opacity * 100),
                        }}
                        onMouseEnter={() => setHoveredStone(stone.id)}
                        onMouseLeave={() => setHoveredStone(null)}
                    />
                ))}
            </div>

            {/* Tooltip - identical to app */}
            {hoveredStoneData && (
                <div 
                    className="demo-stone-tooltip"
                    style={{
                        left: `${mousePos.x}px`,
                        top: `${mousePos.y - 10}px`,
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
