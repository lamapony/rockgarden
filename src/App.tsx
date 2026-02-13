/**
 * Main App Component
 */

import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AuthPage } from './components/auth/AuthPage';
import { LandingPage } from './components/landing/LandingPage';
import { JournalPage } from './components/journal/JournalPage';
import { EntryEditor } from './components/journal/EntryEditor';
import { ExportPage } from './components/export/ExportPage';
import { AnalysisPage } from './components/analysis/AnalysisPage';
import { SettingsPage } from './components/settings/SettingsPage';
import './i18n/config';
import './styles/themes.css';
import './styles/global.css';
import { AutoLockProvider } from './components/layout/AutoLockProvider';
import { PWAUpdateNotification } from './components/layout/PWAUpdateNotification';
import { initTheme } from './services/theme';

const LANDING_SEEN_KEY = 'rockgarden_landing_seen';

function AppRoutes() {
  const { isAuthenticated, isLoading, needsSetup } = useAuth();
  const [showLanding, setShowLanding] = useState(false);

  // Initialize theme on app load
  useEffect(() => {
    initTheme();
  }, []);

  // Check if landing page was seen
  useEffect(() => {
    const landingSeen = localStorage.getItem(LANDING_SEEN_KEY);
    if (!landingSeen && !isAuthenticated && !needsSetup) {
      setShowLanding(true);
    }
  }, [isAuthenticated, needsSetup]);

  const handleLandingEnter = () => {
    localStorage.setItem(LANDING_SEEN_KEY, 'true');
    setShowLanding(false);
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  // Show landing page for first-time visitors
  if (showLanding) {
    return <LandingPage onEnter={handleLandingEnter} />;
  }

  // Show auth page if not authenticated or needs setup
  if (!isAuthenticated || needsSetup) {
    return <AuthPage />;
  }

  return (
    <Routes>
      <Route path="/" element={<JournalPage />} />
      <Route path="/new" element={<EntryEditor />} />
      <Route path="/entry/:id" element={<EntryEditor />} />
      <Route path="/export" element={<ExportPage />} />
      <Route path="/analysis" element={<AnalysisPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/landing" element={<LandingPage onEnter={handleLandingEnter} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}



function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AutoLockProvider>
          <AppRoutes />
          <PWAUpdateNotification />
        </AutoLockProvider>
      </AuthProvider>
    </HashRouter>
  );
}

export default App;
