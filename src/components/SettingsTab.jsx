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
  RefreshCw,
  Tag,
  Settings as SettingsIcon
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import Listbox from './Listbox';
import APP_ICON from '../assets/appIcon';
import NYANKO_GIFS, { getRandomNyankoGif } from '../assets/nyankoGifs';

export default function SettingsTab({ settings, updateSettings }) {
  const { t, language, setLanguage, LANGUAGES } = useTranslation();

  // Desktop active tab state
  const [activeSubTab, setActiveSubTab] = useState('appearance');

  // Mobile navigation stage state: null = Mobile Menu list stage, string = Detail section stage
  const [mobileSelectedSection, setMobileSelectedSection] = useState(null);

  // Nyanko GIF & Easter Egg state for About section
  const [currentNyankoGif, setCurrentNyankoGif] = useState(() => getRandomNyankoGif());
  const [easterEggCount, setEasterEggCount] = useState(0);

  const handleNextNyankoGif = () => {
    setCurrentNyankoGif(getRandomNyankoGif());
    setEasterEggCount(prev => prev + 1);
  };

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
      id: 'dependencies',
      label: t('sectionDependenciesTitle') || 'Trạng thái Dependency',
      desc: t('sectionDependenciesDesc') || 'Kiểm tra yt-dlp, ffmpeg & ffprobe',
      icon: Cpu,
      color: '#ec4899'
    },
    {
      id: 'updates',
      label: t('sectionUpdates'),
      desc: t('sectionUpdatesDesc'),
      icon: Sparkles,
      color: '#06b6d4'
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
              currentNyankoGif={currentNyankoGif}
              handleNextNyankoGif={handleNextNyankoGif}
              easterEggCount={easterEggCount}
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
                  ? 'bg-pink-500 text-white dark:bg-pink-500/20 dark:border-pink-400 dark:text-pink-300 font-extrabold shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
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
            currentNyankoGif={currentNyankoGif}
            handleNextNyankoGif={handleNextNyankoGif}
            easterEggCount={easterEggCount}
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
  currentNyankoGif,
  handleNextNyankoGif,
  easterEggCount,
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

      {/* SECTION 4: DEPENDENCY CHECK */}
      {sectionId === 'dependencies' && (
        <DependencyCheckSection t={t} />
      )}

      {/* SECTION 5: UPDATES CHANNEL */}
      {sectionId === 'updates' && (
        <UpdatesSection t={t} />
      )}

      {/* SECTION 5: ABOUT / APP INFO */}
      {sectionId === 'about' && (
        <div className="space-y-6">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Info size={20} className="text-sky-500" />
            <span>{t('aboutTitle') || 'Giới thiệu về ứng dụng'}</span>
          </h2>

          {/* Logo & General Info Card with Interactive Nyanko GIF & Website Link */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative group cursor-pointer shrink-0" onClick={handleNextNyankoGif} title="Bấm vào Nyanko để đổi GIF (Easter Egg!)">
              <img
                src={currentNyankoGif}
                alt="Nyanko Animation"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-2xl p-1 bg-white/80 dark:bg-slate-900/80 border-2 border-sky-400/40 shadow-lg group-hover:scale-105 active:scale-95 transition-all duration-200"
              />
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-sky-500 text-white text-[9px] font-extrabold shadow-sm">
                GIF
              </span>
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-base font-bold text-slate-800 dark:text-slate-100">{t('aboutAppName')}</span>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-pink-500/15 border border-pink-400/40 text-pink-600 dark:text-pink-300">
                  {t('aboutVersion')}
                </span>
                {easterEggCount > 0 && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-400/30 animate-pulse">
                    🐱 Easter Egg x{easterEggCount}!
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('aboutDesc')}
              </p>
              <div className="text-xs text-slate-700 dark:text-slate-300 pt-1 flex items-center gap-4 flex-wrap">
                <span><strong>{t('authorLabel')}:</strong> Tabby Neko</span>
                <span>
                  <strong>Website:</strong>{' '}
                  <a
                    href="https://tabbyneko.asia/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-pink-500 hover:text-pink-600 dark:text-pink-400 font-bold underline inline-flex items-center gap-1"
                    onClick={(e) => {
                      if (window.api && window.api.openExternal) {
                        e.preventDefault();
                        window.api.openExternal('https://tabbyneko.asia/');
                      }
                    }}
                  >
                    https://tabbyneko.asia/
                    <ExternalLink size={12} />
                  </a>
                </span>
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
            className="py-2.5 px-6 rounded-xl bg-pink-500 hover:bg-pink-600 dark:bg-pink-400 dark:hover:bg-pink-300 text-white dark:text-slate-950 font-extrabold text-xs sm:text-sm shadow-sm hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
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

// Component handling GitHub Releases Update Channel
function UpdatesSection({ t }) {
  const [loading, setLoading] = useState(false);
  const [latestRelease, setLatestRelease] = useState(null);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchLatestRelease = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('https://api.github.com/repos/tabbyneko2k4/yt-downloader-electron/releases/latest');
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(t('updateNoReleasesFound') || 'Chưa có bản phát hành (release) nào công khai trên GitHub.');
        }
        throw new Error(`HTTP Error ${res.status}`);
      }
      const data = await res.json();
      setLatestRelease(data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message || 'Không thể kết nối đến GitHub API');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchLatestRelease();
  }, []);

  const currentVersion = 'v1.2.0';
  const isNewerAvailable = latestRelease && latestRelease.tag_name && latestRelease.tag_name !== currentVersion;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 flex-wrap gap-2">
        <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
          <Sparkles size={20} className="text-cyan-500" />
          <span>{t('sectionUpdatesTitle') || 'Kênh Cập Nhật & GitHub Releases'}</span>
        </h2>
        <button
          type="button"
          onClick={fetchLatestRelease}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-cyan-500' : ''} />
          <span>{loading ? t('updateChecking') || 'Đang kiểm tra...' : t('updateCheckNow') || 'Kiểm tra ngay'}</span>
        </button>
      </div>

      {/* GitHub Channel Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-sky-500/10 to-purple-500/10 border border-cyan-500/30 flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-cyan-500" />
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
              GitHub Official Releases Channel
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-300">
              v1.2.0 (Current)
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {t('updateChannelDesc') || 'Tự động kiểm tra bản cập nhật mới nhất từ kho lưu trữ GitHub official.'}
          </p>
        </div>
        <a
          href="https://github.com/tabbyneko2k4/yt-downloader-electron/releases"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-slate-950 text-xs font-extrabold shadow-sm transition-all cursor-pointer"
          onClick={(e) => {
            if (window.api && window.api.openExternal) {
              e.preventDefault();
              window.api.openExternal('https://github.com/tabbyneko2k4/yt-downloader-electron/releases');
            }
          }}
        >
          <span>{t('updateOpenReleasesBtn') || 'Xem trên GitHub Releases'}</span>
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs space-y-1">
          <div className="font-bold flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{t('updateErrorTitle') || 'Không thể lấy thông tin bản phát hành'}</span>
          </div>
          <p className="opacity-90">{error}</p>
        </div>
      )}

      {/* Latest Release Details Card */}
      {latestRelease && (
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  {latestRelease.name || latestRelease.tag_name}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold">
                  {latestRelease.tag_name}
                </span>
                {isNewerAvailable ? (
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500 text-white animate-pulse">
                    🎉 Có bản mới!
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    ✓ Đã ở bản mới nhất
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {t('updatePublishedAt') || 'Ngày phát hành'}: {new Date(latestRelease.published_at).toLocaleDateString()} {lastChecked && `• ${t('updateLastChecked') || 'Đã kiểm tra lúc'}: ${lastChecked}`}
              </p>
            </div>

            <a
              href={latestRelease.html_url}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5"
              onClick={(e) => {
                if (window.api && window.api.openExternal) {
                  e.preventDefault();
                  window.api.openExternal(latestRelease.html_url);
                }
              }}
            >
              <span>{t('updateDownloadRelease') || 'Tải về bản phát hành này'}</span>
              <ExternalLink size={13} />
            </a>
          </div>

          {/* Release Notes */}
          {latestRelease.body && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {t('updateReleaseNotesTitle') || 'Ghi chú bản cập nhật (Release Notes):'}
              </span>
              <div className="p-3.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
                {latestRelease.body}
              </div>
            </div>
          )}

          {/* Assets list */}
          {latestRelease.assets && latestRelease.assets.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {t('updateAssetsTitle') || 'Tệp đính kèm (Assets & Installers):'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {latestRelease.assets.map((asset) => (
                  <a
                    key={asset.id}
                    href={asset.browser_download_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 hover:bg-pink-50 dark:hover:bg-pink-950/30 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between gap-2 transition-all"
                    onClick={(e) => {
                      if (window.api && window.api.openExternal) {
                        e.preventDefault();
                        window.api.openExternal(asset.browser_download_url);
                      }
                    }}
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {asset.name}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {(asset.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Sub-Component: Dependency Check Section
function DependencyCheckSection({ t }) {
  const [loading, setLoading] = useState(false);
  const [depInfo, setDepInfo] = useState(null);

  const checkStatus = async () => {
    setLoading(true);
    try {
      if (window.api && window.api.checkAppDependencies) {
        const info = await window.api.checkAppDependencies();
        setDepInfo(info);
      }
    } catch (e) {
      console.error('Failed to check dependencies:', e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 flex-wrap gap-2">
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <Cpu size={20} className="text-pink-500" />
            <span>Trạng thái Dependency & Đường dẫn Binary</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ưu tiên 1: PATH hệ thống → Ưu tiên 2: Thư mục bin sau khi cài đặt (Đối với bản Portable: ưu tiên thư mục bin)
          </p>
        </div>

        <button
          type="button"
          onClick={checkStatus}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Đang kiểm tra...' : 'Kiểm tra ngay'}</span>
        </button>
      </div>

      {depInfo?.isPortable && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-extrabold text-[10px]">PORTABLE MODE</span>
            <span>Ứng dụng đang chạy ở chế độ Portable (Thư mục di động)</span>
          </div>
          <span className="font-semibold text-[11px] opacity-80">Ưu tiên dependency trong thư mục bin</span>
        </div>
      )}

      {/* Dependency Status Cards */}
      <div className="space-y-3">
        {[
          { key: 'ytdlp', name: 'yt-dlp.exe', desc: 'Trình tải video & âm thanh cốt lõi' },
          { key: 'ffmpeg', name: 'ffmpeg.exe', desc: 'Bộ giải mã & ghép nối phương tiện' },
          { key: 'ffprobe', name: 'ffprobe.exe', desc: 'Trình phân tích thông số media' }
        ].map((dep) => {
          const item = depInfo ? depInfo[dep.key] : null;
          return (
            <div
              key={dep.key}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{dep.name}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">({dep.desc})</span>
                </div>

                {item?.found ? (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-600 dark:text-emerald-300 flex items-center gap-1">
                    <Check size={12} />
                    <span>Sẵn sàng ({item.type === 'system' ? 'System PATH' : (item.type === 'local' ? 'Thư mục Bin' : 'WinGet')})</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-400/40 text-rose-600 dark:text-rose-300 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    <span>Chưa tìm thấy</span>
                  </span>
                )}
              </div>

              {item?.found && item?.path && (
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 text-[11px] font-mono text-slate-600 dark:text-slate-300 break-all flex items-center justify-between gap-2">
                  <span>Đường dẫn: {item.path}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.api && window.api.openFolder) {
                        window.api.openFolder(item.path);
                      }
                    }}
                    className="text-pink-500 hover:text-pink-600 font-bold shrink-0 text-[10px] underline cursor-pointer"
                  >
                    Mở thư mục
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

