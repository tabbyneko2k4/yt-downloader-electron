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
    const applyTheme = (themeMode) => {
      let mode = themeMode || 'system';
      if (!themeMode) {
        try {
          const saved = localStorage.getItem('media_downloader_settings');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.theme) mode = parsed.theme;
          }
        } catch (e) {}
      }

      let resolved = mode;
      if (mode === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', resolved);
      document.documentElement.classList.toggle('dark', resolved === 'dark');
    };

    // Apply theme on initial load
    applyTheme();

    // Listen for OS theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => applyTheme();
    mediaQuery.addEventListener('change', listener);

    // Sync settings with Main Window via IPC
    if (window.api && window.api.onSyncSettings) {
      const unsub = window.api.onSyncSettings((newSettings) => {
        if (!newSettings) return;
        if (newSettings.language) {
          setLanguage(newSettings.language);
        }
        if (newSettings.theme) {
          applyTheme(newSettings.theme);
        }
      });
      return () => {
        mediaQuery.removeEventListener('change', listener);
        if (typeof unsub === 'function') unsub();
      };
    }

    return () => mediaQuery.removeEventListener('change', listener);
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
