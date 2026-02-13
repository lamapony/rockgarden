/**
 * Onboarding Tutorial for new users
 * Step-by-step guide to using Rockgarden
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    X, 
    ChevronRight, 
    ChevronLeft, 
    Shield, 
    PenLine, 
    Eye, 
    Lock, 
    FileText,
    Sparkles,
    CheckCircle2
} from 'lucide-react';
import './Onboarding.css';

const ONBOARDING_COMPLETED_KEY = 'rockgarden_onboarding_completed';
const ONBOARDING_STEP_KEY = 'rockgarden_onboarding_step';

interface OnboardingProps {
    onComplete: () => void;
    onSkip: () => void;
}

export function Onboarding({ onComplete, onSkip }: OnboardingProps) {
    const { t } = useTranslation();
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    // Restore step from localStorage if user refreshed
    useEffect(() => {
        const savedStep = localStorage.getItem(ONBOARDING_STEP_KEY);
        if (savedStep) {
            setCurrentStep(parseInt(savedStep, 10));
        }
    }, []);

    // Save current step
    useEffect(() => {
        localStorage.setItem(ONBOARDING_STEP_KEY, currentStep.toString());
    }, [currentStep]);

    const steps = [
        {
            id: 'welcome',
            icon: <Sparkles size={48} />,
            title: t('onboarding.welcomeTitle'),
            description: t('onboarding.welcomeDesc'),
            tip: t('onboarding.welcomeTip'),
        },
        {
            id: 'create',
            icon: <PenLine size={48} />,
            title: t('onboarding.createTitle'),
            description: t('onboarding.createDesc'),
            tip: t('onboarding.createTip'),
        },
        {
            id: 'visualize',
            icon: <Eye size={48} />,
            title: t('onboarding.visualizeTitle'),
            description: t('onboarding.visualizeDesc'),
            tip: t('onboarding.visualizeTip'),
        },
        {
            id: 'security',
            icon: <Lock size={48} />,
            title: t('onboarding.securityTitle'),
            description: t('onboarding.securityDesc'),
            tip: t('onboarding.securityTip'),
        },
        {
            id: 'analysis',
            icon: <FileText size={48} />,
            title: t('onboarding.analysisTitle'),
            description: t('onboarding.analysisDesc'),
            tip: t('onboarding.analysisTip'),
        },
        {
            id: 'complete',
            icon: <CheckCircle2 size={48} />,
            title: t('onboarding.completeTitle'),
            description: t('onboarding.completeDesc'),
            tip: null,
        },
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleComplete = () => {
        localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
        localStorage.removeItem(ONBOARDING_STEP_KEY);
        setIsVisible(false);
        onComplete();
    };

    const handleSkip = () => {
        localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
        localStorage.removeItem(ONBOARDING_STEP_KEY);
        setIsVisible(false);
        onSkip();
    };

    if (!isVisible) return null;

    const currentStepData = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;
    const isFirstStep = currentStep === 0;

    return (
        <div className="onboarding-overlay">
            <div className="onboarding-modal">
                {/* Close button */}
                <button 
                    className="onboarding-close" 
                    onClick={handleSkip}
                    aria-label={t('common.close')}
                >
                    <X size={20} />
                </button>

                {/* Progress dots */}
                <div className="onboarding-progress">
                    {steps.map((_, index) => (
                        <button
                            key={index}
                            className={`onboarding-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                            onClick={() => setCurrentStep(index)}
                            aria-label={`Step ${index + 1}`}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="onboarding-content">
                    <div className={`onboarding-icon ${currentStepData.id}`}>
                        {currentStepData.icon}
                    </div>
                    
                    <h2 className="onboarding-title">
                        {currentStepData.title}
                    </h2>
                    
                    <p className="onboarding-description">
                        {currentStepData.description}
                    </p>

                    {currentStepData.tip && (
                        <div className="onboarding-tip">
                            <Shield size={16} />
                            <span>{currentStepData.tip}</span>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="onboarding-navigation">
                    {!isFirstStep && (
                        <button 
                            className="onboarding-btn secondary"
                            onClick={handlePrev}
                        >
                            <ChevronLeft size={18} />
                            {t('onboarding.back')}
                        </button>
                    )}
                    
                    <button 
                        className={`onboarding-btn primary ${isFirstStep ? 'full' : ''}`}
                        onClick={handleNext}
                    >
                        {isLastStep ? t('onboarding.finish') : t('onboarding.next')}
                        {!isLastStep && <ChevronRight size={18} />}
                    </button>
                </div>

                {/* Skip option (not on last step) */}
                {!isLastStep && (
                    <button className="onboarding-skip" onClick={handleSkip}>
                        {t('onboarding.skip')}
                    </button>
                )}
            </div>
        </div>
    );
}

// Helper to check if onboarding should be shown
export function shouldShowOnboarding(): boolean {
    return localStorage.getItem(ONBOARDING_COMPLETED_KEY) !== 'true';
}

// Helper to reset onboarding (for testing)
export function resetOnboarding(): void {
    localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    localStorage.removeItem(ONBOARDING_STEP_KEY);
}
