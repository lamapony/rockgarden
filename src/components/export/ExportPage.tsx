/**
 * Export Page - Stonewall Design
 * Generate PDF for lawyer
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, FileText, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEntries } from '../../hooks/useEntries';
import { analyzeEntries } from '../../services/analytics';
import { generatePDF } from '../../services/pdf';
import { Navigation } from '../layout/Navigation';
import './ExportPage.css';

export function ExportPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { entries, loadEntries } = useEntries();
    const [stats, setStats] = useState(() => analyzeEntries([]));
    const [generating, setGenerating] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);

    useEffect(() => {
        loadEntries();
    }, [loadEntries]);

    useEffect(() => {
        setStats(analyzeEntries(entries));
    }, [entries]);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const blob = await generatePDF({
                title: t('appName'),
                entries,
                translations: {
                    timeline: t('export.timeline'),
                    statistics: t('export.statistics'),
                    totalEvents: t('export.totalEvents'),
                    averageIntensity: t('export.averageIntensity'),
                    period: t('export.period'),
                    intensity: t('journal.intensity'),
                    audioNote: t('voice.record'),
                    analysis: t('export.analysis'),
                    riskLevel: t('export.riskLevel'),
                    escalation: t('export.escalation'),
                    frequency: t('export.frequency'),
                    timeOfDay: t('export.timeOfDay'),
                    generated: t('export.generated'),
                    page: t('export.page'),
                },
            });

            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
        } catch (err) {
            console.error('Failed to generate PDF:', err);
        } finally {
            setGenerating(false);
        }
    };

    const handleDownload = () => {
        if (pdfUrl) {
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = `stonewall-report-${new Date().toISOString().split('T')[0]}.pdf`;
            link.click();
        }
    };

    return (
        <div className="export-page">
            {/* Header */}
            <header className="export-header">
                <button onClick={() => navigate('/')} className="export-back">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="export-title">{t('export.title')}</h1>
                <div className="export-spacer" />
            </header>

            {/* Content */}
            <div className="export-content">
                {/* Stats Grid */}
                <div className="export-stats">
                    <div className="stat-item">
                        <div className="stat-number">{stats.totalIncidents}</div>
                        <div className="stat-label">{t('export.totalEvents')}</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">{stats.averageIntensity}</div>
                        <div className="stat-label">{t('export.averageIntensity')}</div>
                    </div>
                    <div className="stat-item">
                        <div className={`stat-number risk-${stats.riskLevel}`}>
                            {stats.riskLevel.toUpperCase()}
                        </div>
                        <div className="stat-label">{t('export.riskLevel')}</div>
                    </div>
                </div>

                {/* Export Card */}
                <div className="export-card">
                    <div className="export-icon">
                        <FileText size={32} />
                    </div>
                    <h2 className="export-subtitle">{t('export.subtitle')}</h2>
                    <p className="export-description">
                        {entries.length === 0
                            ? t('journal.empty')
                            : `${entries.length} ${t('export.totalEvents').toLowerCase()}`}
                    </p>
                </div>

                {/* Actions */}
                <div className="export-actions">
                    {!pdfUrl ? (
                        <button
                            className="export-btn-primary"
                            onClick={handleGenerate}
                            disabled={generating || entries.length === 0}
                        >
                            {generating ? (
                                <>
                                    <span className="export-spinner" />
                                    {t('export.generating')}
                                </>
                            ) : (
                                <>
                                    <FileText size={18} />
                                    {t('export.generate')}
                                </>
                            )}
                        </button>
                    ) : (
                        <>
                            <button className="export-btn-primary" onClick={handleDownload}>
                                <Download size={18} />
                                {t('export.download')}
                            </button>
                            <button
                                className="export-btn-secondary"
                                onClick={() => setPdfUrl(null)}
                            >
                                {t('export.generate')}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <Navigation />
        </div>
    );
}
