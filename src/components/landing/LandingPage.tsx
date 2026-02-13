/**
 * Landing Page - Rockgarden
 * First impression for new visitors
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Lock, Smartphone, Trash2, Globe, ArrowRight, ChevronDown } from 'lucide-react';
import './LandingPage.css';

interface LandingPageProps {
    onEnter: () => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
    const { t } = useTranslation();
    const [scrolled, setScrolled] = useState(false);

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

    return (
        <div className="landing-page">
            {/* Navigation */}
            <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
                <div className="landing-nav-brand">
                    <div className="landing-nav-icon"></div>
                    <span>rockgarden</span>
                </div>
                <button className="landing-nav-cta" onClick={onEnter}>
                    {t('landing.openApp')}
                </button>
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
