import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { useEntries } from '../../hooks/useEntries';
import { useSettings } from '../../hooks/useSettings';
import { deleteAllData } from '../../services/storage';
import { StoneVisualization } from './StoneVisualization';
import { EntryModal } from './EntryModal';
import { Navigation } from '../layout/Navigation';
import './JournalPage.css';

export function JournalPage() {
    const { t } = useTranslation();
    const { entries, loadEntries, loading } = useEntries();
    const { settings } = useSettings();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showPanicConfirm, setShowPanicConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    
    // Triple-click detection for panic button
    const clickCountRef = useRef(0);
    const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        loadEntries();
    }, [loadEntries]);

    const handleBrandClick = useCallback(() => {
        if (!settings.panicButtonEnabled) return;
        
        clickCountRef.current += 1;
        
        if (clickCountRef.current === 3) {
            // Triple click detected
            setShowPanicConfirm(true);
            clickCountRef.current = 0;
            if (clickTimerRef.current) {
                clearTimeout(clickTimerRef.current);
                clickTimerRef.current = null;
            }
        } else {
            // Reset counter after 500ms
            if (clickTimerRef.current) {
                clearTimeout(clickTimerRef.current);
            }
            clickTimerRef.current = setTimeout(() => {
                clickCountRef.current = 0;
            }, 500);
        }
    }, [settings.panicButtonEnabled]);

    const handlePanic = async () => {
        setDeleting(true);
        try {
            await deleteAllData();
            window.location.reload();
        } catch (err) {
            console.error('Failed to delete data:', err);
            setDeleting(false);
        }
    };

    const handleEntryClick = (id: string) => {
        navigate(`/entry/${id}`);
    };

    const handleAddEntry = () => {
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
    };

    const handleEntrySaved = () => {
        setIsModalOpen(false);
        loadEntries();
    };

    return (
        <div className="journal-page">
            {/* Header */}
            <header className="journal-header">
                <div 
                    className={`journal-brand ${settings.panicButtonEnabled ? 'panic-enabled' : ''}`}
                    onClick={handleBrandClick}
                    title={settings.panicButtonEnabled ? t('settings.panicButtonDesc') : ''}
                >
                    <div className="journal-brand-icon"></div>
                    <span className="journal-brand-name">rockgarden</span>
                </div>






            </header>

            {/* Main Content */}
            <main className="journal-main">
                {loading ? (
                    <div className="journal-loading">
                        <div className="journal-spinner" />
                    </div>
                ) : (
                    <StoneVisualization
                        entries={entries}
                        onEntryClick={handleEntryClick}
                        onAddEntry={handleAddEntry}
                    />
                )}
            </main>

            {/* Entry Modal */}
            <EntryModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSaved={handleEntrySaved}
            />

            <Navigation />

            {/* Panic Button Confirmation Modal */}
            {showPanicConfirm && (
                <div className="panic-modal-overlay" onClick={() => setShowPanicConfirm(false)}>
                    <div className="panic-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="panic-modal-icon">
                            <AlertTriangle size={48} color="#ef4444" />
                        </div>
                        <h2 className="panic-modal-title">{t('settings.panicButton')}</h2>
                        <p className="panic-modal-text">{t('settings.panicConfirm')}</p>
                        <div className="panic-modal-actions">
                            <button 
                                className="panic-btn-secondary"
                                onClick={() => setShowPanicConfirm(false)}
                            >
                                {t('common.cancel')}
                            </button>
                            <button 
                                className="panic-btn-danger"
                                onClick={handlePanic}
                                disabled={deleting}
                            >
                                {deleting ? t('common.loading') : t('settings.panicConfirmButton')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
