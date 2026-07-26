import React, { useState } from 'react';
import {
  Folder,
  HardDrive,
  Check,
  Move,
  Globe,
  Sun,
  Moon,
  Monitor,
  Palette,
  Info,
  ShieldCheck,
  Cpu,
  LogOut,
  Sliders,
  AlertTriangle,
  FileText,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Settings as SettingsIcon
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import Listbox from './Listbox';

export default function SettingsTab({ settings, updateSettings }) {
  const { t, language, setLanguage, LANGUAGES } = useTranslation();

  // Desktop active tab state
  const [activeSubTab, setActiveSubTab] = useState('appearance');

  // Mobile navigation stage state: null = Mobile Menu list stage, string = Detail section stage
  const [mobileSelectedSection, setMobileSelectedSection] = useState(null);

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

  // 5 Separated Modular Sections
  const subTabs = [
    {
      id: 'appearance',
      label: t('sectionAppearance'),
      desc: t('sectionAppearanceDesc'),
      icon: Palette,
      color: '#ec4899'
    },
    {
      id: 'storage',
      label: t('sectionStorage'),
      desc: t('sectionStorageDesc'),
      icon: Folder,
      color: '#8b5cf6'
    },
    {
      id: 'general',
      label: t('sectionGeneral'),
      desc: t('sectionGeneralDesc'),
      icon: SettingsIcon,
      color: '#3b82f6'
    },
    {
      id: 'about',
      label: t('aboutTitle'),
      desc: t('sectionAppearanceDesc'),
      icon: Info,
      color: '#10b981'
    },
    {
      id: 'disclaimer',
      label: t('disclaimerTitle'),
      desc: t('disclaimerText'),
      icon: AlertTriangle,
      color: '#f59e0b'
    }
  ];

  // Mobile Navigation Stage Handlers
  const handleOpenMobileSection = (id) => {
    setActiveSubTab(id);
    setMobileSelectedSection(id);
  };

  const handleBackToMobileMenu = () => {
    setMobileSelectedSection(null);
  };

  return (
    <div className="relative z-10 w-full max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 text-slate-800 dark:text-slate-100 font-sans select-none animate-fade-in-up">
      {/* ========================================================================= */}
      {/* MOBILE VIEW (Stage 0: Menu List vs Stage 1: Detail Section with Back button) */}
      {/* ========================================================================= */}
      <div className="block md:hidden">
        {/* STAGE 0: Mobile Hub Menu List */}
        {mobileSelectedSection === null ? (
          <div className="space-y-4 animate-fade-in-up">
            <div className="p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-sky-200 dark:border-pink-500/20 shadow-light-glow dark:shadow-xl space-y-1">
              <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <SettingsIcon size={18} className="text-purple-500" />
                <span>{t('settingsNavTitle')}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('settingsNavSubtitle')}
              </p>
            </div>

            {/* List of 5 Modular Settings Sections for Mobile */}
            <div className="space-y-2.5">
              {subTabs.map((tab) => {
                const IconComp = tab.icon;
                return (
                  <div
                    key={tab.id}
                    onClick={() => handleOpenMobileSection(tab.id)}
                    className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 hover:border-pink-400/50 shadow-sm active:scale-98 transition-all cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 text-left">
                      <div
                        className="p-2.5 rounded-2xl shrink-0"
                        style={{ backgroundColor: `${tab.color}15`, border: `1px solid ${tab.color}30` }}
                      >
                        <IconComp size={20} color={tab.color} />
                      </div>
                      <div className="min-w-0 text-left">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate text-left">
                          {tab.label}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 text-left">
                          {tab.desc}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-400 shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* STAGE 1: Mobile Detail Section View (With Top Navigation Back Bar) */
          <div className="space-y-4 animate-fade-in-up">
            {/* Top Navigation Back Bar */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-sky-200 dark:border-pink-500/20 shadow-md">
              <button
                type="button"
                onClick={handleBackToMobileMenu}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer"
              >
                <ArrowLeft size={15} />
                <span>{t('settingsBackToMenu')}</span>
              </button>

              <span className="text-xs font-extrabold text-pink-600 dark:text-pink-300">
                {subTabs.find((t) => t.id === mobileSelectedSection)?.label}
              </span>
            </div>

            {/* Render Selected Detail Content */}
            <DetailSectionContent
              sectionId={mobileSelectedSection}
              settings={settings}
              updateSettings={updateSettings}
              language={language}
              setLanguage={setLanguage}
              LANGUAGES={LANGUAGES}
              themeOptions={themeOptions}
              currentTheme={currentTheme}
              handleSelectDirectory={handleSelectDirectory}
              handleSave={handleSave}
              savedSuccess={savedSuccess}
              t={t}
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP VIEW (PC Layout: Side Vertical Tabs + Content Panel) */}
      {/* ========================================================================= */}
      <div className="hidden md:flex flex-row gap-6">
        {/* Desktop Vertical Sidebar Tabs */}
        <aside className="flex flex-col gap-2 w-64 shrink-0 p-3.5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-sky-200 dark:border-pink-500/20 shadow-light-glow dark:shadow-xl self-start">
          <div className="px-3 py-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {t('settingsNavCategory')}
          </div>

          {subTabs.map((tab) => {
            const IconComp = tab.icon;
            const isSelected = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${isSelected
                  ? 'bg-gradient-to-r from-sky-500/20 to-pink-500/20 border border-pink-400/60 text-pink-600 dark:text-pink-200 shadow-md scale-[1.02]'
                  : 'bg-slate-50/80 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 text-left">
                  <IconComp size={18} color={tab.color} className="shrink-0" />
                  <span className="break-words leading-tight text-left flex-1">{tab.label}</span>
                </div>
                <ChevronRight size={14} className={`shrink-0 ml-1 ${isSelected ? 'text-pink-500' : 'text-slate-400 opacity-50'}`} />
              </button>
            );
          })}
        </aside>

        {/* Desktop Main Content Panel */}
        <main className="flex-1 space-y-6">
          <DetailSectionContent
            sectionId={activeSubTab}
            settings={settings}
            updateSettings={updateSettings}
            language={language}
            setLanguage={setLanguage}
            LANGUAGES={LANGUAGES}
            themeOptions={themeOptions}
            currentTheme={currentTheme}
            handleSelectDirectory={handleSelectDirectory}
            handleSave={handleSave}
            savedSuccess={savedSuccess}
            t={t}
          />
        </main>
      </div>
    </div>
  );
}

// Helper Component rendering content for each individual separated section
function DetailSectionContent({
  sectionId,
  settings,
  updateSettings,
  language,
  setLanguage,
  LANGUAGES,
  themeOptions,
  currentTheme,
  handleSelectDirectory,
  handleSave,
  savedSuccess,
  t
}) {
  return (
    <section className="p-4 sm:p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-sky-200 dark:border-pink-500/20 shadow-light-glow dark:shadow-xl space-y-6 animate-fade-in-up">
      {/* SECTION 1: APPEARANCE & LANGUAGE */}
      {sectionId === 'appearance' && (
        <div className="space-y-6">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Palette size={20} className="text-pink-500" />
            <span>{t('sectionAppearance')}</span>
          </h2>

          {/* Language Selection */}
          <div className="space-y-2.5">
            <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Globe size={16} className="text-purple-400" />
              <span>{t('languageLabel')}</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {LANGUAGES.map((l) => {
                const isSelected = (settings.language || language) === l.code;
                return (
                  <div
                    key={l.code}
                    onClick={() => {
                      updateSettings({ language: l.code });
                      setLanguage(l.code);
                    }}
                    className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${isSelected
                      ? 'bg-purple-500/20 border-purple-400 text-purple-600 dark:text-purple-200 font-bold shadow-sm scale-105'
                      : 'bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                  >
                    <span className="text-lg">{l.flag}</span>
                    <span>{l.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Theme Mode Selection */}
          <div className="space-y-2.5 pt-4 border-t border-slate-200 dark:border-slate-800/80">
            <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Palette size={16} className="text-pink-500" />
              <span>{t('themeLabel')}</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {themeOptions.map((opt) => {
                const IconComp = opt.icon;
                const isSelected = currentTheme === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => updateSettings({ theme: opt.id })}
                    className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${isSelected
                      ? 'bg-purple-500/20 border-purple-400 text-purple-600 dark:text-purple-200 font-bold shadow-sm scale-105'
                      : 'bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                  >
                    <IconComp size={16} color={opt.color} />
                    <span>{opt.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: STORAGE & DOWNLOADS */}
      {sectionId === 'storage' && (
        <div className="space-y-6">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Folder size={20} className="text-purple-500" />
            <span>{t('sectionStorageTitle')}</span>
          </h2>

          {/* Directory Storage Path */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 block">
              {t('storageFolderLabel')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                value={settings.defaultPath || ''}
                placeholder={t('selectFolderPlaceholder')}
                readOnly
              />
              <button
                type="button"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer"
                onClick={handleSelectDirectory}
              >
                <Folder size={15} />
                <span>{t('changeFolderBtn')}</span>
              </button>
            </div>
          </div>

          {/* Drag Mode for Playlists */}
          <div className="space-y-2.5 pt-4 border-t border-slate-200 dark:border-slate-800/80">
            <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Move size={15} className="text-sky-500" />
              <span>{t('dragModeLabel')}</span>
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('dragModeDesc')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => updateSettings({ playlistDragMode: 'folder' })}
                className={`p-3.5 rounded-2xl border text-xs transition-all cursor-pointer ${(settings.playlistDragMode || 'folder') === 'folder'
                  ? 'bg-purple-500/20 border-purple-400 text-purple-600 dark:text-purple-200 shadow-sm font-bold'
                  : 'bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
              >
                <div className="font-bold mb-1">{t('dragModeFolder')}</div>
                <div className="text-[11px] opacity-75">{t('dragModeFolderDesc')}</div>
              </div>

              <div
                onClick={() => updateSettings({ playlistDragMode: 'files' })}
                className={`p-3.5 rounded-2xl border text-xs transition-all cursor-pointer ${settings.playlistDragMode === 'files'
                  ? 'bg-purple-500/20 border-purple-400 text-purple-600 dark:text-purple-200 shadow-sm font-bold'
                  : 'bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
              >
                <div className="font-bold mb-1">{t('dragModeFiles')}</div>
                <div className="text-[11px] opacity-75">{t('dragModeFilesDesc')}</div>
              </div>
            </div>
          </div>

          {/* Duplicate Media Handling Policy */}
          <div className="space-y-2.5 pt-4 border-t border-slate-200 dark:border-slate-800/80">
            <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Sliders size={15} className="text-pink-500" />
              <span>{t('duplicateActionLabel')}</span>
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('duplicateActionDesc')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                onClick={() => updateSettings({ duplicateAction: 'ask' })}
                className={`p-3.5 rounded-2xl border text-xs transition-all cursor-pointer ${(settings.duplicateAction || 'ask') === 'ask'
                  ? 'bg-purple-500/20 border-purple-400 text-purple-600 dark:text-purple-200 shadow-sm font-bold'
                  : 'bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
              >
                <div className="font-bold mb-1">{t('duplicateActionAsk')}</div>
                <div className="text-[11px] opacity-75">{t('duplicateActionAskDesc')}</div>
              </div>

              <div
                onClick={() => updateSettings({ duplicateAction: 'overwrite' })}
                className={`p-3.5 rounded-2xl border text-xs transition-all cursor-pointer ${settings.duplicateAction === 'overwrite'
                  ? 'bg-purple-500/20 border-purple-400 text-purple-600 dark:text-purple-200 shadow-sm font-bold'
                  : 'bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
              >
                <div className="font-bold mb-1">{t('duplicateActionOverwrite')}</div>
                <div className="text-[11px] opacity-75">{t('duplicateActionOverwriteDesc')}</div>
              </div>

              <div
                onClick={() => updateSettings({ duplicateAction: 'separate' })}
                className={`p-3.5 rounded-2xl border text-xs transition-all cursor-pointer ${settings.duplicateAction === 'separate'
                  ? 'bg-purple-500/20 border-purple-400 text-purple-600 dark:text-purple-200 shadow-sm font-bold'
                  : 'bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
              >
                <div className="font-bold mb-1">{t('duplicateActionSeparate')}</div>
                <div className="text-[11px] opacity-75">{t('duplicateActionSeparateDesc')}</div>
              </div>
            </div>
          </div>

          {/* Default Metadata Checkboxes */}
          <div className="space-y-2.5 pt-4 border-t border-slate-200 dark:border-slate-800/80">
            <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 block">
              {t('defaultMetadataLabel')}
            </label>

            <div className="space-y-2">
              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-pink-500 rounded"
                  checked={settings.embedMetadata}
                  onChange={(e) => updateSettings({ embedMetadata: e.target.checked })}
                />
                <span>{t('embedMetadataCheck')}</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-pink-500 rounded"
                  checked={settings.embedThumbnail}
                  onChange={(e) => updateSettings({ embedThumbnail: e.target.checked })}
                />
                <span>{t('embedThumbnailCheck')}</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: GENERAL PREFERENCES */}
      {sectionId === 'general' && (
        <div className="space-y-6">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
            <SettingsIcon size={20} className="text-sky-500" />
            <span>{t('sectionGeneralTitle')}</span>
          </h2>

          {/* Close Window Action */}
          <div className="space-y-2.5">
            <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <LogOut size={15} className="text-rose-500" />
              <span>{t('closeSettingLabel') || 'Khi đóng cửa sổ chính'}</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
                    className={`p-3 rounded-2xl border text-xs text-center font-semibold transition-all cursor-pointer ${isSelected
                      ? 'bg-purple-500/20 border-purple-400 text-purple-600 dark:text-purple-200 font-bold shadow-sm scale-105'
                      : 'bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                  >
                    {opt.name}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Max Concurrent Downloads */}
          <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800/80">
            <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 block">
              {t('maxConcurrentLabel')}
            </label>
            <Listbox
              className="w-full sm:w-64"
              value={settings.maxConcurrentDownloads || 2}
              onChange={(e) => updateSettings({ maxConcurrentDownloads: parseInt(e.target.value, 10) })}
            >
              <option value="1">{t('maxConcurrent1')}</option>
              <option value="2">{t('maxConcurrent2')}</option>
              <option value="3">{t('maxConcurrent3')}</option>
              <option value="5">{t('maxConcurrent5')}</option>
            </Listbox>
          </div>

          {/* Chrome Extension Settings */}
          <div className="space-y-2.5 pt-4 border-t border-slate-200 dark:border-slate-800/80">
            <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Globe size={16} className="text-emerald-500" />
              <span>{t('chromeExtIntegration')}</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
              <input
                type="checkbox"
                className="accent-pink-500 rounded"
                checked={settings.autoOpenMiniWindowOnExtension !== false}
                onChange={(e) => updateSettings({ autoOpenMiniWindowOnExtension: e.target.checked })}
              />
              <span>{t('autoMiniWindowLabel')}</span>
            </label>
          </div>
        </div>
      )}

      {/* SECTION 4: ABOUT / APP INFO */}
      {sectionId === 'about' && (
        <div className="space-y-6">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Info size={20} className="text-sky-500" />
            <span>{t('aboutTitle') || 'Giới thiệu về ứng dụng'}</span>
          </h2>

          {/* Logo & General Info Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <svg className="logo-icon w-12 h-12 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 3.88 12 3.88 12 3.88s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"
                fill="url(#about-logo-grad-sub-stage)"
              />
              <path d="M9.75 15.02l6-3.27-6-3.27v6.54z" fill="#ffffff" />
              <defs>
                <linearGradient id="about-logo-grad-sub-stage" x1="1" y1="11.75" x2="23" y2="11.75" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#ec4899" />
                  <stop offset="0.5" stopColor="#8b5cf6" />
                  <stop offset="1" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>

            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-base font-bold text-slate-800 dark:text-slate-100">{t('aboutAppName')}</span>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-pink-500/15 border border-pink-400/40 text-pink-600 dark:text-pink-300">
                  {t('aboutVersion')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('aboutDesc')}
              </p>
              <div className="text-xs text-slate-700 dark:text-slate-300 pt-1 flex items-center gap-4 flex-wrap">
                <span><strong>{t('authorLabel')}:</strong> Tabby Neko</span>
                <span><strong>{t('licenseLabel')}:</strong> ISC License</span>
              </div>
            </div>
          </div>

          {/* Tech Stack List */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Cpu size={15} className="text-purple-500" />
              <span>{t('aboutTech')}</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'electron', ver: '^31.0.0' },
                { name: 'react', ver: '^19.2.8' },
                { name: 'react-dom', ver: '^19.2.8' },
                { name: 'vite', ver: '^5.4.21' },
                { name: '@vitejs/plugin-react', ver: '^4.7.0' },
                { name: 'electron-builder', ver: '^26.15.3' },
                { name: 'lucide-react', ver: '^1.26.0' },
                { name: 'yt-dlp', ver: 'latest build' },
                { name: 'ffmpeg', ver: 'binary core' }
              ].map((dep) => (
                <span
                  key={dep.name}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-400/25 text-slate-800 dark:text-slate-200 flex items-center gap-2"
                >
                  <span className="text-purple-600 dark:text-purple-300 font-mono">{dep.name}</span>
                  <span className="text-[10px] text-slate-400">{dep.ver}</span>
                </span>
              ))}
            </div>
          </div>

          {/* License Details Footer Box */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3">
            <ShieldCheck size={20} className="text-emerald-500 shrink-0" />
            <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong className="text-slate-800 dark:text-slate-100">{t('aboutLicense')}: </strong>
              {t('aboutLicenseText')}
            </span>
          </div>
        </div>
      )}

      {/* SECTION 5: DISCLAIMER */}
      {sectionId === 'disclaimer' && (
        <div className="space-y-6">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
            <AlertTriangle size={20} className="text-amber-500" />
            <span>{t('disclaimerTitle') || 'Tuyên bố miễn trừ trách nhiệm'}</span>
          </h2>

          <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-amber-700 dark:text-amber-300">
                  {t('disclaimerPurposeTitle')}
                </h4>
                <p className="text-xs opacity-90">
                  {t('disclaimerPurposeDesc')}
                </p>
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-xs sm:text-sm">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span>{t('disclaimerLegalTitle')}</span>
              </h4>
              <ul className="list-disc list-inside space-y-2 text-xs text-slate-500 dark:text-slate-400 pl-1">
                <li>
                  <strong>{t('disclaimerLegalItem1Title')}</strong> {t('disclaimerLegalItem1Desc')}
                </li>
                <li>
                  <strong>{t('disclaimerLegalItem2Title')}</strong> {t('disclaimerLegalItem2Desc')}
                </li>
                <li>
                  <strong>{t('disclaimerLegalItem3Title')}</strong> {t('disclaimerLegalItem3Desc')}
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Global Save Button Row for Preferences */}
      {(sectionId === 'appearance' || sectionId === 'storage' || sectionId === 'general') && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center gap-3">
          <button
            type="button"
            className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-sky-400 via-cyan-400 to-pink-500 hover:from-sky-300 hover:to-pink-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            onClick={handleSave}
          >
            <Check size={16} />
            <span>{t('saveSettingsBtn')}</span>
          </button>

          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400 animate-fade-in-up">
              {t('settingsSavedSuccess')}
            </span>
          )}
        </div>
      )}
    </section>
  );
}
