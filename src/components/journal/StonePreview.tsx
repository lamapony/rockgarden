import { useTranslation } from 'react-i18next';
import './StonePreview.css';

interface StonePreviewProps {
    intensity: number;
}

export function StonePreview({ intensity }: StonePreviewProps) {
    const { t } = useTranslation();

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

    return (
        <div className="stone-preview-container">
            <div 
                className={`stone-preview intensity-${intensity}`}
                aria-label={`${t('journal.intensity')}: ${intensity}/10`}
            />
            <span className={`stone-preview-label ${getLabelClass(intensity)}`}>
                {getIntensityLabel(intensity)} • {intensity}/10
            </span>
        </div>
    );
}
