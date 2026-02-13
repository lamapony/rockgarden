/**
 * Intensity Slider - Stonewall Design
 */

interface IntensitySliderProps {
    value: number;
    onChange: (value: number) => void;
}

export function IntensitySlider({ value, onChange }: IntensitySliderProps) {
    return (
        <div className="intensity-slider">
            <input
                type="range"
                min="1"
                max="10"
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="intensity-range"
            />
            <div className="intensity-markers">
                {Array.from({ length: 10 }, (_, i) => (
                    <div 
                        key={i} 
                        className={`intensity-marker ${i < value ? 'active' : ''}`}
                    />
                ))}
            </div>
        </div>
    );
}
