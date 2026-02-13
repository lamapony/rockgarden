/**
 * PWA Update Notification
 * Warns users about pending updates and suggests backup
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import './PWAUpdateNotification.css';

export function PWAUpdateNotification() {
    const { t } = useTranslation();
    const { downloadExport } = useSettings();
    const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
    const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        // Check if service worker is supported
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                // Check for waiting worker (update available)
                if (registration.waiting) {
                    setWaitingWorker(registration.waiting);
                    setShowUpdatePrompt(true);
                }

                // Listen for new updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // New worker installed but waiting
                                setWaitingWorker(newWorker);
                                setShowUpdatePrompt(true);
                            }
                        });
                    }
                });
            });

            // Listen for messages from service worker
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'SKIP_WAITING') {
                    window.location.reload();
                }
            });
        }
    }, []);

    const handleBackup = async () => {
        setExporting(true);
        try {
            const success = await downloadExport();
            if (success) {
                console.log('[PWA] Backup completed before update');
            }
        } finally {
            setExporting(false);
        }
    };

    const handleUpdate = () => {
        if (waitingWorker) {
            // Tell the service worker to skip waiting
            waitingWorker.postMessage({ type: 'SKIP_WAITING' });
        }
        setShowUpdatePrompt(false);
    };

    const handleDismiss = () => {
        setShowUpdatePrompt(false);
    };

    if (!showUpdatePrompt) return null;

    return (
        <div className="pwa-update-overlay">
            <div className="pwa-update-modal">
                <div className="pwa-update-icon">
                    <AlertTriangle size={40} />
                </div>
                <h2 className="pwa-update-title">{t('pwa.updateTitle')}</h2>
                <p className="pwa-update-text">{t('pwa.updateWarning')}</p>
                
                <div className="pwa-update-actions">
                    <button 
                        className="pwa-btn-backup"
                        onClick={handleBackup}
                        disabled={exporting}
                    >
                        <Download size={16} />
                        {exporting ? t('common.loading') : t('pwa.backupFirst')}
                    </button>
                    
                    <button 
                        className="pwa-btn-update"
                        onClick={handleUpdate}
                    >
                        <RefreshCw size={16} />
                        {t('pwa.updateNow')}
                    </button>
                </div>
                
                <button 
                    className="pwa-btn-dismiss"
                    onClick={handleDismiss}
                >
                    {t('pwa.remindLater')}
                </button>
            </div>
        </div>
    );
}
