/**
 * PDF Export Service - Minimalist Dark Design
 * Secure, reliable, single-page report
 */

import { jsPDF } from 'jspdf';
import type { DecryptedEntry } from '../types';
import { analyzeEntries } from './analytics';

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
        analysis: string;
        riskLevel: string;
        generated: string;
    };
}

// Simple ASCII-only text cleaning for maximum compatibility
function cleanText(text: string): string {
    if (!text) return '';
    
    // Replace common Unicode characters with ASCII equivalents
    return text
        // Smart quotes
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        // Dashes
        .replace(/[\u2013\u2014]/g, '-')
        // Ellipsis
        .replace(/\u2026/g, '...')
        // Common European chars
        .replace(/[\u00E0\u00E1\u00E2\u00E3\u00E4\u00E5]/g, 'a')
        .replace(/[\u00E8\u00E9\u00EA\u00EB]/g, 'e')
        .replace(/[\u00EC\u00ED\u00EE\u00EF]/g, 'i')
        .replace(/[\u00F2\u00F3\u00F4\u00F5\u00F6\u00F8]/g, 'o')
        .replace(/[\u00F9\u00FA\u00FB\u00FC]/g, 'u')
        .replace(/[\u00E6]/g, 'ae')
        .replace(/[\u00E7]/g, 'c')
        .replace(/[\u00F1]/g, 'n')
        .replace(/[\u00FD\u00FF]/g, 'y')
        // Upper case
        .replace(/[\u00C0\u00C1\u00C2\u00C3\u00C4\u00C5]/g, 'A')
        .replace(/[\u00C8\u00C9\u00CA\u00CB]/g, 'E')
        .replace(/[\u00CC\u00CD\u00CE\u00CF]/g, 'I')
        .replace(/[\u00D2\u00D3\u00D4\u00D5\u00D6\u00D8]/g, 'O')
        .replace(/[\u00D9\u00DA\u00DB\u00DC]/g, 'U')
        .replace(/[\u00C6]/g, 'Ae')
        .replace(/[\u00C7]/g, 'C')
        .replace(/[\u00D1]/g, 'N')
        .replace(/[\u00DD\u0178]/g, 'Y')
        // Cyrillic basic
        .replace(/[\u0430\u0431\u0432\u0433\u0434\u0435\u0451\u0436\u0437\u0438\u0439\u043A\u043B\u043C\u043D\u043E\u043F\u0440\u0441\u0442\u0443\u0444\u0445\u0446\u0447\u0448\u0449\u044A\u044B\u044C\u044D\u044E\u044F]/gi, (match) => {
            const cyrillic = 'abvgdeyozhziiyklmnoprstufkhtschshshchyyeiyuya';
            const idx = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя'.indexOf(match.toLowerCase());
            return idx >= 0 ? cyrillic[idx] : match;
        })
        // Baltic
        .replace(/[\u0105\u0104]/g, 'a')
        .replace(/[\u010D\u010C]/g, 'c')
        .replace(/[\u0119\u0118]/g, 'e')
        .replace(/[\u0117\u0116]/g, 'e')
        .replace(/[\u012F\u012E]/g, 'i')
        .replace(/[\u0161\u0160]/g, 's')
        .replace(/[\u0173\u0172]/g, 'u')
        .replace(/[\u016B\u016A]/g, 'u')
        .replace(/[\u017E\u017D]/g, 'z')
        // Polish
        .replace(/[\u0107\u0106]/g, 'c')
        .replace(/[\u0142\u0141]/g, 'l')
        .replace(/[\u0144\u0143]/g, 'n')
        .replace(/[\u015B\u015A]/g, 's')
        .replace(/[\u017A\u0179\u017C\u017B]/g, 'z')
        // Turkish
        .replace(/[\u011F\u011E]/g, 'g')
        .replace(/[\u0131\u0130]/g, 'i')
        .replace(/[\u015F\u015E]/g, 's')
        // Remove any remaining non-ASCII
        .replace(/[^\x00-\x7F]/g, '?');
}

export async function generatePDF(options: ExportOptions): Promise<Blob> {
    const { title, entries, translations } = options;
    
    // Create PDF with custom page size (A4 but optimized)
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true,
        floatPrecision: 16,
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Colors - dark theme like the app
    const colors = {
        bg: '#0a0a0a',
        text: '#ffffff',
        textMuted: '#888888',
        accent: '#7fb3d5',
        border: '#333333',
        intensity: ['#e0f7fa', '#b2ebf2', '#80deea', '#7fb3d5', '#90caf9', '#f48fb1', '#f06292', '#e53935', '#c62828', '#8e0000'],
    };

    let y = margin;

    // Helper: add text
    const addText = (text: string, x: number, yPos: number, size = 10, color = colors.text, weight = 'normal') => {
        doc.setFontSize(size);
        doc.setTextColor(color);
        doc.setFont('helvetica', weight);
        doc.text(cleanText(text), x, yPos);
    };

    // Helper: draw line
    const drawLine = (yPos: number) => {
        doc.setDrawColor(colors.border);
        doc.setLineWidth(0.3);
        doc.line(margin, yPos, pageWidth - margin, yPos);
    };

    // === HEADER ===
    // Logo/Brand
    doc.setFillColor(colors.accent);
    doc.roundedRect(margin, y, 6, 6, 1, 1, 'F');
    
    // Title
    addText('ROCKGARDEN', margin + 10, y + 4.5, 14, colors.text, 'bold');
    y += 12;
    
    // Document title
    addText(cleanText(title), margin, y, 18, colors.text, 'bold');
    y += 8;
    
    // Generated date
    const date = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
    addText(`${cleanText(translations.generated)}: ${date}`, margin, y, 9, colors.textMuted);
    y += 10;
    
    drawLine(y);
    y += 8;

    // === STATISTICS ===
    if (entries.length > 0) {
        const report = analyzeEntries(entries);
        
        addText(cleanText(translations.statistics).toUpperCase(), margin, y, 11, colors.accent, 'bold');
        y += 7;
        
        // Stats grid
        const stats = [
            { label: translations.totalEvents, value: entries.length },
            { label: translations.averageIntensity, value: report.averageIntensity.toFixed(1) },
            { label: translations.riskLevel, value: report.riskLevel },
        ];
        
        const colWidth = contentWidth / 3;
        stats.forEach((stat, i) => {
            const x = margin + (i * colWidth);
            addText(cleanText(stat.label), x, y, 8, colors.textMuted);
            addText(String(stat.value), x, y + 5, 16, colors.text, 'bold');
        });
        y += 15;
        
        drawLine(y);
        y += 8;
    }

    // === ENTRIES ===
    addText(cleanText(translations.timeline).toUpperCase(), margin, y, 11, colors.accent, 'bold');
    y += 10;

    // Entries list - compact format
    entries
        .sort((a, b) => b.createdAt - a.createdAt)
        .forEach((entry, index) => {
            // Check if we need new page
            if (y > pageHeight - margin - 15) {
                doc.addPage();
                y = margin;
                addText(cleanText(translations.timeline).toUpperCase() + ' (cont.)', margin, y, 11, colors.accent, 'bold');
                y += 10;
            }

            const date = new Date(entry.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });

            // Intensity indicator (small colored square)
            const intensityColor = colors.intensity[Math.min(entry.intensity - 1, 9)];
            doc.setFillColor(intensityColor);
            doc.roundedRect(margin, y - 2, 4, 4, 0.5, 0.5, 'F');
            
            // Date and intensity
            addText(`${date}  •  ${translations.intensity}: ${entry.intensity}/10`, margin + 7, y, 8, colors.textMuted);
            y += 5;
            
            // Title (if exists)
            const title = entry.content.title || entry.content.text.slice(0, 50);
            const cleanedTitle = cleanText(title);
            const lines = doc.splitTextToSize(cleanedTitle, contentWidth - 7);
            
            addText(lines[0] + (lines.length > 1 ? '...' : ''), margin + 7, y, 10, colors.text);
            y += 6;
            
            // Entry text preview (first line only)
            if (entry.content.text && entry.content.text.length > title.length) {
                const preview = entry.content.text.slice(title.length, title.length + 100);
                const cleanedPreview = cleanText(preview);
                const previewLines = doc.splitTextToSize(cleanedPreview, contentWidth - 7);
                
                if (previewLines[0] && previewLines[0].trim()) {
                    addText(previewLines[0] + (previewLines.length > 1 ? '...' : ''), margin + 7, y, 8, colors.textMuted);
                    y += 5;
                }
            }
            
            y += 4; // spacing between entries
            
            // Separator line every 3 entries
            if ((index + 1) % 3 === 0 && index < entries.length - 1) {
                doc.setDrawColor(colors.border);
                doc.setLineWidth(0.1);
                doc.line(margin + 7, y - 2, pageWidth - margin, y - 2);
            }
        });

    // === FOOTER ===
    const footerY = pageHeight - margin + 5;
    doc.setDrawColor(colors.border);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);
    
    addText('ROCKGARDEN • rockgarden.app', margin, footerY, 8, colors.textMuted);
    addText(`${entries.length} entries`, pageWidth - margin, footerY, 8, colors.textMuted, 'normal');

    return doc.output('blob');
}

export function downloadPDF(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
