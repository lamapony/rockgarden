/**
 * Analytics Service for Specialist Export
 * calculates patterns, frequencies, and trends
 */

import type { DecryptedEntry } from '../types';

export interface AnalyticsReport {
    totalIncidents: number;
    averageIntensity: number;
    maxIntensity: number;
    intensityTrend: number[]; // Array of intensity values sorted by date
    dates: string[]; // Corresponding dates

    // Frequency analysis
    averageIntervalDays: number;
    timeOfDay: {
        morning: number;   // 06-12
        afternoon: number; // 12-18
        evening: number;   // 18-24
        night: number;     // 00-06
    };

    // Risk assessment
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    escalationDetected: boolean;
}

export function analyzeEntries(entries: DecryptedEntry[]): AnalyticsReport {
    if (entries.length === 0) {
        return {
            totalIncidents: 0,
            averageIntensity: 0,
            maxIntensity: 0,
            intensityTrend: [],
            dates: [],
            averageIntervalDays: 0,
            timeOfDay: { morning: 0, afternoon: 0, evening: 0, night: 0 },
            riskLevel: 'low',
            escalationDetected: false,
        };
    }

    // Sort by date ascending
    const sorted = [...entries].sort((a, b) => a.date - b.date);

    // Basic stats
    const totalIncidents = sorted.length;
    const intensities = sorted.map(e => e.intensity);
    const averageIntensity = Math.round((intensities.reduce((a, b) => a + b, 0) / totalIncidents) * 10) / 10;
    const maxIntensity = Math.max(...intensities);

    // Time of day analysis
    const timeOfDay = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    sorted.forEach(entry => {
        const hour = new Date(entry.date).getHours();
        if (hour >= 6 && hour < 12) timeOfDay.morning++;
        else if (hour >= 12 && hour < 18) timeOfDay.afternoon++;
        else if (hour >= 18 && hour < 24) timeOfDay.evening++;
        else timeOfDay.night++;
    });

    // Interval analysis
    let totalInterval = 0;
    if (sorted.length > 1) {
        for (let i = 1; i < sorted.length; i++) {
            const diff = sorted[i].date - sorted[i - 1].date;
            totalInterval += diff;
        }
    }
    const averageIntervalDays = sorted.length > 1
        ? Math.round((totalInterval / (sorted.length - 1)) / (1000 * 60 * 60 * 24))
        : 0;

    // Escalation detection (simple trend check)
    // Check if average intensity of last 3 events is higher than first 3
    let escalationDetected = false;
    if (sorted.length >= 6) {
        const first3Avg = (sorted[0].intensity + sorted[1].intensity + sorted[2].intensity) / 3;
        const last3Avg = (sorted[sorted.length - 1].intensity + sorted[sorted.length - 2].intensity + sorted[sorted.length - 3].intensity) / 3;
        escalationDetected = last3Avg > first3Avg;
    }

    // Risk calculation
    let riskLevel: AnalyticsReport['riskLevel'] = 'low';
    if (maxIntensity >= 8 || averageIntensity >= 7 || escalationDetected) riskLevel = 'critical';
    else if (maxIntensity >= 6 || averageIntensity >= 5) riskLevel = 'high';
    else if (maxIntensity >= 4) riskLevel = 'medium';

    return {
        totalIncidents,
        averageIntensity,
        maxIntensity,
        intensityTrend: intensities,
        dates: sorted.map(e => new Date(e.date).toLocaleDateString()),
        averageIntervalDays,
        timeOfDay,
        riskLevel,
        escalationDetected,
    };
}
