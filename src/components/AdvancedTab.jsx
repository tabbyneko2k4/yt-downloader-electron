import React, { useState } from 'react';
import { Terminal, Bookmark, RotateCcw, Copy, Eye, Plus, Trash2, Subtitles, Clock, Cookie, Zap, Code, FileCode } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

export default function AdvancedTab({ advancedOptions, setAdvancedOptions }) {
  const { t } = useTranslation();
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [customPresets, setCustomPresets] = useState(() => {
    const saved = localStorage.getItem('media_downloader_custom_presets');
    return saved ? JSON.parse(saved) : [];
  });
  const [newPresetName, setNewPresetName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  const builtinPresets = [
    {
      id: 'preset-speed',
      name: t('presetSpeedBoost'),
      desc: t('presetSpeedBoostDesc'),
      options: { rateLimit: '10M', customArgs: '--no-mtime' }
    },
    {
      id: 'preset-subs',
      name: t('presetSubs'),
      desc: t('presetSubsDesc'),
      options: { writeSubs: true, embedSubs: true, subLangs: 'vi,en' }
    },
    {
      id: 'preset-bypass',
      name: t('presetBypass'),
      desc: t('presetBypassDesc'),
      options: { cookiesFromBrowser: 'chrome', customArgs: '--geo-bypass' }
    },
    {
      id: 'preset-cut-1m',
      name: t('presetCut'),
      desc: t('presetCutDesc'),
      options: { downloadSections: '*00:00:00-00:01:00' }
    }
  ];

  const handleChange = (field, value) => {
    setAdvancedOptions((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleReset = () => {
    setAdvancedOptions({
      writeSubs: false,
      embedSubs: false,
      subLangs: 'vi,en',
      downloadSections: '',
      cookiesFromBrowser: 'none',
      rateLimit: '',
      customFormat: '',
      customArgs: ''
    });
  };

  const handleApplyPreset = (presetOptions) => {
    setAdvancedOptions((prev) => ({
      ...prev,
      ...presetOptions
    }));
  };

  const handleSaveCustomPreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      desc: t('customPresetDesc') || 'Cấu hình tùy chỉnh cá nhân',
      options: { ...advancedOptions }
    };
    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    localStorage.setItem('media_downloader_custom_presets', JSON.stringify(updated));
    setNewPresetName('');
    setShowSaveModal(false);
  };

  const handleDeleteCustomPreset = (e, presetId) => {
    e.stopPropagation();
    const updated = customPresets.filter((p) => p.id !== presetId);
    setCustomPresets(updated);
    localStorage.setItem('media_downloader_custom_presets', JSON.stringify(updated));
  };

  const generateCmdPreview = () => {
    const args = ['yt-dlp', '"[URL_MEDIA]"'];
    if (advancedOptions.writeSubs) args.push('--write-subs');
    if (advancedOptions.embedSubs) args.push('--embed-subs');
    if (advancedOptions.writeSubs && advancedOptions.subLangs) args.push(`--sub-langs "${advancedOptions.subLangs}"`);
    if (advancedOptions.downloadSections) args.push(`--download-sections "${advancedOptions.downloadSections}"`);
    if (advancedOptions.cookiesFromBrowser && advancedOptions.cookiesFromBrowser !== 'none') {
      args.push(`--cookies-from-browser ${advancedOptions.cookiesFromBrowser}`);
    }
    if (advancedOptions.rateLimit) args.push(`-r ${advancedOptions.rateLimit}`);
    if (advancedOptions.customFormat) args.push(`-f "${advancedOptions.customFormat}"`);
    if (advancedOptions.customArgs) args.push(advancedOptions.customArgs);
    return args.join(' ');
  };

  const copyCmdPreview = () => {
    navigator.clipboard.writeText(generateCmdPreview());
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="advanced-tab-container">
      {/* Top Banner & Live CLI Command Preview Box */}
      <section className="card" style={{ background: 'var(--bg-card)', padding: '16px 20px' }}>
        <div className="advanced-header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={20} color="#c084fc" />
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
              {t('advancedTitle')}
            </h2>
          </div>

          <div className="advanced-header-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setShowSaveModal(true)}
              style={{ padding: '7px 12px', fontSize: '12px', color: '#c084fc', borderColor: 'rgba(192, 132, 252, 0.3)' }}
            >
              <Plus size={14} />
              <span>{t('savePresetBtn')}</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={handleReset}
              style={{ padding: '7px 12px', fontSize: '12px' }}
            >
              <RotateCcw size={14} />
              <span>{t('resetBtn')}</span>
            </button>
          </div>
        </div>

        {/* Live Command Terminal Box */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px 14px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Eye size={12} color="#10b981" />
              <span>{t('previewCmdTitle')}</span>
            </span>
            <button
              onClick={copyCmdPreview}
              style={{ background: 'transparent', border: 'none', color: copiedCmd ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 4px' }}
            >
              <Copy size={12} />
              <span>{copiedCmd ? t('cmdCopied') : t('copyCmd')}</span>
            </button>
          </div>
          <code className="cmd-preview-box" style={{ fontFamily: 'Consolas, monospace', fontSize: '12px', color: '#10b981', wordBreak: 'break-all', display: 'block' }}>
            {generateCmdPreview()}
          </code>
        </div>
      </section>

      {/* Preset Selector Grid */}
      <section className="card">
        <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Bookmark size={16} color="#f59e0b" />
          <span>{t('presetsSectionTitle')}</span>
        </h3>

        <div className="advanced-preset-grid">
          {/* Built-in Presets */}
          {builtinPresets.map((preset) => (
            <div
              key={preset.id}
              onClick={() => handleApplyPreset(preset.options)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              className="preset-card-item"
            >
              <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>
                {preset.name}
              </h4>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                {preset.desc}
              </p>
            </div>
          ))}

          {/* Saved Custom Presets */}
          {customPresets.map((preset) => (
            <div
              key={preset.id}
              onClick={() => handleApplyPreset(preset.options)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid #8b5cf6',
                borderRadius: '10px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              className="preset-card-item"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#c084fc', marginBottom: '4px', wordBreak: 'break-word' }}>
                  ⭐ {preset.name}
                </h4>
                <button
                  onClick={(e) => handleDeleteCustomPreset(e, preset.id)}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px', flexShrink: 0 }}
                  title={t('delete') || 'Xóa'}
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                {preset.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Categorized Visual Configuration Cards */}
      <div className="advanced-options-grid">
        {/* Subtitles Visual Controls */}
        <section className="card" style={{ marginBottom: 0 }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Subtitles size={18} color="#ec4899" />
            <span>{t('subtitlesSection')}</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label className="advanced-checkbox-label">
              <input
                type="checkbox"
                style={{ width: '18px', height: '18px', accentColor: '#8b5cf6', cursor: 'pointer' }}
                checked={advancedOptions.writeSubs}
                onChange={(e) => handleChange('writeSubs', e.target.checked)}
              />
              <span>{t('writeSubs')}</span>
            </label>

            <label className="advanced-checkbox-label">
              <input
                type="checkbox"
                style={{ width: '18px', height: '18px', accentColor: '#8b5cf6', cursor: 'pointer' }}
                checked={advancedOptions.embedSubs}
                onChange={(e) => handleChange('embedSubs', e.target.checked)}
              />
              <span>{t('embedSubs')}</span>
            </label>

            <div style={{ marginTop: '4px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                {t('subLangsLabel')}
              </label>
              <input
                type="text"
                className="text-input"
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
                placeholder="vi,en"
                value={advancedOptions.subLangs}
                onChange={(e) => handleChange('subLangs', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Time Cut Section Visual Controls */}
        <section className="card" style={{ marginBottom: 0 }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={18} color="#3b82f6" />
            <span>{t('downloadSectionsLabel')}</span>
          </h3>

          <div>
            <input
              type="text"
              className="text-input"
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
              placeholder={t('downloadSectionsPlaceholder')}
              value={advancedOptions.downloadSections}
              onChange={(e) => handleChange('downloadSections', e.target.value)}
            />
          </div>
        </section>

        {/* Cookies & Geo-bypass */}
        <section className="card" style={{ marginBottom: 0 }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cookie size={18} color="#f59e0b" />
            <span>{t('cookieBrowserLabel')}</span>
          </h3>

          <div>
            <div className="advanced-cookie-grid">
              {[
                { name: t('cookieNone'), id: 'none' },
                { name: t('cookieChrome'), id: 'chrome' },
                { name: t('cookieEdge'), id: 'edge' },
                { name: t('cookieFirefox'), id: 'firefox' },
                { name: t('cookieBrave'), id: 'brave' }
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleChange('cookiesFromBrowser', b.id)}
                  className="advanced-cookie-btn"
                  style={{
                    padding: '8px 6px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    border: advancedOptions.cookiesFromBrowser === b.id ? '1px solid #f59e0b' : '1px solid var(--border-color)',
                    background: advancedOptions.cookiesFromBrowser === b.id ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-secondary)',
                    color: advancedOptions.cookiesFromBrowser === b.id ? '#f59e0b' : 'var(--text-muted)',
                    cursor: 'pointer',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Speed Limit & Rate */}
        <section className="card" style={{ marginBottom: 0 }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={18} color="#10b981" />
            <span>{t('rateLimitLabel')}</span>
          </h3>

          <div>
            <input
              type="text"
              className="text-input"
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
              placeholder={t('rateLimitPlaceholder')}
              value={advancedOptions.rateLimit}
              onChange={(e) => handleChange('rateLimit', e.target.value)}
            />
          </div>
        </section>

        {/* Custom Format Box */}
        <section className="card advanced-grid-full-width" style={{ marginBottom: 0 }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Code size={18} color="#8b5cf6" />
            <span>{t('customFormatLabel')}</span>
          </h3>

          <input
            type="text"
            className="text-input"
            style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}
            placeholder={t('customFormatPlaceholder')}
            value={advancedOptions.customFormat}
            onChange={(e) => handleChange('customFormat', e.target.value)}
          />
        </section>

        {/* Extra CLI Flags */}
        <section className="card advanced-grid-full-width" style={{ marginBottom: 0 }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileCode size={18} color="#06b6d4" />
            <span>{t('customArgsLabel')}</span>
          </h3>

          <input
            type="text"
            className="text-input"
            style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}
            placeholder={t('customArgsPlaceholder')}
            value={advancedOptions.customArgs}
            onChange={(e) => handleChange('customArgs', e.target.value)}
          />
        </section>
      </div>

      {/* Save Preset Modal */}
      {showSaveModal && (
        <div className="modal-backdrop" onClick={() => setShowSaveModal(false)}>
          <div className="modal-window" style={{ maxWidth: '450px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>
                {t('savePresetModalTitle')}
              </h3>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <input
                type="text"
                className="text-input"
                style={{ width: '100%', padding: '10px 14px', fontSize: '13px', marginBottom: '16px' }}
                placeholder={t('presetNamePlaceholder')}
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowSaveModal(false)}
                  style={{ padding: '8px 16px', fontSize: '13px', flex: '1' }}
                >
                  {t('cancel')}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSaveCustomPreset}
                  style={{ padding: '8px 16px', fontSize: '13px', flex: '1' }}
                >
                  {t('save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

