/**
 * Stone Garden Demo - Interactive preview for landing page
 * Simulates the actual app experience
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
    borderRadius: string;
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
                    x: 15,
                    y: 25,
                    size: 85,
                    opacity: 1,
                    intensity: 9,
                    title: currentTitles[0],
                    date: new Date(Date.now() - 86400000).toLocaleDateString(),
                    borderRadius: '45% 55% 40% 60% / 55% 45% 55% 45%',
                },
                {
                    id: '2',
                    x: 65,
                    y: 40,
                    size: 60,
                    opacity: 0.75,
                    intensity: 6,
                    title: currentTitles[1],
                    date: new Date(Date.now() - 172800000).toLocaleDateString(),
                    borderRadius: '55% 45% 60% 40% / 45% 55% 35% 65%',
                },
                {
                    id: '3',
                    x: 35,
                    y: 65,
                    size: 45,
                    opacity: 0.5,
                    intensity: 4,
                    title: currentTitles[2],
                    date: new Date(Date.now() - 259200000).toLocaleDateString(),
                    borderRadius: '40% 60% 55% 45% / 60% 40% 45% 55%',
                },
                {
                    id: '4',
                    x: 75,
                    y: 70,
                    size: 70,
                    opacity: 0.85,
                    intensity: 7,
                    title: currentTitles[3],
                    date: new Date(Date.now() - 43200000).toLocaleDateString(),
                    borderRadius: '50% 50% 45% 55% / 55% 45% 50% 50%',
                },
                {
                    id: '5',
                    x: 50,
                    y: 15,
                    size: 35,
                    opacity: 0.35,
                    intensity: 3,
                    title: currentTitles[4],
                    date: new Date(Date.now() - 604800000).toLocaleDateString(),
                    borderRadius: '60% 40% 50% 50% / 40% 60% 50% 50%',
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
                            borderRadius: stone.borderRadius,
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

            {/* Labels */}
            <div className="demo-garden-labels">
                <div className="demo-label">
                    <span className="demo-label-dot high"></span>
                    <span>{t('journal.intensity')}: 9/10</span>
                </div>
                <div className="demo-label">
                    <span className="demo-label-dot medium"></span>
                    <span>{t('journal.intensity')}: 6/10</span>
                </div>
                <div className="demo-label">
                    <span className="demo-label-dot low"></span>
                    <span>{t('journal.intensity')}: 3/10</span>
                </div>
            </div>
        </div>
    );
}
