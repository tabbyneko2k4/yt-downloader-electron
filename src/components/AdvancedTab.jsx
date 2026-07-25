import React, { useState, useEffect } from 'react';
import { Terminal, Bookmark, RotateCcw, Copy, Eye, Plus, Trash2, Subtitles, Clock, Cookie, Zap, Code, FileCode, Check } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

export default function AdvancedTab({ advancedOptions, setAdvancedOptions }) {
  const { t } = useTranslation();
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [presetsDb, setPresetsDb] = useState([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    if (window.api && window.api.loadPresetsDb) {
      window.api.loadPresetsDb().then((presets) => {
        if (Array.isArray(presets)) {
          setPresetsDb(presets);
        }
      });
    } else {
      const saved = localStorage.getItem('media_downloader_custom_presets');
      if (saved) {
        try { setPresetsDb(JSON.parse(saved)); } catch (e) {}
      }
    }
  }, []);

  useEffect(() => {
    if (!window.api || !window.api.onSyncPresetsDb) return;
    const unsub = window.api.onSyncPresetsDb((presets) => {
      if (Array.isArray(presets)) {
        setPresetsDb(presets);
      }
    });
    return () => unsub();
  }, []);

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

  const handleSaveCustomPreset = async () => {
    if (!newPresetName.trim()) return;
    const newPreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      desc: t('customPresetDesc') || 'Cấu hình tùy chỉnh cá nhân',
      options: { ...advancedOptions }
    };
    const updated = [...presetsDb, newPreset];
    setPresetsDb(updated);
    localStorage.setItem('media_downloader_custom_presets', JSON.stringify(updated));
    if (window.api && window.api.savePresetsDb) {
      await window.api.savePresetsDb(updated);
    }
    setNewPresetName('');
    setShowSaveModal(false);
  };

  const handleDeletePreset = async (e, presetId) => {
    e.stopPropagation();
    const updated = presetsDb.filter((p) => p.id !== presetId);
    setPresetsDb(updated);
    localStorage.setItem('media_downloader_custom_presets', JSON.stringify(updated));
    if (window.api && window.api.savePresetsDb) {
      await window.api.savePresetsDb(updated);
    }
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
    <div className="relative z-10 w-full max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 text-slate-800 dark:text-slate-100 font-sans select-none animate-fade-in-up">
      {/* Top Banner & Live CLI Command Preview Box */}
      <section className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-sky-200 dark:border-pink-500/20 shadow-light-glow dark:shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-400/30 text-purple-600 dark:text-purple-300">
              <Terminal size={20} />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
              {t('advancedTitle')}
            </h2>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/30 text-purple-600 dark:text-purple-300 text-xs font-semibold transition-all cursor-pointer active:scale-95"
              onClick={() => setShowSaveModal(true)}
            >
              <Plus size={14} />
              <span>{t('savePresetBtn')}</span>
            </button>

            <button
              type="button"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700/60 transition-all cursor-pointer active:scale-95"
              onClick={handleReset}
            >
              <RotateCcw size={14} />
              <span>{t('resetBtn')}</span>
            </button>
          </div>
        </div>

        {/* Live Command Terminal Box */}
        <div className="p-3.5 rounded-2xl bg-slate-950 text-emerald-400 border border-emerald-500/30 shadow-inner space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400 uppercase tracking-wider text-[11px]">
              <Eye size={13} />
              <span>{t('previewCmdTitle')}</span>
            </span>
            <button
              type="button"
              onClick={copyCmdPreview}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-800/80 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
            >
              {copiedCmd ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedCmd ? t('cmdCopied') : t('copyCmd')}</span>
            </button>
          </div>
          <code className="font-mono text-xs text-emerald-400 break-all select-all leading-relaxed block p-1">
            {generateCmdPreview()}
          </code>
        </div>
      </section>

      {/* Preset Selector Grid Section */}
      <section className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-sky-200 dark:border-pink-500/20 shadow-light-glow dark:shadow-xl space-y-4">
        <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Bookmark size={16} className="text-amber-500" />
          <span>{t('presetsSectionTitle')}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Built-in Presets */}
          {presetsDb.map((preset) => (
            <div
              key={preset.id}
              onClick={() => handleApplyPreset(preset.options)}
              className={`group p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer shadow-sm hover:-translate-y-0.5 flex flex-col justify-between ${
                preset.id.startsWith('custom-')
                  ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-300 dark:border-purple-400/40 hover:border-pink-400'
                  : 'bg-slate-50/80 dark:bg-slate-950/60 hover:bg-white dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-sky-400/50'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-1.5">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-pink-500 dark:group-hover:text-sky-300 mb-1 transition-colors break-words">
                    {preset.id.startsWith('custom-') ? `⭐ ${preset.name}` : preset.name}
                  </h4>
                  {preset.id.startsWith('custom-') && (
                    <button
                      type="button"
                      onClick={(e) => handleDeletePreset(e, preset.id)}
                      className="text-rose-500 hover:text-rose-600 p-1 hover:bg-rose-500/15 rounded-md transition-colors shrink-0"
                      title={t('delete') || 'Xóa'}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {preset.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categorized Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">

        {/* Time Cut Section Visual Controls */}
        <section className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-sky-200 dark:border-pink-500/20 shadow-light-glow dark:shadow-xl space-y-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
            <Clock size={18} className="text-sky-500" />
            <span>{t('downloadSectionsLabel')}</span>
          </h3>

          <div>
            <input
              type="text"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-pink-500"
              placeholder={t('downloadSectionsPlaceholder')}
              value={advancedOptions.downloadSections}
              onChange={(e) => handleChange('downloadSections', e.target.value)}
            />
          </div>
        </section>

        {/* Cookies & Geo-bypass */}
        <section className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-sky-200 dark:border-pink-500/20 shadow-light-glow dark:shadow-xl space-y-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
            <Cookie size={18} className="text-amber-500" />
            <span>{t('cookieBrowserLabel')}</span>
          </h3>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
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
                className={`py-2 px-1.5 rounded-xl text-xs font-semibold border transition-all text-center truncate cursor-pointer ${
                  advancedOptions.cookiesFromBrowser === b.id
                    ? 'bg-amber-500/20 border-amber-400 text-amber-600 dark:text-amber-300 shadow-sm scale-105 font-bold'
                    : 'bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>

          {advancedOptions.cookiesFromBrowser && advancedOptions.cookiesFromBrowser !== 'none' && (
            <div className="mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs leading-relaxed flex items-start gap-2.5 animate-fadeIn">
              <span className="shrink-0 text-base">⚠️</span>
              <div>
                <strong className="font-semibold block mb-0.5">{t('cookieNoticeTitle')}</strong>
                <span>{t('cookieNoticeDesc')}</span>
              </div>
            </div>
          )}
        </section>

        {/* Speed Limit & Rate */}
        <section className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-sky-200 dark:border-pink-500/20 shadow-light-glow dark:shadow-xl space-y-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
            <Zap size={18} className="text-emerald-500" />
            <span>{t('rateLimitLabel')}</span>
          </h3>

          <div>
            <input
              type="text"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-pink-500"
              placeholder={t('rateLimitPlaceholder')}
              value={advancedOptions.rateLimit}
              onChange={(e) => handleChange('rateLimit', e.target.value)}
            />
          </div>
        </section>

        {/* Custom Format Box */}
        <section className="md:col-span-2 p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-sky-200 dark:border-pink-500/20 shadow-light-glow dark:shadow-xl space-y-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
            <Code size={18} className="text-purple-500" />
            <span>{t('customFormatLabel')}</span>
          </h3>

          <input
            type="text"
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-pink-500"
            placeholder={t('customFormatPlaceholder')}
            value={advancedOptions.customFormat}
            onChange={(e) => handleChange('customFormat', e.target.value)}
          />
        </section>

        {/* Extra CLI Flags */}
        <section className="md:col-span-2 p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-sky-200 dark:border-pink-500/20 shadow-light-glow dark:shadow-xl space-y-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
            <FileCode size={18} className="text-cyan-500" />
            <span>{t('customArgsLabel')}</span>
          </h3>

          <input
            type="text"
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-pink-500"
            placeholder={t('customArgsPlaceholder')}
            value={advancedOptions.customArgs}
            onChange={(e) => handleChange('customArgs', e.target.value)}
          />
        </section>
      </div>

      {/* Save Preset Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in-up" onClick={() => setShowSaveModal(false)}>
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-pink-300 dark:border-pink-400/30 text-slate-800 dark:text-slate-100 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {t('savePresetModalTitle')}
            </h3>

            <input
              type="text"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-pink-500"
              placeholder={t('presetNamePlaceholder')}
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              autoFocus
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                onClick={() => setShowSaveModal(false)}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-400 via-cyan-400 to-pink-500 hover:from-sky-300 hover:to-pink-400 text-slate-950 font-extrabold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                onClick={handleSaveCustomPreset}
              >
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
