import React, { useState } from 'react';
import { Folder, HardDrive, Check, Move, Globe, Sun, Moon, Monitor, Palette, Info, ShieldCheck, Cpu, LogOut } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

export default function SettingsTab({ settings, updateSettings }) {
  const { t, language, setLanguage, LANGUAGES } = useTranslation();
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSelectDirectory = async () => {
    if (window.api && window.api.selectDirectory) {
      const selected = await window.api.selectDirectory();
      if (selected) {
        updateSettings({ defaultPath: selected });
      }
    }
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const themeOptions = [
    { id: 'system', name: t('themeSystem'), icon: Monitor, color: '#3b82f6' },
    { id: 'dark', name: t('themeDark'), icon: Moon, color: '#c084fc' },
    { id: 'light', name: t('themeLight'), icon: Sun, color: '#f59e0b' }
  ];

  const currentTheme = settings.theme || 'system';

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <section className="card fade-in-up">
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HardDrive size={20} color="#8b5cf6" />
          <span>{t('settingsTitle')}</span>
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 0. Interface Language Selection */}
          <div style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={16} color="#a78bfa" />
              <span>{t('languageLabel')}</span>
            </label>
            <div className="settings-lang-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginTop: '10px' }}>
              {LANGUAGES.map((l) => {
                const isSelected = (settings.language || language) === l.code;
                return (
                  <div
                    key={l.code}
                    onClick={() => {
                      updateSettings({ language: l.code });
                      setLanguage(l.code);
                    }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: isSelected ? '1px solid #8b5cf6' : '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(139, 92, 246, 0.18)' : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{l.flag}</span>
                    <span style={{ fontSize: '13px', fontWeight: isSelected ? '700' : '500', color: 'var(--text-main)' }}>
                      {l.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 0.5. Theme Selection */}
          <div style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Palette size={16} color="#ec4899" />
              <span>{t('themeLabel')}</span>
            </label>
            <div className="settings-theme-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '10px' }}>
              {themeOptions.map((opt) => {
                const IconComp = opt.icon;
                const isSelected = currentTheme === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => updateSettings({ theme: opt.id })}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: isSelected ? '1px solid #8b5cf6' : '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(139, 92, 246, 0.18)' : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <IconComp size={18} color={opt.color} />
                    <span style={{ fontSize: '13px', fontWeight: isSelected ? '700' : '500', color: 'var(--text-main)' }}>
                      {opt.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 1. Default Directory Selection */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
              {t('storageFolderLabel')}
            </label>
            <div className="settings-folder-row" style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="text-input"
                style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
                value={settings.defaultPath || ''}
                placeholder={t('selectFolderPlaceholder')}
                readOnly
              />
              <button
                className="btn btn-secondary"
                onClick={handleSelectDirectory}
                style={{ padding: '8px 14px', fontSize: '13px' }}
              >
                <Folder size={15} />
                <span>{t('changeFolderBtn')}</span>
              </button>
            </div>
          </div>

          {/* 2. Drag & Drop Mode Settings for Playlists */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Move size={15} color="#3b82f6" />
              <span>{t('dragModeLabel')}</span>
            </label>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
              {t('dragModeDesc')}
            </p>

            <div className="settings-drag-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div
                onClick={() => updateSettings({ playlistDragMode: 'folder' })}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: (settings.playlistDragMode || 'folder') === 'folder' ? '1px solid #8b5cf6' : '1px solid var(--border-color)',
                  background: (settings.playlistDragMode || 'folder') === 'folder' ? 'rgba(139, 92, 246, 0.18)' : 'var(--bg-secondary)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>
                  {t('dragModeFolder')}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {t('dragModeFolderDesc')}
                </div>
              </div>

              <div
                onClick={() => updateSettings({ playlistDragMode: 'files' })}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: settings.playlistDragMode === 'files' ? '1px solid #8b5cf6' : '1px solid var(--border-color)',
                  background: settings.playlistDragMode === 'files' ? 'rgba(139, 92, 246, 0.18)' : 'var(--bg-secondary)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>
                  {t('dragModeFiles')}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {t('dragModeFilesDesc')}
                </div>
              </div>
            </div>
          </div>

          {/* 2.5 Close Window Action Settings */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <LogOut size={15} color="#ef4444" />
              <span>{t('closeSettingLabel') || 'Khi đóng cửa sổ chính'}</span>
            </label>

            <div className="settings-close-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '10px' }}>
              {[
                { id: 'ask', name: t('closeSettingAsk') || 'Luôn hỏi tôi', dontAsk: false, action: 'ask' },
                { id: 'minimize', name: t('closeSettingMinimize') || 'Thu nhỏ khay hệ thống', dontAsk: true, action: 'minimize' },
                { id: 'exit', name: t('closeSettingExit') || 'Thoát ứng dụng', dontAsk: true, action: 'exit' }
              ].map((opt) => {
                const isSelected = settings.dontAskClose
                  ? settings.closeAction === opt.action
                  : opt.id === 'ask';
                return (
                  <div
                    key={opt.id}
                    onClick={() => updateSettings({ closeAction: opt.action, dontAskClose: opt.dontAsk })}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: isSelected ? '1px solid #8b5cf6' : '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(139, 92, 246, 0.18)' : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: isSelected ? '700' : '500',
                      color: 'var(--text-main)',
                      textAlign: 'center'
                    }}
                  >
                    {opt.name}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Concurrent Downloads Limit */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
              {t('maxConcurrentLabel')}
            </label>
            <select
              className="custom-select settings-select"
              style={{ width: '250px', fontSize: '13px' }}
              value={settings.maxConcurrentDownloads || 2}
              onChange={(e) => updateSettings({ maxConcurrentDownloads: parseInt(e.target.value, 10) })}
            >
              <option value="1">{t('maxConcurrent1')}</option>
              <option value="2">{t('maxConcurrent2')}</option>
              <option value="3">{t('maxConcurrent3')}</option>
              <option value="5">{t('maxConcurrent5')}</option>
            </select>
          </div>

          {/* 4. Default Metadata & Thumbnail Checkboxes */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>
              {t('defaultMetadataLabel')}
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={settings.embedMetadata}
                onChange={(e) => updateSettings({ embedMetadata: e.target.checked })}
              />
              <span>{t('embedMetadataCheck')}</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={settings.embedThumbnail}
                onChange={(e) => updateSettings({ embedThumbnail: e.target.checked })}
              />
              <span>{t('embedThumbnailCheck')}</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={settings.showFooterDisclaimer !== false}
                onChange={(e) => updateSettings({ showFooterDisclaimer: e.target.checked })}
              />
              <span>{t('showFooterDisclaimerCheck')}</span>
            </label>
          </div>

          {/* 5. Chrome Extension Integration Settings */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={16} color="#10b981" />
              <span>Chrome Extension</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={settings.autoOpenMiniWindowOnExtension !== false}
                onChange={(e) => updateSettings({ autoOpenMiniWindowOnExtension: e.target.checked })}
              />
              <span>Tự động hiển thị Mini-Window khi nhận lệnh tải từ Chrome Extension</span>
            </label>
          </div>

          {/* Save Button */}
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              style={{ padding: '10px 20px', fontSize: '13px' }}
            >
              <Check size={16} />
              <span>{t('saveSettingsBtn')}</span>
            </button>

            {savedSuccess && (
              <span style={{ color: '#10b981', fontSize: '13px', fontWeight: '600' }} className="fade-in-up">
                {t('settingsSavedSuccess')}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="card fade-in-up">
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={20} color="#ec4899" />
          <span>{t('aboutTitle') || 'Giới thiệu về ứng dụng'}</span>
        </h2>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', background: 'var(--bg-secondary)', padding: '18px 20px', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
            <svg className="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '44px', height: '44px', minWidth: '44px', marginTop: '2px' }}>
              <path
                d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 3.88 12 3.88 12 3.88s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"
                fill="url(#about-logo-grad)"
              />
              <path d="M9.75 15.02l6-3.27-6-3.27v6.54z" fill="#ffffff" />
              <defs>
                <linearGradient id="about-logo-grad" x1="1" y1="11.75" x2="23" y2="11.75" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#ec4899" />
                  <stop offset="0.5" stopColor="#8b5cf6" />
                  <stop offset="1" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span>{t('aboutAppName')}</span>
                <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
                  {t('aboutVersion')}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', maxWidth: '620px', lineHeight: '1.5' }}>
                {t('aboutDesc')}
              </p>
              <div style={{ fontSize: '12px', color: 'var(--text-main)', marginTop: '8px', display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
                <span><strong>Author:</strong> Tabby Neko</span>
                <span><strong>License:</strong> ISC</span>
              </div>
            </div>
          </div>
        </div>

        {/* devDependencies Badges List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={14} color="#8b5cf6" />
            <span>{t('aboutTech')}</span>
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {[
              { name: 'electron', ver: '^31.0.0' },
              { name: 'react', ver: '^19.2.8' },
              { name: 'react-dom', ver: '^19.2.8' },
              { name: 'vite', ver: '^5.4.21' },
              { name: '@vitejs/plugin-react', ver: '^4.7.0' },
              { name: 'electron-builder', ver: '^26.15.3' },
              { name: 'lucide-react', ver: '^1.26.0' }
            ].map((dep) => (
              <span
                key={dep.name}
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  background: 'rgba(139, 92, 246, 0.12)',
                  color: 'var(--text-main)',
                  border: '1px solid rgba(139, 92, 246, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ color: '#c084fc' }}>{dep.name}</span>
                <span style={{ opacity: 0.75, fontSize: '10px', color: 'var(--text-muted)' }}>{dep.ver}</span>
              </span>
            ))}
          </div>
        </div>

        {/* License Details Footer Box */}
        <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.04)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={18} color="#10b981" style={{ minWidth: '18px' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-main)' }}>{t('aboutLicense')}: </strong>
            {t('aboutLicenseText')}
          </span>
        </div>
      </section>
    </div>
  );
}

