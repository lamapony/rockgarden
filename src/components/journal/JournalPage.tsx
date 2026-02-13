import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEntries } from '../../hooks/useEntries';
import { StoneVisualization } from './StoneVisualization';
import { EntryModal } from './EntryModal';
import { Navigation } from '../layout/Navigation';
import './JournalPage.css';

export function JournalPage() {
    const { entries, loadEntries, loading } = useEntries();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        loadEntries();
    }, [loadEntries]);

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
                <div className="journal-brand">
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
        </div>
    );
}
