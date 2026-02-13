/**
 * PDF Export Service
 * Redesigned for "rockgarden" branding
 * With Unicode support for all languages
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

// Unicode-safe text encoding for jsPDF
// jsPDF uses Latin-1 encoding by default, so we need to handle Unicode properly
function encodeUnicode(text: string): string {
    // Build map from Unicode code points to ASCII equivalents
    const unicodeMap = new Map<number, string>();
    
    // Helper to add mappings
    const add = (code: number, replacement: string) => unicodeMap.set(code, replacement);
    
    // Cyrillic lowercase
    add(0x0430, 'a'); add(0x0431, 'b'); add(0x0432, 'v'); add(0x0433, 'g'); add(0x0434, 'd');
    add(0x0435, 'e'); add(0x0451, 'yo'); add(0x0436, 'zh'); add(0x0437, 'z'); add(0x0438, 'i');
    add(0x0439, 'y'); add(0x043A, 'k'); add(0x043B, 'l'); add(0x043C, 'm'); add(0x043D, 'n');
    add(0x043E, 'o'); add(0x043F, 'p'); add(0x0440, 'r'); add(0x0441, 's'); add(0x0442, 't');
    add(0x0443, 'u'); add(0x0444, 'f'); add(0x0445, 'kh'); add(0x0446, 'ts'); add(0x0447, 'ch');
    add(0x0448, 'sh'); add(0x0449, 'shch'); add(0x044A, ''); add(0x044B, 'y'); add(0x044C, '');
    add(0x044D, 'e'); add(0x044E, 'yu'); add(0x044F, 'ya');
    
    // Cyrillic uppercase
    add(0x0410, 'A'); add(0x0411, 'B'); add(0x0412, 'V'); add(0x0413, 'G'); add(0x0414, 'D');
    add(0x0415, 'E'); add(0x0401, 'Yo'); add(0x0416, 'Zh'); add(0x0417, 'Z'); add(0x0418, 'I');
    add(0x0419, 'Y'); add(0x041A, 'K'); add(0x041B, 'L'); add(0x041C, 'M'); add(0x041D, 'N');
    add(0x041E, 'O'); add(0x041F, 'P'); add(0x0420, 'R'); add(0x0421, 'S'); add(0x0422, 'T');
    add(0x0423, 'U'); add(0x0424, 'F'); add(0x0425, 'Kh'); add(0x0426, 'Ts'); add(0x0427, 'Ch');
    add(0x0428, 'Sh'); add(0x0429, 'Shch'); add(0x042A, ''); add(0x042B, 'Y'); add(0x042C, '');
    add(0x042D, 'E'); add(0x042E, 'Yu'); add(0x042F, 'Ya');
    
    // Lithuanian
    add(0x0105, 'a'); add(0x010D, 'c'); add(0x0119, 'e'); add(0x0117, 'e'); add(0x012F, 'i');
    add(0x0161, 's'); add(0x0173, 'u'); add(0x016B, 'u'); add(0x017E, 'z');
    add(0x0104, 'A'); add(0x010C, 'C'); add(0x0118, 'E'); add(0x0116, 'E'); add(0x012E, 'I');
    add(0x0160, 'S'); add(0x0172, 'U'); add(0x016A, 'U'); add(0x017D, 'Z');
    
    // Latvian (avoiding duplicates with Lithuanian)
    add(0x0101, 'a'); add(0x0113, 'e'); add(0x0123, 'g'); add(0x012B, 'i'); add(0x0137, 'k');
    add(0x013C, 'l'); add(0x0146, 'n'); add(0x0157, 'r');
    add(0x0100, 'A'); add(0x0112, 'E'); add(0x0122, 'G'); add(0x012A, 'I'); add(0x0136, 'K');
    add(0x013B, 'L'); add(0x0145, 'N'); add(0x0156, 'R');
    
    // Estonian (avoiding duplicates)
    add(0x00E4, 'a'); add(0x00F6, 'o'); add(0x00FC, 'u'); add(0x00F5, 'o');
    add(0x00C4, 'A'); add(0x00D6, 'O'); add(0x00DC, 'U'); add(0x00D5, 'O');
    
    // Polish (avoiding duplicates)
    add(0x0107, 'c'); add(0x0142, 'l'); add(0x0144, 'n');
    add(0x00F3, 'o'); add(0x015B, 's'); add(0x017A, 'z'); add(0x017C, 'z');
    add(0x0106, 'C'); add(0x0141, 'L'); add(0x0143, 'N');
    add(0x00D3, 'O'); add(0x015A, 'S'); add(0x0179, 'Z'); add(0x017B, 'Z');
    
    // Turkish (avoiding duplicates)
    add(0x011F, 'g'); add(0x0131, 'i'); add(0x015F, 's');
    add(0x011E, 'G'); add(0x0130, 'I'); add(0x015E, 'S');
    
    // German (avoiding duplicates)
    add(0x00DF, 'ss'); add(0x00C4, 'Ae'); add(0x00D6, 'Oe'); add(0x00DC, 'Ue');
    
    // French (avoiding duplicates)
    add(0x00E0, 'a'); add(0x00E2, 'a'); add(0x00E6, 'ae'); add(0x00E8, 'e');
    add(0x00E9, 'e'); add(0x00EA, 'e'); add(0x00EB, 'e'); add(0x00EE, 'i'); add(0x00EF, 'i');
    add(0x00F4, 'o'); add(0x0153, 'oe'); add(0x00F9, 'u'); add(0x00FB, 'u'); add(0x00FF, 'y');
    add(0x00C0, 'A'); add(0x00C2, 'A'); add(0x00C6, 'Ae'); add(0x00C8, 'E');
    add(0x00C9, 'E'); add(0x00CA, 'E'); add(0x00CB, 'E'); add(0x00CE, 'I'); add(0x00CF, 'I');
    add(0x00D4, 'O'); add(0x0152, 'Oe'); add(0x00D9, 'U'); add(0x00DB, 'U'); add(0x0178, 'Y');
    
    // Spanish/Portuguese/Italian (avoiding duplicates)
    add(0x00E1, 'a'); add(0x00ED, 'i'); add(0x00F1, 'n'); add(0x00FA, 'u');
    add(0x00E3, 'a'); add(0x00F5, 'o'); add(0x00EC, 'i'); add(0x00F2, 'o');
    add(0x00C1, 'A'); add(0x00CD, 'I'); add(0x00D1, 'N'); add(0x00DA, 'U');
    add(0x00C3, 'A'); add(0x00D5, 'O'); add(0x00CC, 'I'); add(0x00D2, 'O');
    
    // Ukrainian
    add(0x0491, 'g'); add(0x0454, 'ye'); add(0x0456, 'i'); add(0x0457, 'yi');
    add(0x0490, 'G'); add(0x0404, 'Ye'); add(0x0406, 'I'); add(0x0407, 'Yi');
    
    // Danish (avoiding duplicates)
    add(0x00F8, 'o'); add(0x00E5, 'a');
    add(0x00D8, 'O'); add(0x00C5, 'A');
    
    // Common symbols
    add(0x2013, '-'); add(0x2014, '-'); add(0x2018, "'"); add(0x2019, "'"); 
    add(0x201C, '"'); add(0x201D, '"'); add(0x2026, '...'); add(0x2022, '*'); 
    add(0x00B7, '*'); add(0x2192, '->'); add(0x2190, '<-'); add(0x00D7, 'x');
    
    let result = '';
    for (const char of text) {
        const code = char.codePointAt(0);
        if (code && code > 127) {
            result += unicodeMap.get(code) ?? char;
        } else {
            result += char;
        }
    }
    return result;
}

export async function generatePDF(options: ExportOptions): Promise<Blob> {
    const { entries, translations } = options;
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

    // Helper for Unicode-safe text
    const drawText = (content: string, x: number, yPos: number, opts?: { align?: 'left' | 'center' | 'right' | 'justify' }): void => {
        const encoded = encodeUnicode(content);
        doc.text(encoded, x, yPos, opts);
    };

    const addHeader = () => {
        doc.setFontSize(8);
        doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
        drawText("rockgarden // personal report", margin, 15);

        const dateStr = new Date().toLocaleDateString();
        drawText(dateStr, pageWidth - margin - doc.getTextWidth(dateStr), 15);
    };

    const addFooter = () => {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
        const textContent = `${translations.page || 'Page'} ${pageCount}`;
        drawText(textContent, pageWidth / 2, pageHeight - 10, { align: 'center' });
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
    drawText(dateRange, pageWidth / 2, cy, { align: 'center' });

    // Divider
    cy += 10;
    doc.setLineWidth(0.5);
    doc.setDrawColor(colors.accent[0], colors.accent[1], colors.accent[2]);
    doc.line(pageWidth / 2 - 20, cy, pageWidth / 2 + 20, cy);

    // Stats Preview
    cy += 30;
    doc.setFontSize(10);
    drawText(`${entries.length} Entries`, pageWidth / 2, cy, { align: 'center' });

    // --- PAGE 2: ANALYSIS DASHBOARD ---
    doc.addPage();
    y = margin + 10;
    addHeader();
    addFooter();

    // Section Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    drawText(translations.analysis, margin, y);
    y += 15;

    // Risk Card
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(230, 230, 230);
    doc.roundedRect(margin, y, pageWidth - (margin * 2), 40, 3, 3, 'FD');

    const riskY = y + 12;
    doc.setFontSize(10);
    doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    drawText(translations.riskLevel.toUpperCase(), margin + 10, riskY);

    const riskColor = report.riskLevel === 'critical' ? colors.danger :
        report.riskLevel === 'high' ? colors.warning : colors.success;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
    drawText(report.riskLevel.toUpperCase(), margin + 10, riskY + 8);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Risk Metrics (Right side of card)
    const metricsX = pageWidth / 2;
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);

    drawText(`${translations.escalation}:`, metricsX, riskY);
    doc.setTextColor(report.escalationDetected ? colors.danger[0] : colors.secondary[0], report.escalationDetected ? colors.danger[1] : colors.secondary[1], report.escalationDetected ? colors.danger[2] : colors.secondary[2]);
    drawText(report.escalationDetected ? 'DETECTED' : 'None', metricsX + 40, riskY);

    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    drawText(`${translations.frequency}:`, metricsX, riskY + 8);
    drawText(`Every ~${report.averageIntervalDays} days`, metricsX + 40, riskY + 8);

    y += 50;

    // Key Stats Grid
    const cardWidth = (pageWidth - (margin * 2) - 10) / 2;

    // Card 1
    doc.setFillColor(248, 248, 250);
    doc.roundedRect(margin, y, cardWidth, 30, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    drawText(translations.totalEvents, margin + 5, y + 8);
    doc.setFontSize(18);
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    drawText(report.totalIncidents.toString(), margin + 5, y + 20);

    // Card 2
    doc.setFillColor(248, 248, 250);
    doc.roundedRect(margin + cardWidth + 10, y, cardWidth, 30, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    drawText(translations.averageIntensity, margin + cardWidth + 15, y + 8);
    doc.setFontSize(18);
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    drawText(`${report.averageIntensity}/10`, margin + cardWidth + 15, y + 20);

    y += 45;

    // Chart
    const chartImg = await generateIntensityChart(report);
    if (chartImg) {
        doc.setFontSize(12);
        doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        drawText("Intensity Trends", margin, y);
        y += 5;
        doc.addImage(chartImg, 'PNG', margin, y, pageWidth - (margin * 2), 60);
        y += 70;
    }

    // --- PAGES 3+: ENTRIES ---
    checkNewPage(40);

    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    drawText(translations.timeline, margin, y);
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
        drawText(dateStr, margin, y);

        // Time & Intensity Badge
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
        drawText(timeStr, margin + doc.getTextWidth(dateStr) + 5, y);

        const intensityLabel = `${translations.intensity}: ${entry.intensity}/10`;
        const badgeX = pageWidth - margin - doc.getTextWidth(intensityLabel) - 10;

        doc.setFillColor(240, 240, 240);
        doc.roundedRect(badgeX, y - 5, doc.getTextWidth(intensityLabel) + 10, 8, 2, 2, 'F');
        drawText(intensityLabel, badgeX + 5, y);

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
            drawText(entry.content.title, margin, y);
            y += 6;
        }

        if (entry.content.text) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
            const lines = doc.splitTextToSize(encodeUnicode(entry.content.text), pageWidth - (margin * 2));
            for (const line of lines) {
                checkNewPage(6);
                drawText(line, margin, y);
                y += 5;
            }
        }

        if (entry.hasAudio) {
            y += 2;
            doc.setFontSize(9);
            doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
            drawText(`[${translations.audioNote} attached]`, margin, y);
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
        const textContent = `${translations.page || 'Page'} ${i} of ${totalPages}`;
        drawText(textContent, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    return doc.output('blob');
}
