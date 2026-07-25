import React, { useState } from 'react';
import { Download, Terminal, FolderCheck, Settings, Minus, Square, X, ArrowDown, Globe, Sun, Moon, Monitor, Menu } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

export default function Header({ activeTab, setActiveTab, downloadsCount, activeDownloads = [], downloadQueue = [], settings, updateSettings }) {
  const { t, language, setLanguage, LANGUAGES } = useTranslation();
  const [isBurgerOpen, setIsBurgerOpen] = useState(false);

  const handleMinimize = () => {
    if (window.api && window.api.minimizeWindow) window.api.minimizeWindow();
  };

  const handleMaximize = () => {
    if (window.api && window.api.maximizeWindow) window.api.maximizeWindow();
  };

  const handleClose = () => {
    if (window.api && window.api.closeWindow) window.api.closeWindow();
  };

  const isDownloading = activeDownloads.length > 0;
  const currentActive = activeDownloads[0];
  const activePercent = currentActive?.percent ? currentActive.percent.toFixed(0) : 0;

  const currentTheme = settings?.theme || 'system';

  const toggleTheme = () => {
    if (!updateSettings) return;
    const nextTheme = currentTheme === 'system' ? 'dark' : (currentTheme === 'dark' ? 'light' : 'system');
    updateSettings({ theme: nextTheme });
  };

  const cycleLanguage = () => {
    const currentIndex = LANGUAGES.findIndex((l) => l.code === language);
    const nextIndex = (currentIndex + 1) % LANGUAGES.length;
    const nextLang = LANGUAGES[nextIndex].code;
    setLanguage(nextLang);
    if (updateSettings) {
      updateSettings({ language: nextLang });
    }
  };

  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const handleTabSelect = (tabKey) => {
    setActiveTab(tabKey);
    setIsBurgerOpen(false);
  };

  return (
    <>
      <header className="app-header">
        <div className="header-layout">
          {/* Left: App Logo Icon & Title */}
          <div className="header-left">
            <svg className="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 3.88 12 3.88 12 3.88s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"
                fill="url(#header-logo-grad)"
              />
              <path d="M9.75 15.02l6-3.27-6-3.27v6.54z" fill="#ffffff" />
              <defs>
                <linearGradient id="header-logo-grad" x1="1" y1="11.75" x2="23" y2="11.75" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#ec4899" />
                  <stop offset="0.5" stopColor="#8b5cf6" />
                  <stop offset="1" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <span className="app-header-title">{t('appName')}</span>
          </div>

          {/* Center: Tabs Navigation (Desktop & Ultra-Narrow Taskbar) */}
          <div className="header-center">
            <nav className="nav-tabs">
              <button
                className={`nav-tab-btn ${activeTab === 'downloader' ? 'active' : ''}`}
                onClick={() => handleTabSelect('downloader')}
                title={t('navDownloader')}
              >
                <Download size={17} />
                <span className="tab-label">{t('navDownloader')}</span>
              </button>

              <button
                className={`nav-tab-btn ${activeTab === 'advanced' ? 'active' : ''}`}
                onClick={() => handleTabSelect('advanced')}
                title={t('navAdvanced')}
              >
                <Terminal size={17} />
                <span className="tab-label">{t('navAdvanced')}</span>
              </button>

              <button
                className={`nav-tab-btn ${activeTab === 'downloads' ? 'active' : ''} ${isDownloading ? 'chrome-downloading-tab' : ''}`}
                onClick={() => handleTabSelect('downloads')}
                title={t('navDownloads')}
              >
                {isDownloading ? (
                  <div className="chrome-dl-anim-wrapper">
                    <ArrowDown size={17} className="chrome-dl-arrow" />
                  </div>
                ) : (
                  <FolderCheck size={17} />
                )}
                <span className="tab-label">{t('navDownloads')}</span>
                {isDownloading ? (
                  <span className="badge-count chrome-dl-badge">{activePercent}%</span>
                ) : downloadsCount > 0 ? (
                  <span className="badge-count">{downloadsCount}</span>
                ) : null}
              </button>

              <button
                className={`nav-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => handleTabSelect('settings')}
                title={t('navSettings')}
              >
                <Settings size={17} />
                <span className="tab-label">{t('navSettings')}</span>
              </button>

              {/* Animated Nav-Under Progress Bar */}
              {isDownloading && (
                <div className="header-nav-under-progress">
                  <div
                    className="header-nav-under-fill animate-shimmer"
                    style={{ width: `${activePercent}%` }}
                  />
                  <div className="header-nav-under-glow" />
                </div>
              )}
            </nav>
          </div>

          {/* Right: Minimal Icon Controls & Window Controls */}
          <div className="header-right window-controls">
            {/* Mobile Burger Menu Button */}
            <button
              className={`window-control-btn mobile-burger-toggle no-drag ${isBurgerOpen ? 'active' : ''}`}
              onClick={() => setIsBurgerOpen(!isBurgerOpen)}
              title="Menu"
            >
              {isBurgerOpen ? <X size={18} color="#ec4899" /> : <Menu size={18} className="burger-menu-icon" />}
              {!isBurgerOpen && (isDownloading || downloadsCount > 0) && (
                <span className="burger-notification-dot" />
              )}
            </button>

            {/* Globe Icon-only Language Button */}
            <button
              className="window-control-btn header-quick-btn no-drag"
              onClick={cycleLanguage}
              title={`${t('languageLabel')}: ${currentLangObj.flag} ${currentLangObj.name}`}
            >
              <Globe size={14} className="header-globe-icon" />
            </button>

            {/* Minimal Quick Theme Icon Button */}
            {updateSettings && (
              <button
                className="window-control-btn header-quick-btn no-drag"
                onClick={toggleTheme}
                title={`${t('themeLabel')}: ${currentTheme === 'system' ? t('themeSystem') : currentTheme === 'dark' ? t('themeDark') : t('themeLight')}`}
              >
                {currentTheme === 'dark' ? (
                  <Moon size={14} color="#c084fc" />
                ) : currentTheme === 'light' ? (
                  <Sun size={14} color="#f59e0b" />
                ) : (
                  <Monitor size={14} color="#3b82f6" />
                )}
              </button>
            )}

            <button className="window-control-btn btn-min" onClick={handleMinimize} title={t('minTitle')}>
              <Minus size={14} />
            </button>
            <button className="window-control-btn btn-max" onClick={handleMaximize} title={t('maxTitle')}>
              <Square size={12} />
            </button>
            <button className="window-control-btn btn-close" onClick={handleClose} title={t('closeTitle')}>
              <X size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Burger Menu Drawer */}
      {isBurgerOpen && (
        <div className="burger-overlay" onClick={() => setIsBurgerOpen(false)}>
          <div className="burger-dropdown-menu" onClick={(e) => e.stopPropagation()}>
            <div className="burger-menu-header">
              <div className="burger-brand">
                <svg className="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 3.88 12 3.88 12 3.88s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"
                    fill="url(#burger-logo-grad)"
                  />
                  <path d="M9.75 15.02l6-3.27-6-3.27v6.54z" fill="#ffffff" />
                  <defs>
                    <linearGradient id="burger-logo-grad" x1="1" y1="11.75" x2="23" y2="11.75" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#ec4899" />
                      <stop offset="0.5" stopColor="#8b5cf6" />
                      <stop offset="1" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="burger-brand-text">
                  <span className="burger-menu-title">{t('appName')}</span>
                  <span className="burger-menu-sub">Navigation</span>
                </div>
              </div>
              <button className="burger-close-btn" onClick={() => setIsBurgerOpen(false)} title="Close">
                <X size={18} />
              </button>
            </div>

            <div className="burger-tabs-list">
              <button
                className={`burger-tab-item ${activeTab === 'downloader' ? 'active' : ''}`}
                onClick={() => handleTabSelect('downloader')}
              >
                <div className="burger-tab-left">
                  <div className="burger-tab-icon-box downloader">
                    <Download size={18} />
                  </div>
                  <div className="burger-tab-info">
                    <span className="burger-tab-title">{t('navDownloader')}</span>
                    <span className="burger-tab-desc">
                      {language === 'vi' ? 'Tải video, MP3 & Playlist' : 'Download Video, Audio & Playlists'}
                    </span>
                  </div>
                </div>
              </button>

              <button
                className={`burger-tab-item ${activeTab === 'advanced' ? 'active' : ''}`}
                onClick={() => handleTabSelect('advanced')}
              >
                <div className="burger-tab-left">
                  <div className="burger-tab-icon-box advanced">
                    <Terminal size={18} />
                  </div>
                  <div className="burger-tab-info">
                    <span className="burger-tab-title">{t('navAdvanced')}</span>
                    <span className="burger-tab-desc">
                      {language === 'vi' ? 'Tùy chỉnh CLI, Cookie & Proxy' : 'CLI Customization & Presets'}
                    </span>
                  </div>
                </div>
              </button>

              <button
                className={`burger-tab-item ${activeTab === 'downloads' ? 'active' : ''}`}
                onClick={() => handleTabSelect('downloads')}
              >
                <div className="burger-tab-left">
                  <div className="burger-tab-icon-box downloads">
                    {isDownloading ? (
                      <ArrowDown size={18} className="chrome-dl-arrow" />
                    ) : (
                      <FolderCheck size={18} />
                    )}
                  </div>
                  <div className="burger-tab-info">
                    <span className="burger-tab-title">{t('navDownloads')}</span>
                    <span className="burger-tab-desc">
                      {isDownloading
                        ? (language === 'vi' ? `Đang tải xuống (${activePercent}%)` : `Downloading (${activePercent}%)`)
                        : (language === 'vi' ? 'Quản lý tệp đã tải xuống' : 'Manage downloaded history')}
                    </span>
                  </div>
                </div>
                {isDownloading ? (
                  <span className="badge-count chrome-dl-badge">{activePercent}%</span>
                ) : downloadsCount > 0 ? (
                  <span className="badge-count">{downloadsCount}</span>
                ) : null}
              </button>

              <button
                className={`burger-tab-item ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => handleTabSelect('settings')}
              >
                <div className="burger-tab-left">
                  <div className="burger-tab-icon-box settings">
                    <Settings size={18} />
                  </div>
                  <div className="burger-tab-info">
                    <span className="burger-tab-title">{t('navSettings')}</span>
                    <span className="burger-tab-desc">
                      {language === 'vi' ? 'Thư mục lưu trữ & Giao diện' : 'Storage folder & UI Theme'}
                    </span>
                  </div>
                </div>
              </button>
            </div>

            <div className="burger-quick-settings">
              <div className="burger-setting-row" onClick={cycleLanguage}>
                <div className="burger-setting-left">
                  <div className="burger-setting-icon">
                    <Globe size={16} color="#a78bfa" />
                  </div>
                  <span>{t('languageLabel')}</span>
                </div>
                <span className="burger-setting-val-pill">
                  {currentLangObj.flag} {currentLangObj.name}
                </span>
              </div>

              {updateSettings && (
                <div className="burger-setting-row" onClick={toggleTheme}>
                  <div className="burger-setting-left">
                    <div className="burger-setting-icon">
                      {currentTheme === 'dark' ? (
                        <Moon size={16} color="#c084fc" />
                      ) : currentTheme === 'light' ? (
                        <Sun size={16} color="#f59e0b" />
                      ) : (
                        <Monitor size={16} color="#3b82f6" />
                      )}
                    </div>
                    <span>{t('themeLabel')}</span>
                  </div>
                  <span className="burger-setting-val-pill">
                    {currentTheme === 'system' ? t('themeSystem') : currentTheme === 'dark' ? t('themeDark') : t('themeLight')}
                  </span>
                </div>
              )}
            </div>

            <div className="burger-footer-info">
              <span>YT Downloader Pro</span>
              <span className="burger-dot">•</span>
              <span>v2.5</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

