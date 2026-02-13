import { motion } from 'framer-motion';
import { Mic, AlertTriangle, Calendar, Clock } from 'lucide-react';
import type { DecryptedEntry } from '../../types';
import './JournalCard.css';

interface JournalCardProps {
    entry: DecryptedEntry;
    onClick: (id: string) => void;
}

export function JournalCard({ entry, onClick }: JournalCardProps) {
    const date = new Date(entry.date);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="journal-card glass-panel"
            onClick={() => onClick(entry.id)}
            style={{ '--intensity-color': `var(--intensity-${entry.intensity})` } as React.CSSProperties}
        >
            <div className="card-intensity-bar" />

            <div className="card-content">
                <div className="card-header">
                    <div className="card-date">
                        <Calendar size={14} className="icon-muted" />
                        <span>{date.toLocaleDateString()}</span>
                        <Clock size={14} className="icon-muted ml-2" />
                        <span>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div className="card-intensity-badge">
                        <span className="intensity-value">{entry.intensity}</span>
                    </div>
                </div>

                <h3 className="card-title">
                    {entry.content.title || 'Untitled Entry'}
                </h3>

                <p className="card-preview">
                    {entry.content.text ? entry.content.text.substring(0, 100) + (entry.content.text.length > 100 ? '...' : '') : 'No text content'}
                </p>

                <div className="card-footer">
                    <div className="card-meta">
                        {entry.hasAudio && (
                            <span className="meta-tag audio">
                                <Mic size={14} /> Voice Note
                            </span>
                        )}
                        {entry.intensity >= 8 && (
                            <span className="meta-tag daanger">
                                <AlertTriangle size={14} /> High Risk
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
