/**
 * Pattern Analysis Service
 * Analyzes journal entries for abuse patterns and safety indicators
 */

import type { DecryptedEntry } from '../types';

// Abuse pattern phrases to detect
const PATTERNS = {
    APOLOGETIC_CYCLES: [
        "i'm sorry", "i didn't mean", "didn't mean to", "won't happen again",
        "i promise", "forgive me", "i regret", "my mistake"
    ],
    HYPER_VIGILANCE: [
        "walking on eggshells", "on edge", "never know", "afraid to",
        "scared of", "nervous when", "anxious about", "can't relax"
    ],
    DIGITAL_MONITORING: [
        "check your phone", "looking at my", "going through my", "reading my",
        "tracking my", "gps", "location", "messages", "who were you"
    ],
    ISOLATION: [
        "can't see", "don't talk to", "staying away from", "avoiding",
        "cut off", "isolated", "no friends", "alone now"
    ],
    THREATS: [
        "i'll kill", "i'll hurt", "if you leave", "can't live without",
        "suicide if", "hurt myself", "hurt the kids", "destroy"
    ],
    GASLIGHTING: [
        "you're crazy", "you imagined", "that didn't happen", "you're too sensitive",
        "overreacting", "making things up", "remember wrong"
    ],
    FINANCIAL_CONTROL: [
        "my money", "i control", "can't afford", "no access to", "account",
        "cut off financially", "dependent on"
    ]
};

export interface DetectedPattern {
    id: string;
    phrase: string;
    category: keyof typeof PATTERNS;
    occurrences: number;
    insight: string;
}

export interface SafetyMilestone {
    id: string;
    label: string;
    completed: boolean;
    completedAt?: number;
}

export interface RiskMetrics {
    escalationVelocity: {
        value: number; // 0-100
        label: 'Low' | 'Moderate' | 'High' | 'Critical';
    };
    isolationIndicator: {
        value: number;
        label: 'Low' | 'Moderate' | 'High' | 'Severe';
    };
    frequencyTrend: 'increasing' | 'stable' | 'decreasing';
}

export interface AnalysisReport {
    detectedPatterns: DetectedPattern[];
    riskMetrics: RiskMetrics;
    milestones: SafetyMilestone[];
    recommendation: string;
    period: {
        start: number;
        end: number;
        days: number;
    };
}

/**
 * Analyze entries for patterns
 */
export function analyzePatterns(entries: DecryptedEntry[]): AnalysisReport {
    const now = Date.now();
    const periodStart = now - (90 * 24 * 60 * 60 * 1000); // Last 90 days
    
    const recentEntries = entries.filter(e => e.date >= periodStart);
    const allText = recentEntries.map(e => 
        `${e.content.title} ${e.content.text}`.toLowerCase()
    ).join(' ');
    
    // Detect patterns
    const detectedPatterns: DetectedPattern[] = [];
    
    Object.entries(PATTERNS).forEach(([category, phrases]) => {
        phrases.forEach(phrase => {
            const count = countOccurrences(allText, phrase);
            if (count > 0) {
                detectedPatterns.push({
                    id: `${category}_${phrase}`,
                    phrase: phrase,
                    category: category as keyof typeof PATTERNS,
                    occurrences: count,
                    insight: generateInsight(category as keyof typeof PATTERNS, count)
                });
            }
        });
    });
    
    // Sort by occurrences
    detectedPatterns.sort((a, b) => b.occurrences - a.occurrences);
    
    // Calculate risk metrics
    const riskMetrics = calculateRiskMetrics(recentEntries, detectedPatterns);
    
    // Get milestones
    const milestones = calculateMilestones(entries);
    
    // Generate recommendation
    const recommendation = generateRecommendation(detectedPatterns, riskMetrics);
    
    return {
        detectedPatterns: detectedPatterns.slice(0, 6), // Top 6 patterns
        riskMetrics,
        milestones,
        recommendation,
        period: {
            start: periodStart,
            end: now,
            days: 90
        }
    };
}

function countOccurrences(text: string, phrase: string): number {
    let count = 0;
    let pos = text.indexOf(phrase);
    while (pos !== -1) {
        count++;
        pos = text.indexOf(phrase, pos + 1);
    }
    return count;
}

function generateInsight(category: keyof typeof PATTERNS, count: number): string {
    const insights: Record<keyof typeof PATTERNS, string> = {
        APOLOGETIC_CYCLES: `High frequency of apologetic cycles often preceding escalation phases.`,
        HYPER_VIGILANCE: `Sustained hyper-vigilance noted in ${count} separate entries.`,
        DIGITAL_MONITORING: `Increasing patterns of digital monitoring and boundary intrusion.`,
        ISOLATION: `Evidence of social isolation tactics affecting support network.`,
        THREATS: `Direct or indirect threats detected requiring immediate attention.`,
        GASLIGHTING: `Systematic reality distortion undermining perception and confidence.`,
        FINANCIAL_CONTROL: `Financial dependency mechanisms limiting independence.`
    };
    return insights[category] || `Pattern detected ${count} times.`;
}

function calculateRiskMetrics(
    entries: DecryptedEntry[],
    patterns: DetectedPattern[]
): RiskMetrics {
    // Calculate escalation velocity based on entry frequency and intensity
    const sortedByDate = [...entries].sort((a, b) => a.date - b.date);
    let escalationValue = 0;
    
    if (sortedByDate.length >= 3) {
        const firstThird = sortedByDate.slice(0, Math.floor(entries.length / 3));
        const lastThird = sortedByDate.slice(-Math.floor(entries.length / 3));
        
        const firstAvgIntensity = averageIntensity(firstThird);
        const lastAvgIntensity = averageIntensity(lastThird);
        
        escalationValue = Math.min(100, Math.max(0, 
            ((lastAvgIntensity - firstAvgIntensity) / firstAvgIntensity) * 100 + 30
        ));
    } else if (entries.length > 0) {
        escalationValue = averageIntensity(entries) * 10;
    }
    
    // Isolation indicator based on isolation patterns + frequency
    const isolationPatterns = patterns.filter(p => 
        p.category === 'ISOLATION' || p.category === 'DIGITAL_MONITORING'
    );
    const isolationValue = Math.min(100, 
        isolationPatterns.reduce((sum, p) => sum + p.occurrences * 10, 0) + 
        (entries.length > 20 ? 20 : 0)
    );
    
    // Frequency trend
    const frequencyTrend: 'increasing' | 'stable' | 'decreasing' = 
        entries.length > 15 ? 'increasing' : 
        entries.length > 5 ? 'stable' : 'decreasing';
    
    return {
        escalationVelocity: {
            value: Math.round(escalationValue),
            label: escalationValue < 25 ? 'Low' :
                   escalationValue < 50 ? 'Moderate' :
                   escalationValue < 75 ? 'High' : 'Critical'
        },
        isolationIndicator: {
            value: Math.round(isolationValue),
            label: isolationValue < 25 ? 'Low' :
                    isolationValue < 50 ? 'Moderate' :
                    isolationValue < 75 ? 'High' : 'Severe'
        },
        frequencyTrend
    };
}

function averageIntensity(entries: DecryptedEntry[]): number {
    if (entries.length === 0) return 0;
    return entries.reduce((sum, e) => sum + e.intensity, 0) / entries.length;
}

function calculateMilestones(entries: DecryptedEntry[]): SafetyMilestone[] {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    return [
        {
            id: 'secure_archive',
            label: 'Secure Document Archive',
            completed: entries.length >= 5,
            completedAt: entries.length >= 5 ? entries[4].createdAt : undefined
        },
        {
            id: 'continuous_log',
            label: '30 Days Continuous Log',
            completed: entries.some(e => e.date <= thirtyDaysAgo),
            completedAt: entries.find(e => e.date <= thirtyDaysAgo)?.createdAt
        },
        {
            id: 'external_contact',
            label: 'External Contact Established',
            completed: false
        },
        {
            id: 'emergency_exit',
            label: 'Emergency Exit Protocol',
            completed: false
        }
    ];
}

function generateRecommendation(
    patterns: DetectedPattern[],
    metrics: RiskMetrics
): string {
    // Find the most prominent pattern
    const topPattern = patterns[0];
    
    if (metrics.escalationVelocity.label === 'Critical' || 
        metrics.isolationIndicator.label === 'Severe') {
        return 'Immediate safety planning recommended. Contact local resources.';
    }
    
    if (topPattern?.category === 'HYPER_VIGILANCE') {
        return 'Based on the "Eggshell" pattern, consider reviewing the Safety Resources tab for de-escalation strategies.';
    }
    
    if (topPattern?.category === 'APOLOGETIC_CYCLES') {
        return 'Documenting apologetic cycles is valuable evidence. Continue logging consistently.';
    }
    
    if (topPattern?.category === 'DIGITAL_MONITORING') {
        return 'Digital surveillance is a serious red flag. Review device security guidelines.';
    }
    
    if (patterns.length === 0) {
        return 'Continue documenting your experiences. Pattern recognition improves with more data.';
    }
    
    return `Monitoring ${patterns.length} active patterns. Regular documentation strengthens your safety plan.`;
}

/**
 * Export report as JSON for legal use
 */
export function exportReportForLegal(report: AnalysisReport): string {
    return JSON.stringify({
        generatedAt: Date.now(),
        ...report,
        disclaimer: 'This analysis is based on narrative patterns and is intended for personal reflection and decision support, not as a clinical or legal diagnosis.'
    }, null, 2);
}
