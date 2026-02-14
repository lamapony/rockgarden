import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useEntries } from '../../hooks/useEntries';
import { useIsMobile } from '../../hooks/useIsMobile';
import './EntryModalNew.css';

interface EntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: (entryId?: string) => void;
}

export function EntryModal({ isOpen, onClose, onSaved }: EntryModalProps) {
    const { t } = useTranslation();
    const { createEntry } = useEntries();
    const isMobile = useIsMobile();
    
    const [text, setText] = useState('');
    const [intensity, setIntensity] = useState(5);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Focus textarea when modal opens
    useEffect(() => {
        if (isOpen && textareaRef.current) {
            setTimeout(() => textareaRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setText('');
            setIntensity(5);
            setError(null);
        }
    }, [isOpen]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'Escape') {
                onClose();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                handleSave();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, text, intensity]);

    const handleSave = async () => {
        if (!text.trim()) return;
        
        setIsSaving(true);
        setError(null);
        
        try {
            const entryId = await createEntry(
                { 
                    title: text.slice(0, 50) || t('journal.untitled'), 
                    text, 
                    tags: [] 
                },
                intensity
            );
            onSaved(entryId);
        } catch (e) {
            console.error('Failed to save entry:', e);
            setError(t('common.error'));
        } finally {
            setIsSaving(false);
        }
    };

    // Get animation type based on intensity
    const getAnimationType = (value: number): string => {
        return value <= 5 ? 'calm' : 'anxious';
    };

    // Get aura color based on intensity
    const getAuraColor = (value: number): string => {
        const colors = [
            'rgba(125, 211, 252, 0.15)', // 1 - light blue
            'rgba(147, 197, 253, 0.15)', // 2
            'rgba(165, 180, 252, 0.15)', // 3
            'rgba(216, 180, 254, 0.15)', // 4
            'rgba(249, 168, 212, 0.15)', // 5 - pink
            'rgba(253, 164, 175, 0.15)', // 6
            'rgba(253, 186, 116, 0.15)', // 7
            'rgba(252, 211, 77, 0.15)',  // 8
            'rgba(252, 165, 165, 0.15)', // 9
            'rgba(248, 113, 113, 0.2)',  // 10 - red
        ];
        return colors[value - 1] || colors[0];
    };

    // Calculate slider fill percentage
    const sliderFillPercent = ((intensity - 1) / 9) * 100;

    if (!isOpen) return null;

    return (
        <div 
            className={`entry-modal-overlay ${isOpen ? 'open' : ''}`}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="entry-modal-new">
                {/* Close button */}
                <button 
                    className="entry-modal-close"
                    onClick={onClose}
                    aria-label={t('common.close')}
                >
                    <X size={32} strokeWidth={1.5} />
                </button>

                <div className="entry-modal-split">
                    {/* Left side - Stone preview */}
                    <div className="entry-modal-stone-section">
                        {/* Aura */}
                        <div 
                            className="stone-aura"
                            style={{ backgroundColor: getAuraColor(intensity) }}
                        />
                        
                        {/* Stone */}
                        <div className="stone-preview-wrapper">
                            <div 
                                className={`preview-stone intensity-${intensity} ${getAnimationType(intensity)}`}
                                style={{
                                    transform: text ? `scale(${0.7 + (intensity / 10) * 0.4})` : undefined
                                }}
                            />
                        </div>

                        {/* Label */}
                        <span className="stone-preview-label">
                            {t('journal.preview')}
                        </span>
                    </div>

                    {/* Right side - Form */}
                    <div className="entry-modal-form-section">
                        <div className="glass-panel">
                            <div className="form-content">
                                {/* Error */}
                                {error && (
                                    <div className="error-message" style={{ 
                                        color: '#ef4444', 
                                        fontSize: '0.875rem',
                                        padding: '0.75rem',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        borderRadius: '8px'
                                    }}>
                                        {error}
                                    </div>
                                )}

                                {/* Textarea */}
                                <div className="textarea-group">
                                    <label className="form-label">
                                        {t('journal.description')}
                                    </label>
                                    <div className="textarea-wrapper">
                                        <textarea
                                            ref={textareaRef}
                                            className="textarea-new"
                                            placeholder={t('journal.describeEvent')}
                                            value={text}
                                            onChange={(e) => setText(e.target.value)}
                                            rows={isMobile ? 3 : 4}
                                        />
                                        <div className="cursor-indicator" />
                                    </div>
                                </div>

                                {/* Intensity slider */}
                                <div className="intensity-section">
                                    <div className="intensity-header">
                                        <label className="form-label" style={{ margin: 0 }}>
                                            {t('journal.intensity')}
                                        </label>
                                        <div className="intensity-value">
                                            <span className="intensity-number">{intensity}</span>
                                            <span className="intensity-total">/10</span>
                                        </div>
                                    </div>
                                    
                                    <div className="slider-container">
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={intensity}
                                            onChange={(e) => setIntensity(Number(e.target.value))}
                                            className="slider-input"
                                        />
                                        <div className="slider-track">
                                            <div 
                                                className="slider-fill"
                                                style={{ width: `${sliderFillPercent}%` }}
                                            />
                                        </div>
                                        <div className="slider-ticks">
                                            {[...Array(11)].map((_, i) => (
                                                <div key={i} className="slider-tick" />
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="slider-labels">
                                        <span>{t('journal.mild')}</span>
                                        <span>{t('journal.severe')}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="form-actions">
                                    {!isMobile && (
                                        <div className="keyboard-hint">
                                            <span className="key">Ctrl</span>
                                            <span>+</span>
                                            <span className="key">Enter</span>
                                            <span>{t('common.save')}</span>
                                        </div>
                                    )}
                                    
                                    <div className="action-buttons">
                                        <button 
                                            className="btn-cancel"
                                            onClick={onClose}
                                            disabled={isSaving}
                                        >
                                            {t('common.cancel')}
                                        </button>
                                        <button 
                                            className="btn-save"
                                            onClick={handleSave}
                                            disabled={isSaving || !text.trim()}
                                        >
                                            {isSaving ? t('common.saving') : t('common.save')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
