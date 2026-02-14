import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertCircle } from 'lucide-react';
import { useEntries } from '../../hooks/useEntries';
import { useIsMobile } from '../../hooks/useIsMobile';
import { StonePreview } from './StonePreview';

interface EntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: (entryId?: string) => void;
}

// Inline styles for guaranteed visibility
const styles = {
    modal: {
        position: 'fixed' as const,
        bottom: 0,
        left: 0,
        width: '100%',
        height: '0',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'flex-end' as const,
        pointerEvents: 'none' as const,
    },
    modalOpen: {
        height: '100vh',
        pointerEvents: 'auto' as const,
    },
    overlay: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.85)',
        opacity: 0,
        transition: 'opacity 0.3s ease',
    },
    overlayOpen: {
        opacity: 1,
    },
    panel: {
        position: 'relative' as const,
        width: '100%',
        maxHeight: '70vh',
        background: '#2a2a2a',
        borderTop: '3px solid #ffffff',
        transform: 'translateY(100%)',
        transition: 'transform 0.5s cubic-bezier(0.19, 1, 0.22, 1)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column' as const,
    },
    panelOpen: {
        transform: 'translateY(0)',
    },
    closeBtn: {
        position: 'absolute' as const,
        top: '1rem',
        right: '1rem',
        background: '#444444',
        border: '1px solid #666666',
        color: '#ffffff',
        cursor: 'pointer',
        padding: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '4px',
        width: '36px',
        height: '36px',
        zIndex: 10,
    },
    content: {
        width: '100%',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '2rem',
        opacity: 0,
        transform: 'translateY(20px)',
        transition: 'all 0.4s 0.1s',
        overflowY: 'auto' as const,
    },
    contentOpen: {
        opacity: 1,
        transform: 'translateY(0)',
    },
    error: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1rem',
        marginBottom: '1.5rem',
        background: '#451a1a',
        border: '2px solid #ef4444',
        color: '#ff8888',
        fontSize: '0.875rem',
        borderRadius: '4px',
    },
    inputGroup: {
        marginBottom: '1.5rem',
    },
    label: {
        display: 'block',
        color: '#cccccc',
        textTransform: 'uppercase' as const,
        fontSize: '0.75rem',
        letterSpacing: '0.1em',
        marginBottom: '0.75rem',
        fontWeight: 700,
    },
    textarea: {
        width: '100%',
        background: '#3a3a3a',
        border: '2px solid #555555',
        borderRadius: '6px',
        color: '#ffffff',
        fontFamily: 'inherit',
        fontSize: '1.1rem',
        padding: '0.875rem',
        resize: 'none' as const,
        outline: 'none',
        minHeight: '100px',
    },
    sliderContainer: {
        padding: '1rem',
        background: '#333333',
        borderRadius: '6px',
    },
    slider: {
        width: '100%',
        height: '8px',
        background: '#555555',
        borderRadius: '4px',
        outline: 'none',
        WebkitAppearance: 'none' as const,
        appearance: 'none' as const,
    },
    sliderLabels: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.75rem',
        color: '#aaaaaa',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        marginTop: '0.75rem',
    },
    intensityValue: {
        color: '#ffffff',
        fontWeight: 700,
        fontSize: '1rem',
        background: '#444444',
        padding: '0.25rem 0.75rem',
        borderRadius: '4px',
        minWidth: '2rem',
        textAlign: 'center' as const,
    },
    hint: {
        textAlign: 'center' as const,
        fontSize: '0.8rem',
        color: '#999999',
        marginBottom: '1rem',
        marginTop: '1rem',
    },
    kbd: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '2rem',
        height: '1.75rem',
        padding: '0 0.5rem',
        background: '#444444',
        border: '1px solid #666666',
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontSize: '0.75rem',
        color: '#dddddd',
        margin: '0 0.25rem',
    },
    actions: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '2rem',
        paddingTop: '1.5rem',
        borderTop: '2px solid #444444',
    },
    btnCancel: {
        background: 'transparent',
        border: '2px solid #666666',
        color: '#bbbbbb',
        fontSize: '0.8rem',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.1em',
        cursor: 'pointer',
        padding: '0.875rem 1.25rem',
        borderRadius: '4px',
        minHeight: '48px',
        fontWeight: 600,
    },
    btnPrimary: {
        background: '#ffffff',
        color: '#000000',
        border: '2px solid #ffffff',
        padding: '0.875rem 2rem',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.1em',
        fontWeight: 700,
        fontSize: '0.85rem',
        cursor: 'pointer',
        borderRadius: '4px',
        minHeight: '48px',
        minWidth: '150px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
    },
    btnPrimaryDisabled: {
        opacity: 0.4,
        cursor: 'not-allowed' as const,
    },
};

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

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
        // Ctrl+Enter to save
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleSave();
        }
    };

    return (
        <div 
            style={{
                ...styles.modal,
                ...(isOpen ? styles.modalOpen : {}),
            }}
            onKeyDown={handleKeyDown}
        >
            <div 
                style={{
                    ...styles.overlay,
                    ...(isOpen ? styles.overlayOpen : {}),
                }} 
                onClick={onClose} 
            />
            
            <div 
                style={{
                    ...styles.panel,
                    ...(isOpen ? styles.panelOpen : {}),
                }}
            >
                <button 
                    style={styles.closeBtn}
                    onClick={onClose}
                    aria-label={t('common.close')}
                >
                    <X size={20} />
                </button>

                <div 
                    style={{
                        ...styles.content,
                        ...(isOpen ? styles.contentOpen : {}),
                    }}
                >
                    {/* Error display */}
                    {error && (
                        <div style={styles.error} role="alert">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Stone Preview - shows how the stone will look */}
                    <StonePreview intensity={intensity} />

                    {/* Description input */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label} htmlFor="entry-text">
                            {t('journal.description')}
                        </label>
                        <textarea
                            id="entry-text"
                            ref={textareaRef}
                            style={styles.textarea}
                            placeholder={t('journal.describeEvent')}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            rows={4}
                        />
                    </div>

                    {/* Intensity slider */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label} htmlFor="entry-intensity">
                            {t('journal.intensity')}
                        </label>
                        <div style={styles.sliderContainer}>
                            <input
                                id="entry-intensity"
                                type="range"
                                min="1"
                                max="10"
                                value={intensity}
                                onChange={(e) => setIntensity(Number(e.target.value))}
                                style={styles.slider}
                                className="modal-slider"
                            />
                        </div>
                        <div style={styles.sliderLabels}>
                            <span>{t('journal.mild')}</span>
                            <span style={styles.intensityValue}>{intensity}</span>
                            <span>{t('journal.severe')}</span>
                        </div>
                    </div>

                    {/* Hint - hidden on mobile */}
                    {!isMobile && (
                        <div style={styles.hint}>
                            <kbd style={styles.kbd}>Ctrl</kbd> + <kbd style={styles.kbd}>Enter</kbd> {t('common.save')}
                        </div>
                    )}

                    {/* Actions */}
                    <div style={styles.actions}>
                        <button 
                            style={styles.btnCancel} 
                            onClick={onClose}
                        >
                            {t('common.cancel')}
                        </button>
                        <button 
                            style={{
                                ...styles.btnPrimary,
                                ...(isSaving || !text.trim() ? styles.btnPrimaryDisabled : {}),
                            }}
                            onClick={handleSave}
                            disabled={isSaving || !text.trim()}
                        >
                            {isSaving ? t('common.saving') : t('journal.logEntry')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
