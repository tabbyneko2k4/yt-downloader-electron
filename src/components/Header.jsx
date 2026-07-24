import React from 'react';
import { Download, Terminal, FolderCheck, Settings, Minus, Square, X, ArrowDown, Loader2 } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, downloadsCount, activeDownloads = [], downloadQueue = [] }) {
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

  return (
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
          <span className="app-header-title">Media Downloader</span>
        </div>

        {/* Center: Tabs Navigation */}
        <div className="header-center">
          <nav className="nav-tabs">
            <button
              className={`nav-tab-btn ${activeTab === 'downloader' ? 'active' : ''}`}
              onClick={() => setActiveTab('downloader')}
            >
              <Download size={15} />
              <span>Media Downloader</span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'advanced' ? 'active' : ''}`}
              onClick={() => setActiveTab('advanced')}
            >
              <Terminal size={15} />
              <span>Tùy chỉnh Nâng cao</span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'downloads' ? 'active' : ''} ${isDownloading ? 'chrome-downloading-tab' : ''}`}
              onClick={() => setActiveTab('downloads')}
            >
              {isDownloading ? (
                <div className="chrome-dl-anim-wrapper">
                  <ArrowDown size={15} className="chrome-dl-arrow" />
                </div>
              ) : (
                <FolderCheck size={15} />
              )}
              <span>Mục đã tải xuống</span>
              {isDownloading ? (
                <span className="badge-count chrome-dl-badge">{activePercent}%</span>
              ) : downloadsCount > 0 ? (
                <span className="badge-count">{downloadsCount}</span>
              ) : null}
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={15} />
              <span>Cài đặt</span>
            </button>
          </nav>
        </div>

        {/* Right: Custom Window Controls */}
        <div className="header-right window-controls">
          <button className="window-control-btn btn-min" onClick={handleMinimize} title="Thu nhỏ">
            <Minus size={14} />
          </button>
          <button className="window-control-btn btn-max" onClick={handleMaximize} title="Phóng to">
            <Square size={12} />
          </button>
          <button className="window-control-btn btn-close" onClick={handleClose} title="Đóng">
            <X size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
