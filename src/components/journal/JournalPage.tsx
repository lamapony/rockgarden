import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { useEntries } from '../../hooks/useEntries';
import { useSettings } from '../../hooks/useSettings';
import { useAuth } from '../../hooks/useAuth';
import { deleteAllData } from '../../services/storage';
import { StoneVisualization } from './StoneVisualization';
import { EntryModal } from './EntryModal';
import { EntryPreview } from './EntryPreview';
import { Navigation } from '../layout/Navigation';
import { BrandLogo } from '../layout/BrandLogo';
import './JournalPage.css';

export function JournalPage() {
    const { t } = useTranslation();
    const { entries, loadEntries, loading } = useEntries();
    const { settings, setLayoutMode } = useSettings();
    const { isDecoyMode } = useAuth();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showPanicConfirm, setShowPanicConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [previewEntryId, setPreviewEntryId] = useState<string | null>(null);
    const [newEntryId, setNewEntryId] = useState<string | null>(null);

    // Panic button handler
    const handlePanicTrigger = useCallback(() => {
        setShowPanicConfirm(true);
    }, []);

    useEffect(() => {
        loadEntries();
    }, [loadEntries]);

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

    const handleEntryPreview = (id: string) => {
        setPreviewEntryId(id);
    };

    const handleClosePreview = () => {
        setPreviewEntryId(null);
    };

    const handleEditFromPreview = () => {
        if (previewEntryId) {
            navigate(`/entry/${previewEntryId}`);
        }
    };

    const handleAddEntry = () => {
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
    };

    const handleEntrySaved = (entryId?: string) => {
        setIsModalOpen(false);
        if (entryId) {
            setNewEntryId(entryId);
            // Clear new entry ID after animation completes (3 seconds)
            setTimeout(() => setNewEntryId(null), 3000);
        }
        loadEntries();
    };

    // Swipe handlers
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const minSwipeDistance = 50;

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe || isRightSwipe) {
            const modes: ('scatter' | 'piles' | 'cairn')[] = ['scatter', 'piles', 'cairn'];
            const currentIndex = modes.indexOf(settings.layoutMode);
            let nextIndex = currentIndex;

            if (isLeftSwipe) {
                // Swipe left -> Next mode
                nextIndex = currentIndex === modes.length - 1 ? 0 : currentIndex + 1;
            } else if (isRightSwipe) {
                // Swipe right -> Previous mode
                nextIndex = currentIndex === 0 ? modes.length - 1 : currentIndex - 1;
            }

            setLayoutMode(modes[nextIndex]);
        }
    };

    return (
        <div className="journal-page">
            {/* Header */}
            <header className="journal-header">
                <BrandLogo
                    size="small"
                    showText={true}
                    panicEnabled={true}
                    onClick={handlePanicTrigger}
                />

                {/* Decoy Mode Indicator */}
                {isDecoyMode && (
                    <div className="decoy-indicator" title={t('settings.decoyModeWarning')}>
                        <ShieldAlert size={18} />
                        <span>{t('settings.decoyTitle')}</span>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main
                className="journal-main"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {loading ? (
                    <div className="journal-loading">
                        <div className="journal-spinner" />
                    </div>
                ) : (
                    <>
                        <StoneVisualization
                            entries={entries}
                            onEntryClick={handleEntryClick}
                            onAddEntry={handleAddEntry}
                            onEntryPreview={handleEntryPreview}
                            newEntryId={newEntryId}
                            layoutMode={settings.layoutMode}
                        />

                        {/* Pagination Dots */}
                        <div className="view-pagination">
                            <div
                                className={`pagination-dot ${settings.layoutMode === 'scatter' ? 'active' : ''}`}
                                onClick={() => setLayoutMode('scatter')}
                            />
                            <div
                                className={`pagination-dot ${settings.layoutMode === 'piles' ? 'active' : ''}`}
                                onClick={() => setLayoutMode('piles')}
                            />
                            <div
                                className={`pagination-dot ${settings.layoutMode === 'cairn' ? 'active' : ''}`}
                                onClick={() => setLayoutMode('cairn')}
                            />
                        </div>
                    </>
                )}
            </main>

            {/* Entry Modal */}
            <EntryModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSaved={handleEntrySaved}
            />

            {/* Entry Preview */}
            <EntryPreview
                entry={previewEntryId ? entries.find(e => e.id === previewEntryId) || null : null}
                isOpen={!!previewEntryId}
                onClose={handleClosePreview}
                onEdit={handleEditFromPreview}
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
