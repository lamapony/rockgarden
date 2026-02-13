/**
 * Settings Page - Stonewall Design
 * Three-column layout: nav | content | sidebar
 * Fully functional with backend integration
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import { deleteAllData } from '../../services/storage';
import { setTheme, type Theme } from '../../services/theme';
import { LanguageSwitcher } from '../layout/LanguageSwitcher';
import { Navigation } from '../layout/Navigation';
import './SettingsPage.css';

type SettingsTab = 'general' | 'privacy' | 'emergency' | 'backup';

const themes: { id: Theme; name: string; color: string }[] = [
    { id: 'monochrome', name: 'Monochrome', color: '#050505' },
    { id: 'warm', name: 'Amber', color: '#d4a574' },
    { id: 'cool', name: 'Ice', color: '#7fb3d5' },
    { id: 'forest', name: 'Moss', color: '#8fb070' },
    { id: 'midnight', name: 'Midnight', color: '#8b92c4' },
];

const AUTO_LOCK_OPTIONS = [
    { value: 1, label: '1 minute' },
    { value: 5, label: '5 minutes' },
    { value: 15, label: '15 minutes' },
    { value: null, label: 'Never' },
];

const AUTO_DELETE_OPTIONS = [
    { value: null, label: 'Never' },
    { value: 30, label: '30 Days' },
    { value: 90, label: '90 Days' },
    { value: 365, label: '1 Year' },
];

export function SettingsPage() {
    const { t } = useTranslation();
    // const { logout } = useAuth();
    const {
        settings,
        loading,
        toggleSetting,
        setAutoLock,
        setAutoDelete,
        downloadExport,
        updateSetting,
    } = useSettings();

    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [currentTheme, setCurrentTheme] = useState<Theme>('monochrome');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Sync theme with settings on mount
    useEffect(() => {
        if (settings.theme) {
            setCurrentTheme(settings.theme);
        }
    }, [settings.theme]);

    const handleThemeChange = async (theme: Theme) => {
        setCurrentTheme(theme);
        await setTheme(theme);
        updateSetting('theme', theme);
    };

    const handlePanic = async () => {
        setDeleting(true);
        try {
            await deleteAllData();
            window.location.reload();
        } catch (err) {
            console.error('Failed to delete data:', err);
            setDeleting(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const success = await downloadExport();
            if (success) {
                console.log('[Settings] Export downloaded');
            }
        } finally {
            setExporting(false);
        }
    };

    const handleToggle = async (key: 'appLock' | 'offlineMode' | 'panicButtonEnabled') => {
        await toggleSetting(key);
    };

    const handleAutoLockChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value === 'null' ? null : parseInt(e.target.value, 10);
        await setAutoLock(value);
    };

    const handleAutoDeleteChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value === 'null' ? null : parseInt(e.target.value, 10);
        await setAutoDelete(value);
    };

    const tabs: { id: SettingsTab; label: string }[] = [
        { id: 'general', label: t('settings.tabGeneral') },
        { id: 'privacy', label: t('settings.tabPrivacy') },
        { id: 'emergency', label: t('settings.tabEmergency') },
        { id: 'backup', label: t('settings.tabBackup') },
    ];

    // Toggle Switch Component
    const Toggle = ({
        checked,
        onChange,
        disabled = false
    }: {
        checked: boolean;
        onChange: () => void;
        disabled?: boolean;
    }) => (
        <button
            className={`toggle ${checked ? 'on' : 'off'} ${disabled ? 'disabled' : ''}`}
            onClick={onChange}
            disabled={disabled}
            type="button"
            aria-pressed={checked}
        >
            <span className="toggle-thumb" />
        </button>
    );

    if (loading) {
        return (
            <div className="settings-page-v2">
                <div className="settings-loading">
                    <div className="spinner"></div>
                    <p>Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="settings-page-v2">
            <header className="settings-v2-header">
                <div className="settings-v2-brand">
                    <div className="settings-v2-brand-icon"></div>
                    <span>rockgarden</span>
                </div>
                <div className="settings-v2-title">{t('settings.title')}</div>
            </header>

            <main className="settings-v2-main">
                <aside className="settings-v2-nav-column">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </aside>

                <div className="settings-v2-content">
                    {activeTab === 'general' && (
                        <>
                            <div className="setting-group">
                                <div className="setting-section-label">{t('settings.interfaceTitle')}</div>
                                <div className="setting-row">
                                    <div className="setting-info">
                                        <span className="setting-title">{t('settings.primaryLanguage')}</span>
                                        <span className="setting-desc">{t('settings.languageDesc')}</span>
                                    </div>
                                    <div className="setting-action">
                                        <LanguageSwitcher />
                                    </div>
                                </div>
                                <div className="setting-row">
                                    <div className="setting-info">
                                        <span className="setting-title">{t('settings.colorTheme')}</span>
                                        <span className="setting-desc">{t('settings.themeDesc')}</span>
                                    </div>
                                    <div className="setting-action">
                                        <div className="swatch-group">
                                            {themes.map((theme) => (
                                                <button
                                                    key={theme.id}
                                                    className={`swatch ${currentTheme === theme.id ? 'active' : ''}`}
                                                    style={{ backgroundColor: theme.color }}
                                                    onClick={() => handleThemeChange(theme.id)}
                                                    title={theme.name}
                                                    aria-label={`Select theme: ${theme.name}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="setting-group">
                                <div className="setting-section-label">{t('settings.securityTitle')}</div>
                                <div className="setting-row">
                                    <div className="setting-info">
                                        <span className="setting-title">{t('settings.appLock')}</span>
                                        <span className="setting-desc">{t('settings.appLockDesc')}</span>
                                    </div>
                                    <div className="setting-action">
                                        <Toggle
                                            checked={settings.appLock}
                                            onChange={() => handleToggle('appLock')}
                                        />
                                    </div>
                                </div>
                                <div className="setting-row">
                                    <div className="setting-info">
                                        <span className="setting-title">{t('settings.autoLock')}</span>
                                        <span className="setting-desc">{t('settings.autoLockDesc')}</span>
                                    </div>
                                    <div className="setting-action">
                                        <select
                                            className="setting-select"
                                            value={settings.autoLockMinutes ?? 'null'}
                                            onChange={handleAutoLockChange}
                                        >
                                            {AUTO_LOCK_OPTIONS.map(opt => (
                                                <option key={String(opt.value)} value={String(opt.value)}>
                                                    {opt.value === 1 && t('settings.minute1')}
                                                    {opt.value === 5 && t('settings.minutes5')}
                                                    {opt.value === 15 && t('settings.minutes15')}
                                                    {opt.value === null && t('settings.never')}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'privacy' && (
                        <div className="setting-group">
                            <div className="setting-section-label">{t('settings.privacyTitle')}</div>
                            <div className="setting-row">
                                <div className="setting-info">
                                    <span className="setting-title">{t('settings.encryptionStatus')}</span>
                                    <span className="setting-desc">{t('settings.encryptionDesc')}</span>
                                </div>
                                <div className="setting-action">
                                    <span className="status-badge verified">{t('analysis.statusActive')}</span>
                                </div>
                            </div>
                            <div className="setting-row">
                                <div className="setting-info">
                                    <span className="setting-title">{t('settings.offlineMode')}</span>
                                    <span className="setting-desc">{t('settings.offlineDesc')}</span>
                                </div>
                                <div className="setting-action">
                                    <Toggle
                                        checked={settings.offlineMode}
                                        onChange={() => handleToggle('offlineMode')}
                                    />
                                </div>
                            </div>
                            <div className="setting-row">
                                <div className="setting-info">
                                    <span className="setting-title">{t('settings.changePassword')}</span>
                                    <span className="setting-desc">Coming in next update</span>
                                </div>
                                <div className="setting-action">
                                    <button className="btn-action" disabled>
                                        {t('settings.updatePassword')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'emergency' && (
                        <div className="setting-group">
                            <div className="setting-section-label">{t('settings.emergencyTitle')}</div>
                            <div className="setting-row">
                                <div className="setting-info">
                                    <span className="setting-title">{t('settings.panicButton')}</span>
                                    <span className="setting-desc">{t('settings.panicButtonDesc')}</span>
                                </div>
                                <div className="setting-action">
                                    <Toggle
                                        checked={settings.panicButtonEnabled}
                                        onChange={() => handleToggle('panicButtonEnabled')}
                                    />
                                </div>
                            </div>
                            <div className="setting-row danger">
                                <div className="setting-info">
                                    <span className="setting-title" style={{ color: 'var(--danger)' }}>
                                        {t('settings.emergencyDelete')}
                                    </span>
                                    <span className="setting-desc">{t('settings.emergencyDeleteDesc')}</span>
                                </div>
                                <div className="setting-action">
                                    <button
                                        className="btn-action btn-danger"
                                        onClick={() => setShowDeleteConfirm(true)}
                                    >
                                        {t('settings.deleteNow')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'backup' && (
                        <div className="setting-group">
                            <div className="setting-section-label">{t('settings.backupTitle')}</div>
                            <div className="setting-row">
                                <div className="setting-info">
                                    <span className="setting-title">{t('settings.exportData')}</span>
                                    <span className="setting-desc">{t('settings.exportDesc')}</span>
                                </div>
                                <div className="setting-action">
                                    <button
                                        className="btn-action"
                                        onClick={handleExport}
                                        disabled={exporting}
                                    >
                                        {exporting ? t('common.loading') : 'JSON'}
                                    </button>
                                </div>
                            </div>
                            <div className="setting-row">
                                <div className="setting-info">
                                    <span className="setting-title">{t('settings.autoDelete')}</span>
                                    <span className="setting-desc">{t('settings.autoDeleteDesc')}</span>
                                </div>
                                <div className="setting-action">
                                    <select
                                        className="setting-select"
                                        value={settings.autoDeleteDays ?? 'null'}
                                        onChange={handleAutoDeleteChange}
                                    >
                                        {AUTO_DELETE_OPTIONS.map(opt => (
                                            <option key={String(opt.value)} value={String(opt.value)}>
                                                {opt.value === null && t('settings.never')}
                                                {opt.value === 30 && t('settings.days30')}
                                                {opt.value === 90 && t('settings.days90')}
                                                {opt.value === 365 && t('settings.year1')}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <aside className="settings-v2-sidebar">
                    <div className="setting-section-label">{t('settings.systemStatus')}</div>
                    <div className="status-card">
                        <div className="status-row">
                            <span>{t('settings.dataIntegrity')}</span>
                            <span className="status-verified">{t('analysis.statusVerified')}</span>
                        </div>
                        <div className="status-desc">
                            {t('settings.encryptionActive')}
                        </div>
                    </div>

                    <div className="setting-section-label">{t('settings.backupLocation')}</div>
                    <div className="status-card dashed">
                        <span className="status-title">{t('settings.localOnly')}</span>
                        <p className="status-desc">{t('settings.cloudDisabled')}</p>
                        <button
                            className="btn-action"
                            style={{ width: '100%', marginTop: '1rem' }}
                            onClick={handleExport}
                            disabled={exporting}
                        >
                            {exporting ? t('common.loading') : t('settings.backupNow')}
                        </button>
                    </div>

                    <div className="version-tag">
                        Build 2.4.0-STABLE<br />Kernel: Obsidian-7
                    </div>
                </aside>
            </main>

            {showDeleteConfirm && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-icon">⚠️</div>
                        <h2 className="modal-title" style={{ color: 'var(--danger)' }}>
                            {t('settings.panicButton')}
                        </h2>
                        <p className="modal-text">
                            {t('settings.panicConfirm')}
                        </p>
                        <div className="modal-actions">
                            <button className="btn-action" onClick={() => setShowDeleteConfirm(false)}>
                                {t('common.cancel')}
                            </button>
                            <button className="btn-action btn-danger" onClick={handlePanic} disabled={deleting}>
                                {deleting ? t('common.loading') : t('settings.panicConfirmButton')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Navigation />
        </div>
    );
}
