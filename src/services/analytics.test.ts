/**
 * Unit tests for Analytics Service
 */
import { describe, it, expect } from 'vitest';
import { analyzeEntries } from './analytics';
import type { DecryptedEntry } from '../types';

describe('Analytics Service', () => {
    const createMockEntry = (
        id: string,
        overrides?: Partial<DecryptedEntry>
    ): DecryptedEntry => ({
        id,
        date: Date.now(),
        content: { title: 'Test', text: 'Test content', tags: [] },
        intensity: 5,
        hasAudio: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...overrides,
    });

    describe('Empty entries', () => {
        it('should return default values for empty array', () => {
            const report = analyzeEntries([]);

            expect(report).toEqual({
                totalIncidents: 0,
                averageIntensity: 0,
                maxIntensity: 0,
                intensityTrend: [],
                dates: [],
                averageIntervalDays: 0,
                timeOfDay: { morning: 0, afternoon: 0, evening: 0, night: 0 },
                riskLevel: 'low',
                escalationDetected: false,
            });
        });
    });

    describe('Basic statistics', () => {
        it('should calculate total incidents', () => {
            const entries = [
                createMockEntry('1'),
                createMockEntry('2'),
                createMockEntry('3'),
            ];

            const report = analyzeEntries(entries);
            expect(report.totalIncidents).toBe(3);
        });

        it('should calculate average intensity', () => {
            const entries = [
                createMockEntry('1', { intensity: 3 }),
                createMockEntry('2', { intensity: 7 }),
                createMockEntry('3', { intensity: 8 }),
            ];

            const report = analyzeEntries(entries);
            expect(report.averageIntensity).toBe(6); // (3 + 7 + 8) / 3
        });

        it('should calculate max intensity', () => {
            const entries = [
                createMockEntry('1', { intensity: 3 }),
                createMockEntry('2', { intensity: 9 }),
                createMockEntry('3', { intensity: 5 }),
            ];

            const report = analyzeEntries(entries);
            expect(report.maxIntensity).toBe(9);
        });

        it('should round average intensity to 1 decimal place', () => {
            const entries = [
                createMockEntry('1', { intensity: 3 }),
                createMockEntry('2', { intensity: 4 }),
            ];

            const report = analyzeEntries(entries);
            expect(report.averageIntensity).toBe(3.5);
        });
    });

    describe('Time of day analysis', () => {
        it('should count morning entries (6-12)', () => {
            const entries = [
                createMockEntry('1', { date: new Date('2024-01-01T08:00:00').getTime() }),
                createMockEntry('2', { date: new Date('2024-01-01T10:00:00').getTime() }),
                createMockEntry('3', { date: new Date('2024-01-01T14:00:00').getTime() }),
            ];

            const report = analyzeEntries(entries);
            expect(report.timeOfDay.morning).toBe(2);
            expect(report.timeOfDay.afternoon).toBe(1);
        });

        it('should count afternoon entries (12-18)', () => {
            const entries = [
                createMockEntry('1', { date: new Date('2024-01-01T12:00:00').getTime() }),
                createMockEntry('2', { date: new Date('2024-01-01T15:00:00').getTime() }),
                createMockEntry('3', { date: new Date('2024-01-01T17:59:00').getTime() }),
            ];

            const report = analyzeEntries(entries);
            expect(report.timeOfDay.afternoon).toBe(3);
        });

        it('should count evening entries (18-24)', () => {
            const entries = [
                createMockEntry('1', { date: new Date('2024-01-01T18:00:00').getTime() }),
                createMockEntry('2', { date: new Date('2024-01-01T20:00:00').getTime() }),
                createMockEntry('3', { date: new Date('2024-01-01T23:59:00').getTime() }),
            ];

            const report = analyzeEntries(entries);
            expect(report.timeOfDay.evening).toBe(3);
        });

        it('should count night entries (00-06)', () => {
            const entries = [
                createMockEntry('1', { date: new Date('2024-01-01T00:00:00').getTime() }),
                createMockEntry('2', { date: new Date('2024-01-01T03:00:00').getTime() }),
                createMockEntry('3', { date: new Date('2024-01-01T05:59:00').getTime() }),
            ];

            const report = analyzeEntries(entries);
            expect(report.timeOfDay.night).toBe(3);
        });

        it('should correctly distribute entries across all time periods', () => {
            const entries = [
                createMockEntry('1', { date: new Date('2024-01-01T02:00:00').getTime() }), // night
                createMockEntry('2', { date: new Date('2024-01-01T08:00:00').getTime() }), // morning
                createMockEntry('3', { date: new Date('2024-01-01T14:00:00').getTime() }), // afternoon
                createMockEntry('4', { date: new Date('2024-01-01T20:00:00').getTime() }), // evening
            ];

            const report = analyzeEntries(entries);
            expect(report.timeOfDay.night).toBe(1);
            expect(report.timeOfDay.morning).toBe(1);
            expect(report.timeOfDay.afternoon).toBe(1);
            expect(report.timeOfDay.evening).toBe(1);
        });
    });

    describe('Interval analysis', () => {
        it('should calculate average interval between entries', () => {
            const entries = [
                createMockEntry('1', { date: new Date('2024-01-01').getTime() }),
                createMockEntry('2', { date: new Date('2024-01-03').getTime() }),
                createMockEntry('3', { date: new Date('2024-01-06').getTime() }),
            ];

            const report = analyzeEntries(entries);
            // Intervals: 2 days, 3 days -> average = 2.5 days -> rounded = 3
            expect(report.averageIntervalDays).toBe(3);
        });

        it('should return 0 for single entry', () => {
            const entries = [createMockEntry('1')];

            const report = analyzeEntries(entries);
            expect(report.averageIntervalDays).toBe(0);
        });

        it('should return 0 for empty entries', () => {
            const report = analyzeEntries([]);
            expect(report.averageIntervalDays).toBe(0);
        });
    });

    describe('Intensity trend', () => {
        it('should return intensity values sorted by date', () => {
            const entries = [
                createMockEntry('1', { 
                    date: new Date('2024-01-01').getTime(),
                    intensity: 3 
                }),
                createMockEntry('2', { 
                    date: new Date('2024-01-03').getTime(),
                    intensity: 7 
                }),
                createMockEntry('3', { 
                    date: new Date('2024-01-02').getTime(),
                    intensity: 5 
                }),
            ];

            const report = analyzeEntries(entries);
            // Should be sorted by date: Jan 1 (3), Jan 2 (5), Jan 3 (7)
            expect(report.intensityTrend).toEqual([3, 5, 7]);
        });

        it('should return corresponding dates', () => {
            const entries = [
                createMockEntry('1', { date: new Date('2024-01-15').getTime() }),
                createMockEntry('2', { date: new Date('2024-01-10').getTime() }),
            ];

            const report = analyzeEntries(entries);
            // Sorted by date: Jan 10 first, then Jan 15
            expect(report.dates[0]).toContain('10');
            expect(report.dates[1]).toContain('15');
        });
    });

    describe('Risk assessment', () => {
        it('should return low risk by default', () => {
            const entries = [
                createMockEntry('1', { intensity: 1 }),
                createMockEntry('2', { intensity: 2 }),
                createMockEntry('3', { intensity: 3 }),
            ];

            const report = analyzeEntries(entries);
            expect(report.riskLevel).toBe('low');
        });

        it('should return medium risk when max intensity >= 4', () => {
            const entries = [
                createMockEntry('1', { intensity: 2 }),
                createMockEntry('2', { intensity: 4 }),
            ];

            const report = analyzeEntries(entries);
            expect(report.riskLevel).toBe('medium');
        });

        it('should return high risk when max intensity >= 6', () => {
            const entries = [
                createMockEntry('1', { intensity: 5 }),
                createMockEntry('2', { intensity: 6 }),
            ];

            const report = analyzeEntries(entries);
            expect(report.riskLevel).toBe('high');
        });

        it('should return high risk when average intensity >= 5', () => {
            const entries = [
                createMockEntry('1', { intensity: 5 }),
                createMockEntry('2', { intensity: 5 }),
            ];

            const report = analyzeEntries(entries);
            expect(report.riskLevel).toBe('high');
        });

        it('should return critical risk when max intensity >= 8', () => {
            const entries = [
                createMockEntry('1', { intensity: 8 }),
            ];

            const report = analyzeEntries(entries);
            expect(report.riskLevel).toBe('critical');
        });

        it('should return critical risk when average intensity >= 7', () => {
            const entries = [
                createMockEntry('1', { intensity: 7 }),
                createMockEntry('2', { intensity: 7 }),
            ];

            const report = analyzeEntries(entries);
            expect(report.riskLevel).toBe('critical');
        });
    });

    describe('Escalation detection', () => {
        it('should not detect escalation with less than 6 entries', () => {
            const entries = [
                createMockEntry('1', { intensity: 1 }),
                createMockEntry('2', { intensity: 2 }),
                createMockEntry('3', { intensity: 3 }),
                createMockEntry('4', { intensity: 4 }),
                createMockEntry('5', { intensity: 5 }),
            ];

            const report = analyzeEntries(entries);
            expect(report.escalationDetected).toBe(false);
        });

        it('should detect escalation when last 3 avg > first 3 avg', () => {
            const entries = [
                createMockEntry('1', { date: new Date('2024-01-01').getTime(), intensity: 1 }),
                createMockEntry('2', { date: new Date('2024-01-02').getTime(), intensity: 2 }),
                createMockEntry('3', { date: new Date('2024-01-03').getTime(), intensity: 3 }),
                createMockEntry('4', { date: new Date('2024-01-04').getTime(), intensity: 5 }),
                createMockEntry('5', { date: new Date('2024-01-05').getTime(), intensity: 7 }),
                createMockEntry('6', { date: new Date('2024-01-06').getTime(), intensity: 9 }),
            ];

            const report = analyzeEntries(entries);
            // First 3 avg: (1+2+3)/3 = 2
            // Last 3 avg: (5+7+9)/3 = 7
            expect(report.escalationDetected).toBe(true);
        });

        it('should not detect escalation when trend is flat', () => {
            const entries = [
                createMockEntry('1', { date: new Date('2024-01-01').getTime(), intensity: 5 }),
                createMockEntry('2', { date: new Date('2024-01-02').getTime(), intensity: 5 }),
                createMockEntry('3', { date: new Date('2024-01-03').getTime(), intensity: 5 }),
                createMockEntry('4', { date: new Date('2024-01-04').getTime(), intensity: 5 }),
                createMockEntry('5', { date: new Date('2024-01-05').getTime(), intensity: 5 }),
                createMockEntry('6', { date: new Date('2024-01-06').getTime(), intensity: 5 }),
            ];

            const report = analyzeEntries(entries);
            expect(report.escalationDetected).toBe(false);
        });

        it('should not detect escalation when trend is decreasing', () => {
            const entries = [
                createMockEntry('1', { date: new Date('2024-01-01').getTime(), intensity: 9 }),
                createMockEntry('2', { date: new Date('2024-01-02').getTime(), intensity: 8 }),
                createMockEntry('3', { date: new Date('2024-01-03').getTime(), intensity: 7 }),
                createMockEntry('4', { date: new Date('2024-01-04').getTime(), intensity: 5 }),
                createMockEntry('5', { date: new Date('2024-01-05').getTime(), intensity: 3 }),
                createMockEntry('6', { date: new Date('2024-01-06').getTime(), intensity: 1 }),
            ];

            const report = analyzeEntries(entries);
            expect(report.escalationDetected).toBe(false);
        });

        it('should set critical risk when escalation is detected', () => {
            const entries = [
                createMockEntry('1', { date: new Date('2024-01-01').getTime(), intensity: 1 }),
                createMockEntry('2', { date: new Date('2024-01-02').getTime(), intensity: 2 }),
                createMockEntry('3', { date: new Date('2024-01-03').getTime(), intensity: 3 }),
                createMockEntry('4', { date: new Date('2024-01-04').getTime(), intensity: 5 }),
                createMockEntry('5', { date: new Date('2024-01-05').getTime(), intensity: 7 }),
                createMockEntry('6', { date: new Date('2024-01-06').getTime(), intensity: 9 }),
            ];

            const report = analyzeEntries(entries);
            expect(report.escalationDetected).toBe(true);
            expect(report.riskLevel).toBe('critical');
        });
    });
});
