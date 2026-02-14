import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Edit2, Calendar, Gauge } from 'lucide-react';
import type { DecryptedEntry } from '../../types';
import './EntryPreview.css';

interface EntryPreviewProps {
    entry: DecryptedEntry | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit: () => void;
}

export function EntryPreview({ entry, isOpen, onClose, onEdit }: EntryPreviewProps) {
    const { t, i18n } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Small delay for animation
            requestAnimationFrame(() => setIsVisible(true));
        } else {
            setIsVisible(false);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen || !entry) return null;

    const date = new Date(entry.createdAt);
    const formattedDate = date.toLocaleDateString(i18n.language, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString(i18n.language, {
        hour: '2-digit',
        minute: '2-digit',
    });

    // Get intensity label based on value
    const getIntensityLabel = (value: number): string => {
        if (value <= 3) return t('journal.mild');
        if (value <= 6) return t('journal.moderate');
        return t('journal.severe');
    };

    // Get intensity color class
    const getIntensityClass = (value: number): string => {
        if (value <= 3) return 'intensity-low';
        if (value <= 6) return 'intensity-medium';
        return 'intensity-high';
    };

    return (
        <div 
            className={`entry-preview-overlay ${isVisible ? 'visible' : ''}`}
            onClick={onClose}
        >
            <div 
                className={`entry-preview-modal ${isVisible ? 'visible' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="entry-preview-header">
                    <div className="entry-preview-meta">
                        <div className="entry-preview-date">
                            <Calendar size={14} />
                            <span>{formattedDate}</span>
                            <span className="entry-preview-time">{formattedTime}</span>
                        </div>
                        <div className={`entry-preview-intensity ${getIntensityClass(entry.intensity)}`}>
                            <Gauge size={14} />
                            <span>{t('journal.intensity')}: {entry.intensity}/10</span>
                            <span className="intensity-label">({getIntensityLabel(entry.intensity)})</span>
                        </div>
                    </div>
                    <button 
                        className="entry-preview-close"
                        onClick={onClose}
                        aria-label={t('common.close')}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="entry-preview-content">
                    {entry.content.title && (
                        <h3 className="entry-preview-title">
                            {entry.content.title}
                        </h3>
                    )}
                    
                    {entry.content.text ? (
                        <div className="entry-preview-text">
                            {entry.content.text.split('\n').map((paragraph, idx) => (
                                <p key={idx}>{paragraph}</p>
                            ))}
                        </div>
                    ) : (
                        <p className="entry-preview-empty">{t('journal.noContent')}</p>
                    )}
                </div>

                {/* Footer with actions */}
                <div className="entry-preview-footer">
                    <div className="preview-hint">
                        <span className="hint-icon">👆</span>
                        <span>{t('journal.tapHint')}</span>
                    </div>
                    <button 
                        className="entry-preview-edit"
                        onClick={onEdit}
                    >
                        <Edit2 size={16} />
                        <span>{t('common.edit')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
