/**
 * Landing Page - Rockgarden
 * First impression for new visitors
 * Auto-detects browser language
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Lock, Smartphone, Trash2, Globe, ArrowRight, ChevronDown, Languages, Info, ShieldCheck, WifiOff, Eye, AlertTriangle } from 'lucide-react';
import { LanguageSwitcher } from '../layout/LanguageSwitcher';
import { StoneGardenDemo } from './StoneGardenDemo';
import { ExpandableSection } from './ExpandableSection';
import { detectBrowserLanguage } from '../../i18n/utils';
import { setLanguage } from '../../i18n/config';
import './LandingPage.css';

interface LandingPageProps {
    onEnter: () => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
    const { t, i18n } = useTranslation();
    const [scrolled, setScrolled] = useState(false);
    const [isLanguageLoaded, setIsLanguageLoaded] = useState(false);

    // Auto-detect and set browser language on mount
    useEffect(() => {
        const setupLanguage = async () => {
            // Check if user already has a saved preference
            const savedLang = localStorage.getItem('i18nextLng');
            
            if (!savedLang) {
                // No saved preference, detect browser language
                const browserLang = detectBrowserLanguage();
                if (browserLang !== i18n.language) {
                    await setLanguage(browserLang);
                }
            }
            setIsLanguageLoaded(true);
        };
        
        setupLanguage();
    }, [i18n]);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const features = [
        {
            icon: <Lock size={24} />,
            title: t('landing.featureEncryptionTitle'),
            desc: t('landing.featureEncryptionDesc'),
        },
        {
            icon: <Smartphone size={24} />,
            title: t('landing.featureOfflineTitle'),
            desc: t('landing.featureOfflineDesc'),
        },
        {
            icon: <Trash2 size={24} />,
            title: t('landing.featurePanicTitle'),
            desc: t('landing.featurePanicDesc'),
        },
        {
            icon: <Globe size={24} />,
            title: t('landing.featureI18nTitle'),
            desc: t('landing.featureI18nDesc'),
        },
    ];

    // Show loading state while language is being set up
    if (!isLanguageLoaded) {
        return (
            <div className="landing-page landing-loading">
                <div className="landing-loading-content">
                    <div className="landing-nav-icon"></div>
                    <p>rockgarden</p>
                </div>
            </div>
        );
    }

    return (
        <div className="landing-page">
            {/* Navigation */}
            <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
                <div className="landing-nav-brand">
                    <div className="landing-nav-icon"></div>
                    <span>rockgarden</span>
                </div>
                <div className="landing-nav-actions">
                    <div className="landing-language-switcher">
                        <Languages size={18} />
                        <LanguageSwitcher />
                    </div>
                    <button className="landing-nav-cta" onClick={onEnter}>
                        {t('landing.openApp')}
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="landing-hero">
                <div className="landing-hero-bg">
                    {/* Animated stones */}
                    <div className="hero-stone hero-stone-1"></div>
                    <div className="hero-stone hero-stone-2"></div>
                    <div className="hero-stone hero-stone-3"></div>
                    <div className="hero-stone hero-stone-4"></div>
                </div>

                <div className="landing-hero-content">
                    <h1 className="landing-hero-title">
                        {t('landing.heroTitle')}
                    </h1>
                    <p className="landing-hero-subtitle">
                        {t('landing.heroSubtitle')}
                    </p>
                    <div className="landing-hero-cta">
                        <button className="landing-hero-btn primary" onClick={onEnter}>
                            <span>{t('landing.startNow')}</span>
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>

                <div className="landing-hero-scroll">
                    <ChevronDown size={24} />
                </div>
            </section>

            {/* Features Section */}
            <section className="landing-features">
                <div className="landing-section-header">
                    <h2>{t('landing.featuresTitle')}</h2>
                    <p>{t('landing.featuresSubtitle')}</p>
                </div>

                <div className="landing-features-grid">
                    {features.map((feature, index) => (
                        <div key={index} className="landing-feature-card">
                            <div className="landing-feature-icon">{feature.icon}</div>
                            <h3>{feature.title}</h3>
                            <p>{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Stones Metaphor Section */}
            <section className="landing-stones">
                <div className="landing-section-header">
                    <h2>{t('landing.stonesTitle')}</h2>
                    <p>{t('landing.stonesSubtitle')}</p>
                </div>

                {/* Static visualization of metaphor */}
                <div className="landing-stones-demo">
                    <div className="stones-demo-container">
                        <div className="demo-stone-wrapper">
                            <div className="demo-stone-visual large"></div>
                            <span className="demo-stone-label">{t('landing.stoneLarge')}</span>
                            <span className="demo-stone-sublabel">{t('landing.legendSize')}</span>
                        </div>
                        
                        <div className="demo-stone-wrapper">
                            <div className="demo-stone-visual medium"></div>
                            <span className="demo-stone-label">{t('landing.stoneMedium')}</span>
                        </div>
                        
                        <div className="demo-stone-wrapper">
                            <div className="demo-stone-visual small"></div>
                            <span className="demo-stone-label">{t('landing.stoneSmall')}</span>
                            <span className="demo-stone-sublabel">{t('landing.legendFade')}</span>
                        </div>
                    </div>
                </div>

                {/* Interactive Garden Preview */}
                <div className="landing-garden-preview">
                    <h3 className="garden-preview-title">{t('landing.gardenPreviewTitle')}</h3>
                    <p className="garden-preview-subtitle">{t('landing.gardenPreviewSubtitle')}</p>
                    <StoneGardenDemo />
                </div>
            </section>

            {/* How it Works */}
            <section className="landing-how">
                <div className="landing-section-header">
                    <h2>{t('landing.howTitle')}</h2>
                </div>

                <div className="landing-how-steps">
                    <div className="landing-step">
                        <div className="landing-step-number">01</div>
                        <h3>{t('landing.step1Title')}</h3>
                        <p>{t('landing.step1Desc')}</p>
                    </div>
                    <div className="landing-step-arrow">→</div>
                    <div className="landing-step">
                        <div className="landing-step-number">02</div>
                        <h3>{t('landing.step2Title')}</h3>
                        <p>{t('landing.step2Desc')}</p>
                    </div>
                    <div className="landing-step-arrow">→</div>
                    <div className="landing-step">
                        <div className="landing-step-number">03</div>
                        <h3>{t('landing.step3Title')}</h3>
                        <p>{t('landing.step3Desc')}</p>
                    </div>
                </div>
            </section>

            {/* Technical Details Section */}
            <section className="landing-details">
                <div className="landing-section-header">
                    <h2>{t('landing.detailsTitle')}</h2>
                    <p>{t('landing.detailsSubtitle')}</p>
                </div>

                <div className="landing-details-content">
                    {/* For Everyone - Simple Explanation */}
                    <ExpandableSection 
                        title={t('landing.forEveryoneTitle')} 
                        defaultExpanded={true}
                    >
                        <p>{t('landing.forEveryoneDesc')}</p>
                        <div className="detail-cards">
                            <div className="detail-card">
                                <ShieldCheck size={24} color="#c0a080" />
                                <h4>{t('landing.featureList.encryption')}</h4>
                            </div>
                            <div className="detail-card">
                                <WifiOff size={24} color="#4ade80" />
                                <h4>{t('landing.featureList.offline')}</h4>
                            </div>
                            <div className="detail-card">
                                <Lock size={24} color="#60a5fa" />
                                <h4>{t('landing.featureList.nopasswords')}</h4>
                            </div>
                            <div className="detail-card">
                                <Info size={24} color="#f87171" />
                                <h4>{t('landing.featureList.nodata')}</h4>
                            </div>
                        </div>
                    </ExpandableSection>

                    {/* Technical Specs */}
                    <ExpandableSection title={t('landing.technicalTitle')}>
                        <h4 style={{ color: '#c0a080', marginBottom: '0.5rem' }}>
                            {t('landing.encryptionDetails')}
                        </h4>
                        <p>{t('landing.encryptionDetailsDesc')}</p>
                        <ul>
                            <li><code>AES-256-GCM</code> — {t('landing.technicalSpecs.aes')}</li>
                            <li><code>PBKDF2</code> — {t('landing.technicalSpecs.pbkdf2')}</li>
                            <li>{t('landing.technicalSpecs.salt')}</li>
                            <li>{t('landing.technicalSpecs.iv')}</li>
                            <li>{t('landing.technicalSpecs.session')}</li>
                        </ul>

                        <h4 style={{ color: '#c0a080', margin: '1.5rem 0 0.5rem' }}>
                            {t('landing.zeroKnowledge')}
                        </h4>
                        <p>{t('landing.zeroKnowledgeDesc')}</p>
                        <ul>
                            <li>{t('landing.zeroKnowledgePoints.noStorage')}</li>
                            <li>{t('landing.zeroKnowledgePoints.noRecovery')}</li>
                            <li>{t('landing.zeroKnowledgePoints.noCloud')}</li>
                            <li>{t('landing.zeroKnowledgePoints.noAnalytics')}</li>
                        </ul>

                        <h4 style={{ color: '#c0a080', margin: '1.5rem 0 0.5rem' }}>
                            {t('landing.offlineFirst')}
                        </h4>
                        <p>{t('landing.offlineFirstDesc')}</p>
                        <ul>
                            <li><code>IndexedDB</code> — {t('landing.offlineFeatures.storage')}</li>
                            <li><code>Web Crypto API</code> — {t('landing.offlineFeatures.crypto')}</li>
                            <li><code>Service Worker</code> — {t('landing.offlineFeatures.pwa')}</li>
                            <li>{t('landing.offlineFeatures.fonts')}</li>
                        </ul>
                    </ExpandableSection>

                    {/* Visualization Details */}
                    <ExpandableSection title={t('landing.visualizationTitle')}>
                        <p>{t('landing.visualizationDesc')}</p>
                        <div className="detail-cards" style={{ marginTop: '1rem' }}>
                            <div className="detail-card">
                                <Eye size={24} color="#c0a080" />
                                <h4>{t('landing.stoneEncoding.size')}</h4>
                            </div>
                            <div className="detail-card">
                                <Eye size={24} color="#60a5fa" style={{ opacity: 0.5 }} />
                                <h4>{t('landing.stoneEncoding.opacity')}</h4>
                            </div>
                            <div className="detail-card">
                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #c0a080, #fff)' }} />
                                <h4>{t('landing.stoneEncoding.color')}</h4>
                            </div>
                        </div>
                        <h4 style={{ color: '#c0a080', margin: '1.5rem 0 0.5rem' }}>View Modes</h4>
                        <ul>
                            <li><strong>{t('landing.viewModes.scatter')}</strong></li>
                            <li><strong>{t('landing.viewModes.piles')}</strong></li>
                            <li><strong>{t('landing.viewModes.cairn')}</strong></li>
                        </ul>
                    </ExpandableSection>

                    {/* Emergency Features */}
                    <ExpandableSection title={t('landing.emergencyTitle')}>
                        <p>{t('landing.emergencyDesc')}</p>
                        <div className="detail-cards" style={{ marginTop: '1rem' }}>
                            <div className="detail-card" style={{ borderColor: 'rgba(248, 113, 113, 0.3)' }}>
                                <AlertTriangle size={24} color="#f87171" />
                                <h4 style={{ color: '#f87171' }}>{t('landing.emergencyFeatures.panic')}</h4>
                            </div>
                            <div className="detail-card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                                <Trash2 size={24} color="#ef4444" />
                                <h4 style={{ color: '#ef4444' }}>{t('landing.emergencyFeatures.burn')}</h4>
                            </div>
                            <div className="detail-card">
                                <Lock size={24} color="#c0a080" />
                                <h4>{t('landing.emergencyFeatures.autolock')}</h4>
                            </div>
                            <div className="detail-card">
                                <Shield size={24} color="#4ade80" />
                                <h4>{t('landing.emergencyFeatures.timing')}</h4>
                            </div>
                        </div>
                    </ExpandableSection>
                </div>
            </section>

            {/* Security Section */}
            <section className="landing-security">
                <div className="landing-security-content">
                    <div className="landing-security-icon">
                        <Shield size={48} />
                    </div>
                    <h2>{t('landing.securityTitle')}</h2>
                    <p>{t('landing.securityDesc')}</p>
                    <ul className="landing-security-list">
                        <li>{t('landing.securityPoint1')}</li>
                        <li>{t('landing.securityPoint2')}</li>
                        <li>{t('landing.securityPoint3')}</li>
                    </ul>
                </div>
            </section>

            {/* CTA Section */}
            <section className="landing-cta">
                <h2>{t('landing.ctaTitle')}</h2>
                <p>{t('landing.ctaSubtitle')}</p>
                <button className="landing-cta-btn" onClick={onEnter}>
                    {t('landing.enterRockgarden')}
                </button>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="landing-footer-brand">
                    <div className="landing-footer-icon"></div>
                    <span>rockgarden</span>
                </div>
                <p className="landing-footer-copy">
                    {t('landing.footer')}
                </p>
            </footer>
        </div>
    );
}
