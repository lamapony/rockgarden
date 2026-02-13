/**
 * Main App Component
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AuthPage } from './components/auth/AuthPage';
import { JournalPage } from './components/journal/JournalPage';
import { EntryEditor } from './components/journal/EntryEditor';
import { ExportPage } from './components/export/ExportPage';
import { AnalysisPage } from './components/analysis/AnalysisPage';
import { SettingsPage } from './components/settings/SettingsPage';
import './i18n/config';
import './styles/themes.css';
import './styles/global.css';
import { AutoLockProvider } from './components/layout/AutoLockProvider';
import { initTheme } from './services/theme';

function AppRoutes() {
  const { isAuthenticated, isLoading, needsSetup } = useAuth();

  // Initialize theme on app load
  useEffect(() => {
    initTheme();
  }, []);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}



function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AutoLockProvider>
          <AppRoutes />
        </AutoLockProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
