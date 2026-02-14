import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useEntries } from '../../hooks/useEntries';
import { analyzePatterns, exportReportForLegal } from '../../services/patternAnalysis';
import type { AnalysisReport } from '../../services/patternAnalysis';
import { Navigation } from '../layout/Navigation';
import { generatePDF } from '../../services/pdf';
import './AnalysisPage.css';

export function AnalysisPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { entries, loadEntries } = useEntries();
    const [report, setReport] = useState<AnalysisReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState<'legal' | 'narrative' | null>(null);

    useEffect(() => {
        loadEntries();
    }, [loadEntries]);

    useEffect(() => {
        if (entries.length > 0) {
            const analysis = analyzePatterns(entries);
            setReport(analysis);
        }
        setLoading(false);
    }, [entries]);

    const handleExport = async (type: 'legal' | 'narrative') => {
        setExporting(type);
        try {
            if (type === 'legal' && report) {
                // Generate JSON report
                const jsonReport = exportReportForLegal(report);
                const blob = new Blob([jsonReport], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `stonewall-analysis-${new Date().toISOString().split('T')[0]}.json`;
                link.click();
            } else {
                // Generate narrative PDF
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
                        analysis: t('export.analysis'),
                        riskLevel: t('export.riskLevel'),
                        generated: t('export.generated'),
                    },
                });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `stonewall-narrative-${new Date().toISOString().split('T')[0]}.pdf`;
                link.click();
            }
        } catch (err) {
            console.error('Export failed:', err);
        } finally {
            setExporting(null);
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="analysis-page">
                <div className="analysis-loading">
                    <div className="analysis-spinner" />
                    <p>{t('analysis.analyzing')}</p>
                </div>
            </div>
        );
    }

    const hasData = entries.length > 0;

    return (
        <div className="analysis-page">
            {/* Header */}
            <header className="analysis-header">
                <div className="analysis-brand">
                    <div className="analysis-brand-icon"></div>
                    <span>rockgarden</span>
                </div>






            </header>

            {!hasData ? (
                <div className="analysis-empty">
                    <p>{t('analysis.noData')}</p>
                    <button onClick={() => navigate('/')} className="analysis-btn-primary">
                        {t('analysis.goToJournal')}
                    </button>
                </div>
            ) : (
                <main className="analysis-main">
                    {/* Left Column - Analysis Canvas */}
                    <div className="analysis-canvas">
                        {/* Pattern Grid */}
                        <div>
                            <div className="analysis-section-label">
                                {t('analysis.patternsTitle')}
                                <span>{t('analysis.last90Days')}</span>
                            </div>

                            {report && report.detectedPatterns.length > 0 ? (
                                <div className="pattern-grid">
                                    {report.detectedPatterns.map((pattern) => (
                                        <div key={pattern.id} className="pattern-card">
                                            <span className="pattern-phrase">"{pattern.phrase}"</span>
                                            <div className="pattern-occurrences">
                                                {Array.from({ length: Math.min(pattern.occurrences, 10) }, (_, i) => (
                                                    <span key={i} className="occurrence-dot" />
                                                ))}
                                                {pattern.occurrences > 10 && (
                                                    <span className="occurrence-more">+{pattern.occurrences - 10}</span>
                                                )}
                                            </div>
                                            <div className="pattern-insight">
                                                {pattern.insight}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="pattern-empty">
                                    {t('analysis.noPatternsYet')}
                                </div>
                            )}
                        </div>

                        {/* Risk Assessment */}
                        {report && (
                            <div>
                                <div className="analysis-section-label">{t('analysis.riskAssessment')}</div>
                                <div className="risk-card">
                                    <div className="risk-metric">
                                        <div className="risk-metric-header">
                                            <span>{t('analysis.escalationVelocity')}</span>
                                            <span className={`risk-value risk-${report.riskMetrics.escalationVelocity.label.toLowerCase()}`}>
                                                {t(`analysis.${report.riskMetrics.escalationVelocity.label.toLowerCase()}`)}
                                            </span>
                                        </div>
                                        <div className="risk-gauge">
                                            <div
                                                className="risk-fill"
                                                style={{ width: `${report.riskMetrics.escalationVelocity.value}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="risk-metric">
                                        <div className="risk-metric-header">
                                            <span>{t('analysis.isolationIndicator')}</span>
                                            <span className={`risk-value risk-${report.riskMetrics.isolationIndicator.label.toLowerCase()}`}>
                                                {t(`analysis.${report.riskMetrics.isolationIndicator.label.toLowerCase()}`)}
                                            </span>
                                        </div>
                                        <div className="risk-gauge">
                                            <div
                                                className="risk-fill"
                                                style={{ width: `${report.riskMetrics.isolationIndicator.value}%` }}
                                            />
                                        </div>
                                    </div>

                                    <p className="risk-disclaimer">
                                        *{t('analysis.disclaimer')}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Sidebar */}
                    <aside className="analysis-sidebar">
                        {/* Milestones */}
                        <div>
                            <div className="analysis-section-label">{t('analysis.milestonesTitle')}</div>
                            <div className="milestone-track">
                                {report?.milestones.map((milestone) => (
                                    <div
                                        key={milestone.id}
                                        className={`milestone ${milestone.completed ? 'complete' : ''}`}
                                    >
                                        <div className="milestone-icon"></div>
                                        <span>{milestone.label}</span>
                                        {milestone.completed && milestone.completedAt && (
                                            <span className="milestone-date">
                                                {formatDate(milestone.completedAt)}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Decision Support */}
                        {report && (
                            <div>
                                <div className="analysis-section-label">{t('analysis.decisionSupport')}</div>
                                <div className="decision-card">
                                    <span className="decision-label">{t('analysis.recommendation')}:</span>
                                    <p>{report.recommendation}</p>
                                </div>
                            </div>
                        )}

                        {/* Export */}
                        <div className="export-group">
                            <div className="analysis-section-label">{t('analysis.archiveTitle')}</div>
                            <button
                                className="btn-export"
                                onClick={() => handleExport('legal')}
                                disabled={exporting === 'legal'}
                            >
                                {exporting === 'legal' ? t('common.loading') : t('analysis.legalReport')}
                                <span>JSON</span>
                            </button>
                            <button
                                className="btn-export"
                                onClick={() => handleExport('narrative')}
                                disabled={exporting === 'narrative'}
                            >
                                {exporting === 'narrative' ? t('common.loading') : t('analysis.narrativeReport')}
                                <span>PDF</span>
                            </button>
                            <p className="export-note">
                                {t('analysis.exportNote')}
                            </p>
                        </div>
                    </aside>
                </main>
            )}

            <Navigation />
        </div>
    );
}
