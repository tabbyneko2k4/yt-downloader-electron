import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import MiniApp from './components/MiniApp';
import { LanguageProvider } from './i18n/LanguageContext';
import './index.css';

function MiniRoot() {
  const [language, setLanguage] = useState(() => {
    try {
      const saved = localStorage.getItem('media_downloader_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.language) return parsed.language;
      }
    } catch (e) {}
    return 'en';
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('media_downloader_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.theme && parsed.theme !== 'system') {
          document.documentElement.setAttribute('data-theme', parsed.theme);
        }
      }
    } catch (e) {}

    if (window.api && window.api.onSyncSettings) {
      const unsub = window.api.onSyncSettings((newSettings) => {
        if (!newSettings) return;
        if (newSettings.language) {
          setLanguage(newSettings.language);
        }
        if (newSettings.theme) {
          const themeMode = newSettings.theme;
          let resolved = themeMode;
          if (themeMode === 'system') {
            resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          }
          document.documentElement.setAttribute('data-theme', resolved);
        }
      });
      return unsub;
    }
  }, []);

  return (
    <LanguageProvider language={language} onLanguageChange={setLanguage}>
      <MiniApp />
    </LanguageProvider>
  );
}

ReactDOM.createRoot(document.getElementById('mini-root')).render(
  <React.StrictMode>
    <MiniRoot />
  </React.StrictMode>
);
