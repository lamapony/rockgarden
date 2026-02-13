/**
 * PDF Export Service
 * Redesigned for "rockgarden" branding
 */

import { jsPDF } from 'jspdf';
import { Chart, registerables } from 'chart.js';
import type { DecryptedEntry } from '../types';
import { analyzeEntries, type AnalyticsReport } from './analytics';

Chart.register(...registerables);

export interface ExportOptions {
    title: string;
    entries: DecryptedEntry[];
    translations: {
        timeline: string;
        statistics: string;
        totalEvents: string;
        averageIntensity: string;
        period: string;
        intensity: string;
        audioNote: string;
        analysis: string;
        riskLevel: string;
        escalation: string;
        frequency: string;
        timeOfDay: string;
        generated: string;
        page: string;
    };
}

// Helper to generate chart image
async function generateIntensityChart(report: AnalyticsReport): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    if (!ctx) return '';

    // Modern dark theme chart
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: report.dates,
            datasets: [{
                label: 'Intensity',
                data: report.intensityTrend,
                borderColor: '#c0a080', // Warm Sand/Rock color
                backgroundColor: 'rgba(192, 160, 128, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#c0a080',
                pointRadius: 4,
                pointHoverRadius: 6,
            }]
        },
        options: {
            responsive: false,
            animation: false,
            scales: {
                y: {
                    min: 0,
                    max: 10,
                    grid: { color: '#f0f0f0' },
                    ticks: { font: { family: 'Helvetica' } }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { family: 'Helvetica' }, maxTicksLimit: 10 }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });

    return canvas.toDataURL('image/png');
}

export async function generatePDF(options: ExportOptions): Promise<Blob> {
    const { title, entries, translations } = options;
    const report = analyzeEntries(entries);

    // Setup A4 Document
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    // Colors
    const colors = {
        primary: [20, 20, 24],     // Dark background equivalent for text
        secondary: [80, 80, 90],   // Subtitles
        accent: [192, 160, 128],   // #c0a080 - Rockgarden Sand
        light: [245, 245, 247],    // Light gray background
        danger: [220, 38, 38],
        warning: [249, 115, 22],
        success: [16, 185, 129]
    };

    let y = margin;

    // --- Helpers ---
    const checkNewPage = (heightNeeded: number) => {
        if (y + heightNeeded > pageHeight - margin) {
            doc.addPage();
            y = margin + 10; // Extra space for header
            addHeader();
            addFooter();
        }
    };

    const addHeader = () => {
        doc.setFontSize(8);
        doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
        doc.text("rockgarden // personal report", margin, 15);

        const dateStr = new Date().toLocaleDateString();
        doc.text(dateStr, pageWidth - margin - doc.getTextWidth(dateStr), 15);
    };

    const addFooter = () => {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
        const text = `${translations.page || 'Page'} ${pageCount}`;
        doc.text(text, pageWidth / 2, pageHeight - 10, { align: 'center' });
    };

    // --- COVER PAGE ---

    // Background accent
    doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Center Content
    let cy = pageHeight / 3;

    // Brand
    doc.setFontSize(48); // Hero size
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text("rockgarden", pageWidth / 2, cy, { align: 'center' });

    // Title
    cy += 20;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    doc.text("PERSONAL INSIGHT REPORT", pageWidth / 2, cy, { align: 'center' });

    // Date Range
    cy += 40;
    const dateRange = entries.length > 0
        ? `${new Date(Math.min(...entries.map(e => e.date))).toLocaleDateString()} — ${new Date(Math.max(...entries.map(e => e.date))).toLocaleDateString()}`
        : new Date().toLocaleDateString();

    doc.setFontSize(12);
    doc.text(dateRange, pageWidth / 2, cy, { align: 'center' });

    // Divider
    cy += 10;
    doc.setLineWidth(0.5);
    doc.setDrawColor(colors.accent[0], colors.accent[1], colors.accent[2]);
    doc.line(pageWidth / 2 - 20, cy, pageWidth / 2 + 20, cy);

    // Stats Preview
    cy += 30;
    doc.setFontSize(10);
    doc.text(`${entries.length} Entries`, pageWidth / 2, cy, { align: 'center' });

    // --- PAGE 2: ANALYSIS DASHBOARD ---
    doc.addPage();
    y = margin + 10;
    addHeader();
    addFooter();

    // Section Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text(translations.analysis, margin, y);
    y += 15;

    // Risk Card
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(230, 230, 230);
    doc.roundedRect(margin, y, pageWidth - (margin * 2), 40, 3, 3, 'FD');

    const riskY = y + 12;
    doc.setFontSize(10);
    doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    doc.text(translations.riskLevel.toUpperCase(), margin + 10, riskY);

    const riskColor = report.riskLevel === 'critical' ? colors.danger :
        report.riskLevel === 'high' ? colors.warning : colors.success;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
    doc.text(report.riskLevel.toUpperCase(), margin + 10, riskY + 8);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Risk Metrics (Right side of card)
    const metricsX = pageWidth / 2;
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);

    doc.text(`${translations.escalation}:`, metricsX, riskY);
    doc.setTextColor(report.escalationDetected ? colors.danger[0] : colors.secondary[0], report.escalationDetected ? colors.danger[1] : colors.secondary[1], report.escalationDetected ? colors.danger[2] : colors.secondary[2]);
    doc.text(report.escalationDetected ? 'DETECTED' : 'None', metricsX + 40, riskY);

    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text(`${translations.frequency}:`, metricsX, riskY + 8);
    doc.text(`Every ~${report.averageIntervalDays} days`, metricsX + 40, riskY + 8);

    y += 50;

    // Key Stats Grid
    const cardWidth = (pageWidth - (margin * 2) - 10) / 2;

    // Card 1
    doc.setFillColor(248, 248, 250);
    doc.roundedRect(margin, y, cardWidth, 30, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    doc.text(translations.totalEvents, margin + 5, y + 8);
    doc.setFontSize(18);
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text(report.totalIncidents.toString(), margin + 5, y + 20);

    // Card 2
    doc.setFillColor(248, 248, 250);
    doc.roundedRect(margin + cardWidth + 10, y, cardWidth, 30, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    doc.text(translations.averageIntensity, margin + cardWidth + 15, y + 8);
    doc.setFontSize(18);
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text(`${report.averageIntensity}/10`, margin + cardWidth + 15, y + 20);

    y += 45;

    // Chart
    const chartImg = await generateIntensityChart(report);
    if (chartImg) {
        doc.setFontSize(12);
        doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.text("Intensity Trends", margin, y);
        y += 5;
        doc.addImage(chartImg, 'PNG', margin, y, pageWidth - (margin * 2), 60);
        y += 70;
    }

    // --- PAGES 3+: ENTRIES ---
    checkNewPage(40);

    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text(translations.timeline, margin, y);
    y += 15;

    // Sort entries newest first
    const sortedEntries = [...entries].sort((a, b) => b.date - a.date);

    for (const entry of sortedEntries) {
        // Calculate approx height needed
        let estimatedHeight = 35;
        if (entry.content.text) estimatedHeight += (entry.content.text.length / 50) * 5;

        checkNewPage(estimatedHeight);

        // Date Header
        const date = new Date(entry.date);
        const dateStr = date.toLocaleDateString(undefined, {
            weekday: 'short',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.text(dateStr, margin, y);

        // Time & Intensity Badge
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
        doc.text(timeStr, margin + doc.getTextWidth(dateStr) + 5, y);

        const intensityLabel = `${translations.intensity}: ${entry.intensity}/10`;
        const badgeX = pageWidth - margin - doc.getTextWidth(intensityLabel) - 10;

        doc.setFillColor(240, 240, 240);
        doc.roundedRect(badgeX, y - 5, doc.getTextWidth(intensityLabel) + 10, 8, 2, 2, 'F');
        doc.text(intensityLabel, badgeX + 5, y);

        y += 8;

        // Content Block
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y); // Separator
        y += 5;

        if (entry.content.title) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
            doc.text(entry.content.title, margin, y);
            y += 6;
        }

        if (entry.content.text) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
            const lines = doc.splitTextToSize(entry.content.text, pageWidth - (margin * 2));
            for (const line of lines) {
                checkNewPage(6);
                doc.text(line, margin, y);
                y += 5;
            }
        }

        if (entry.hasAudio) {
            y += 2;
            doc.setFontSize(9);
            doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
            doc.text(`🎤 ${translations.audioNote} attached`, margin, y);
            y += 5;
        }

        y += 15; // Space between entries
    }

    // Final page numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        const text = `${translations.page || 'Page'} ${i} of ${totalPages}`;
        doc.text(text, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    return doc.output('blob');
}
