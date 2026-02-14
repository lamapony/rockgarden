/**
 * Settings Page - Stonewall Design
 * Three-column layout: nav | content | sidebar
 * Fully functional with backend integration
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ArchiveRestore, Trash2, GraduationCap, ShieldAlert } from 'lucide-react';
import { resetOnboarding } from '../onboarding/Onboarding';
import { useSettings } from '../../hooks/useSettings';
import { useEntries } from '../../hooks/useEntries';
import { useAuth } from '../../hooks/useAuth';
import { deleteAllData } from '../../services/storage';
import { setTheme, type Theme } from '../../services/theme';
import { setDecoyPassword, removeDecoyPassword, hasDecoyPassword } from '../../services/auth';
import { LanguageSwitcher } from '../layout/LanguageSwitcher';
import { Navigation } from '../layout/Navigation';
import './SettingsPage.css';

type SettingsTab = 'general' | 'privacy' | 'emergency' | 'backup' | 'archive';

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
    const { isDecoyMode } = useAuth();
    const {
        settings,
        loading,
        toggleSetting,
        setAutoLock,
        setAutoDelete,
        downloadExport,
        updateSetting,
    } = useSettings();
    const { entries, loadEntries, toggleArchiveEntry, deleteEntry } = useEntries();

    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [currentTheme, setCurrentTheme] = useState<Theme>('monochrome');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showPanicConfirm, setShowPanicConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [exporting, setExporting] = useState(false);
    
    // Decoy password state
    const [decoySet, setDecoySet] = useState(false);
    const [showDecoyModal, setShowDecoyModal] = useState(false);
    const [decoyCurrentPassword, setDecoyCurrentPassword] = useState('');
    const [decoyNewPassword, setDecoyNewPassword] = useState('');
    const [decoyConfirmPassword, setDecoyConfirmPassword] = useState('');
    const [decoyError, setDecoyError] = useState('');
    const [decoyLoading, setDecoyLoading] = useState(false);
    
    // Triple-click detection for panic button
    const clickCountRef = useRef(0);
    const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleBrandClick = useCallback(() => {
        if (!settings.panicButtonEnabled) return;
        
        clickCountRef.current += 1;
        
        if (clickCountRef.current === 3) {
            // Triple click detected
            setShowPanicConfirm(true);
            clickCountRef.current = 0;
            if (clickTimerRef.current) {
                clearTimeout(clickTimerRef.current);
                clickTimerRef.current = null;
            }
        } else {
            // Reset counter after 500ms
            if (clickTimerRef.current) {
                clearTimeout(clickTimerRef.current);
            }
            clickTimerRef.current = setTimeout(() => {
                clickCountRef.current = 0;
            }, 500);
        }
    }, [settings.panicButtonEnabled]);

    // Load entries when archive tab is opened
    useEffect(() => {
        if (activeTab === 'archive') {
            loadEntries();
        }
    }, [activeTab, loadEntries]);

    // Check if decoy password is set
    useEffect(() => {
        async function checkDecoy() {
            const hasDecoy = await hasDecoyPassword();
            setDecoySet(hasDecoy);
        }
        checkDecoy();
    }, []);

    const archivedEntries = entries.filter(e => e.isArchived);

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

    const handleRestartTutorial = () => {
        resetOnboarding();
        window.location.reload();
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

    // Decoy password handlers
    const handleSetDecoy = async () => {
        setDecoyError('');
        
        if (decoyNewPassword.length < 6) {
            setDecoyError(t('auth.passwordTooShort'));
            return;
        }
        
        if (decoyNewPassword !== decoyConfirmPassword) {
            setDecoyError(t('auth.passwordMismatch'));
            return;
        }
        
        setDecoyLoading(true);
        try {
            const success = await setDecoyPassword(decoyCurrentPassword, decoyNewPassword);
            if (success) {
                setDecoySet(true);
                setShowDecoyModal(false);
                setDecoyCurrentPassword('');
                setDecoyNewPassword('');
                setDecoyConfirmPassword('');
            } else {
                setDecoyError(t('auth.wrongPassword'));
            }
        } catch (e) {
            setDecoyError(t('common.error'));
        } finally {
            setDecoyLoading(false);
        }
    };

    const handleRemoveDecoy = async () => {
        setDecoyError('');
        setDecoyLoading(true);
        try {
            const success = await removeDecoyPassword(decoyCurrentPassword);
            if (success) {
                setDecoySet(false);
                setShowDecoyModal(false);
                setDecoyCurrentPassword('');
                setDecoyNewPassword('');
                setDecoyConfirmPassword('');
            } else {
                setDecoyError(t('auth.wrongPassword'));
            }
        } catch (e) {
            setDecoyError(t('common.error'));
        } finally {
            setDecoyLoading(false);
        }
    };

    const openDecoyModal = () => {
        setDecoyError('');
        setDecoyCurrentPassword('');
        setDecoyNewPassword('');
        setDecoyConfirmPassword('');
        setShowDecoyModal(true);
    };

    const tabs: { id: SettingsTab; label: string }[] = [
        { id: 'general', label: t('settings.tabGeneral') },
        { id: 'privacy', label: t('settings.tabPrivacy') },
        { id: 'backup', label: t('settings.tabBackup') },
        { id: 'archive', label: t('journal.archived') },
        { id: 'emergency', label: t('settings.tabEmergency') },
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
                <div 
                    className={`settings-v2-brand ${settings.panicButtonEnabled ? 'panic-enabled' : ''}`}
                    onClick={handleBrandClick}
                    title={settings.panicButtonEnabled ? t('settings.panicButtonDesc') : ''}
                >
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
                            <div className="setting-group">
                                <div className="setting-section-label">{t('common.help')}</div>
                                <div className="setting-row">
                                    <div className="setting-info">
                                        <span className="setting-title">{t('onboarding.restartTitle')}</span>
                                        <span className="setting-desc">{t('onboarding.restartDesc')}</span>
                                    </div>
                                    <div className="setting-action">
                                        <button className="btn-action" onClick={handleRestartTutorial}>
                                            <GraduationCap size={16} />
                                            {t('onboarding.restartButton')}
                                        </button>
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
                            
                            {/* Decoy Password Section */}
                            <div className="setting-section-label" style={{ marginTop: '2rem' }}>
                                {t('settings.decoyTitle')}
                            </div>
                            <div className="setting-row">
                                <div className="setting-info">
                                    <span className="setting-title">
                                        <ShieldAlert size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                                        {t('settings.decoyPassword')}
                                    </span>
                                    <span className="setting-desc">{t('settings.decoyDesc')}</span>
                                </div>
                                <div className="setting-action">
                                    <button 
                                        className={`btn-action ${decoySet ? 'btn-secondary' : ''}`}
                                        onClick={openDecoyModal}
                                        disabled={isDecoyMode}
                                    >
                                        {decoySet ? t('settings.decoyUpdate') : t('settings.decoySet')}
                                    </button>
                                </div>
                            </div>
                            {decoySet && (
                                <div className="setting-row">
                                    <div className="setting-info">
                                        <span className="setting-desc" style={{ color: 'var(--success)' }}>
                                            {t('settings.decoyActive')}
                                        </span>
                                    </div>
                                    <div className="setting-action">
                                        <button 
                                            className="btn-action btn-danger"
                                            onClick={openDecoyModal}
                                            disabled={isDecoyMode}
                                        >
                                            {t('settings.decoyRemove')}
                                        </button>
                                    </div>
                                </div>
                            )}
                            {isDecoyMode && (
                                <div className="setting-row">
                                    <div className="setting-info">
                                        <span className="setting-desc" style={{ color: 'var(--warning)' }}>
                                            {t('settings.decoyModeWarning')}
                                        </span>
                                    </div>
                                </div>
                            )}
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

                    {activeTab === 'archive' && (
                        <div className="setting-group">
                            <div className="setting-section-label">{t('journal.archived')}</div>
                            {archivedEntries.length === 0 ? (
                                <div className="archive-empty">
                                    <p>{t('journal.empty')}</p>
                                </div>
                            ) : (
                                <div className="archive-list">
                                    {archivedEntries.map((entry) => (
                                        <div key={entry.id} className="archive-item">
                                            <div className="archive-item-info">
                                                <span className="archive-item-title">
                                                    {entry.content.title || t('journal.untitled')}
                                                </span>
                                                <span className="archive-item-date">
                                                    {new Date(entry.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="archive-item-actions">
                                                <button
                                                    className="archive-btn restore"
                                                    onClick={() => toggleArchiveEntry(entry.id)}
                                                    title={t('journal.unarchive')}
                                                >
                                                    <ArchiveRestore size={16} />
                                                </button>
                                                <button
                                                    className="archive-btn delete"
                                                    onClick={() => {
                                                        if (confirm(t('journal.deleteConfirm'))) {
                                                            deleteEntry(entry.id);
                                                        }
                                                    }}
                                                    title={t('common.delete')}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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

            {showPanicConfirm && (
                <div className="modal-overlay" onClick={() => setShowPanicConfirm(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-icon">🚨</div>
                        <h2 className="modal-title" style={{ color: 'var(--danger)' }}>
                            {t('settings.panicButton')}
                        </h2>
                        <p className="modal-text">
                            {t('settings.panicConfirm')}
                        </p>
                        <div className="modal-actions">
                            <button className="btn-action" onClick={() => setShowPanicConfirm(false)}>
                                {t('common.cancel')}
                            </button>
                            <button className="btn-action btn-danger" onClick={handlePanic} disabled={deleting}>
                                {deleting ? t('common.loading') : t('settings.panicConfirmButton')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Decoy Password Modal */}
            {showDecoyModal && (
                <div className="modal-overlay" onClick={() => setShowDecoyModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-icon">🛡️</div>
                        <h2 className="modal-title">
                            {decoySet ? t('settings.decoyUpdate') : t('settings.decoySet')}
                        </h2>
                        <p className="modal-text">
                            {t('settings.decoyModalDesc')}
                        </p>
                        
                        {decoyError && (
                            <div className="modal-error" style={{ 
                                color: 'var(--danger)', 
                                marginBottom: '1rem',
                                padding: '0.75rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                borderRadius: '6px',
                                fontSize: '0.875rem'
                            }}>
                                {decoyError}
                            </div>
                        )}
                        
                        <div className="modal-form">
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ 
                                    display: 'block', 
                                    marginBottom: '0.5rem',
                                    fontSize: '0.875rem',
                                    color: 'var(--text-secondary)'
                                }}>
                                    {t('auth.password')}
                                </label>
                                <input
                                    type="password"
                                    value={decoyCurrentPassword}
                                    onChange={(e) => setDecoyCurrentPassword(e.target.value)}
                                    placeholder={t('auth.enterPassword')}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'var(--bg-elevated)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '6px',
                                        color: 'var(--text-primary)',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>
                            
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ 
                                    display: 'block', 
                                    marginBottom: '0.5rem',
                                    fontSize: '0.875rem',
                                    color: 'var(--text-secondary)'
                                }}>
                                    {decoySet ? t('settings.decoyNewPassword') : t('settings.decoyPassword')}
                                </label>
                                <input
                                    type="password"
                                    value={decoyNewPassword}
                                    onChange={(e) => setDecoyNewPassword(e.target.value)}
                                    placeholder={t('settings.decoyPasswordPlaceholder')}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'var(--bg-elevated)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '6px',
                                        color: 'var(--text-primary)',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>
                            
                            {!decoySet && (
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label style={{ 
                                        display: 'block', 
                                        marginBottom: '0.5rem',
                                        fontSize: '0.875rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        {t('auth.confirmPassword')}
                                    </label>
                                    <input
                                        type="password"
                                        value={decoyConfirmPassword}
                                        onChange={(e) => setDecoyConfirmPassword(e.target.value)}
                                        placeholder={t('auth.confirmPassword')}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            background: 'var(--bg-elevated)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '6px',
                                            color: 'var(--text-primary)',
                                            fontSize: '1rem'
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                        
                        <div className="modal-actions">
                            <button 
                                className="btn-action" 
                                onClick={() => setShowDecoyModal(false)}
                                disabled={decoyLoading}
                            >
                                {t('common.cancel')}
                            </button>
                            {decoySet ? (
                                <>
                                    <button 
                                        className="btn-action btn-danger"
                                        onClick={handleRemoveDecoy}
                                        disabled={decoyLoading || !decoyCurrentPassword}
                                    >
                                        {decoyLoading ? t('common.loading') : t('settings.decoyRemove')}
                                    </button>
                                    <button 
                                        className="btn-action btn-primary"
                                        onClick={handleSetDecoy}
                                        disabled={decoyLoading || !decoyCurrentPassword || !decoyNewPassword}
                                    >
                                        {decoyLoading ? t('common.loading') : t('common.save')}
                                    </button>
                                </>
                            ) : (
                                <button 
                                    className="btn-action btn-primary"
                                    onClick={handleSetDecoy}
                                    disabled={decoyLoading || !decoyCurrentPassword || !decoyNewPassword || !decoyConfirmPassword}
                                >
                                    {decoyLoading ? t('common.loading') : t('settings.decoySet')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Navigation />
        </div>
    );
}
