/**
 * Auth Page Component - Stonewall Design
 * Handles password setup and login
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { LanguageSwitcher } from '../layout/LanguageSwitcher';
import './AuthPage.css';

export function AuthPage() {
    const { t } = useTranslation();
    const { needsSetup, setupPassword, login } = useAuth();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (needsSetup) {
                if (password.length < 6) {
                    setError(t('auth.passwordTooShort'));
                    setLoading(false);
                    return;
                }
                if (password !== confirmPassword) {
                    setError(t('auth.passwordMismatch'));
                    setLoading(false);
                    return;
                }
                await setupPassword(password);
            } else {
                const success = await login(password);
                if (!success) {
                    setError(t('auth.wrongPassword'));
                }
            }
        } catch (err) {
            setError(t('common.error'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-language">
                <LanguageSwitcher />
            </div>

            <div className="auth-container">
                {/* Brand icon - white square with cut corner */}
                <div className="auth-brand">
                    <div className="brand-icon-stone"></div>
                    <h1 className="auth-brand-name">STONEWALL</h1>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-input-group">
                        <label className="auth-label">
                            {needsSetup ? t('auth.createPassword') : t('auth.enterPassword')}
                        </label>
                        <input
                            type="password"
                            className={`auth-input ${error ? 'auth-input-error' : ''}`}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {needsSetup && (
                        <div className="auth-input-group">
                            <label className="auth-label">{t('auth.confirmPassword')}</label>
                            <input
                                type="password"
                                className={`auth-input ${error ? 'auth-input-error' : ''}`}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    )}

                    {error && <p className="auth-error">{error}</p>}

                    <button
                        type="submit"
                        className="auth-submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="auth-spinner" />
                        ) : needsSetup ? (
                            t('auth.create')
                        ) : (
                            t('auth.unlock')
                        )}
                    </button>
                </form>

                {needsSetup && (
                    <p className="auth-warning">
                        {t('auth.forgotPassword')}
                    </p>
                )}
            </div>
        </div>
    );
}
