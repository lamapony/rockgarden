/**
 * Entry Editor - Stonewall Design
 * Mobile-friendly with keyboard handling
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Trash2, Mic, Archive, ArchiveRestore } from 'lucide-react';
import { useEntries } from '../../hooks/useEntries';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { useIsMobile } from '../../hooks/useIsMobile';
import { IntensitySlider } from './IntensitySlider';
import './EntryEditor.css';

export function EntryEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { loadEntry, createEntry, updateEntry, deleteEntry, toggleArchiveEntry } = useEntries();
    const { isRecording, audioBlob, startRecording, stopRecording, clearAudio } = useVoiceRecorder(id);
    const isMobile = useIsMobile();
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const [title, setTitle] = useState('');
    const [text, setText] = useState('');
    const [intensity, setIntensity] = useState(5);
    const [isArchived, setIsArchived] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (id) {
                const entry = await loadEntry(id);
                if (entry) {
                    setTitle(entry.content.title || '');
                    setText(entry.content.text || '');
                    setIntensity(entry.intensity);
                    setIsArchived(entry.isArchived || false);
                }
            }
            setLoading(false);
        };
        loadData();
    }, [id, loadEntry]);

    const handleSave = async () => {
        if (!text.trim()) return;
        
        setSaving(true);
        try {
            const content = { title, text, tags: [] };

            if (id) {
                await updateEntry(id, content, intensity);
            } else {
                await createEntry(content, intensity);
            }
            navigate('/');
        } catch (e) {
            console.error('Failed to save entry:', e);
            alert(t('common.error'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (id && confirm(t('journal.deleteConfirm'))) {
            await deleteEntry(id);
            navigate('/');
        }
    };

    const handleToggleArchive = async () => {
        if (!id) return;
        try {
            const newState = await toggleArchiveEntry(id);
            setIsArchived(newState);
        } catch (e) {
            console.error('Failed to toggle archive:', e);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            navigate('/');
        }
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleSave();
        }
    };

    // Handle textarea focus for mobile keyboard
    const handleTextareaFocus = () => {
        if (isMobile && textAreaRef.current) {
            // Small delay to let keyboard open
            setTimeout(() => {
                textAreaRef.current?.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }, 300);
        }
    };

    if (loading) return (
        <div className="editor-loading">
            <div className="editor-spinner" />
        </div>
    );

    return (
        <div className="entry-editor">
            {/* Header */}
            <header className="editor-header">
                <button onClick={() => navigate('/')} className="editor-back">
                    <ArrowLeft size={20} />
                </button>
                
                <div className="editor-actions">
                    {id && (
                        <>
                            <button 
                                onClick={handleToggleArchive} 
                                className={`editor-archive ${isArchived ? 'archived' : ''}`}
                                title={isArchived ? t('journal.unarchive') : t('journal.archive')}
                            >
                                {isArchived ? <ArchiveRestore size={18} /> : <Archive size={18} />}
                            </button>
                            <button onClick={handleDelete} className="editor-delete">
                                <Trash2 size={18} />
                            </button>
                        </>
                    )}
                    <button 
                        onClick={handleSave} 
                        className="editor-save"
                        disabled={saving || !text.trim()}
                    >
                        {saving ? t('common.saving') : t('common.save')}
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="editor-content">
                {/* Title */}
                <input
                    type="text"
                    placeholder={t('journal.titlePlaceholder')}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="editor-title-input"
                />

                {/* Intensity */}
                <div className="editor-intensity">
                    <label className="editor-label">{t('journal.intensity')}</label>
                    <IntensitySlider value={intensity} onChange={setIntensity} />
                </div>

                {/* Text */}
                <textarea
                    ref={textAreaRef}
                    placeholder={t('journal.textPlaceholder')}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={handleTextareaFocus}
                    className="editor-text"
                    autoFocus={!id}
                    enterKeyHint="done"
                    inputMode="text"
                />

                {/* Voice Recorder */}
                <div className="editor-voice">
                    <div className="voice-header">
                        <span className="voice-label">
                            <Mic size={14} /> {t('voice.record')}
                        </span>
                        <button
                            className={`voice-btn ${isRecording ? 'recording' : ''}`}
                            onClick={isRecording ? stopRecording : startRecording}
                        >
                            {isRecording ? t('voice.stop') : t('voice.record')}
                        </button>
                    </div>
                    {audioBlob && (
                        <div className="voice-audio">
                            <audio controls src={URL.createObjectURL(audioBlob)} />
                            <button onClick={clearAudio} className="voice-clear">
                                {t('voice.delete')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer hint - hidden on mobile */}
            {!isMobile && (
                <div className="editor-footer keyboard-hint">
                    <span>Ctrl + Enter</span> {t('common.save')} · <span>Esc</span> {t('common.cancel')}
                </div>
            )}
        </div>
    );
}
