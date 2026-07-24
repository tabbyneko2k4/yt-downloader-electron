import React, { useState } from 'react';
import { Folder, HardDrive, Check, Move, Globe, Sun, Moon, Monitor, Palette } from 'lucide-react';
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
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
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

          {/* 3. Concurrent Downloads Limit */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
              {t('maxConcurrentLabel')}
            </label>
            <select
              className="text-input"
              style={{ width: '250px', padding: '8px 12px', fontSize: '13px' }}
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
    </div>
  );
}
