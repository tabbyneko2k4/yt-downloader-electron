import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Film,
  Music,
  Image as ImageIcon,
  Download,
  Play,
  AlertTriangle,
  Terminal,
  Clock,
  Clipboard,
  ArrowLeft,
  Globe,
  SlidersHorizontal,
  Scissors,
  Sliders,
  Volume2,
  Gauge,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  PauseCircle,
  Loader2,
  Sparkles,
  FileText,
  X,
  Zap,
  Layers,
  Cpu,
  Plus,
  Check,
  ListPlus,
  Subtitles
} from 'lucide-react';
import PlaylistInspector from './PlaylistInspector';
import Listbox from './Listbox';
import { detectFormatFromUrl, isAutoDetectableUrl, isPlaylistWithSingleVideoUrl, stripPlaylistParam } from '../utils/formatDetector';
import { useTranslation } from '../i18n/LanguageContext';
import { getResolutionOptions, getAudioQualityOptions, getSubtitleOptions, buildDownloadOptions } from '../utils/downloadHelper';
import PlaylistChoiceModal from './PlaylistChoiceModal';

export default function DownloaderTab({
  settings,
  advancedOptions,
  setAdvancedOptions,
  activeDownloads,
  startDownload,
  cancelDownload,
  openLogModal,
  goToAdvanced,
  mediaDraft,
  setMediaDraft
}) {
  const { t } = useTranslation();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const [playlistSelectedIndexes, setPlaylistSelectedIndexes] = useState([]);
  const [expandedActiveTasks, setExpandedActiveTasks] = useState({});
  const [detectedPlatform, setDetectedPlatform] = useState(null);

  // Search & Queue states
  const [activeTab, setActiveTab] = useState('url'); // 'url' | 'search'
  const [searchPlatform, setSearchPlatform] = useState('youtube'); // 'youtube' | 'soundcloud'
  const [pendingPlaylistUrl, setPendingPlaylistUrl] = useState(null);
  const [addedToQueueMap, setAddedToQueueMap] = useState({});
  const [batchAdded, setBatchAdded] = useState(false);
  const [showAdvancedInResult, setShowAdvancedInResult] = useState(false);
  const [optionsDb, setOptionsDb] = useState(null);

  useEffect(() => {
    if (window.api && window.api.loadOptionsDb) {
      window.api.loadOptionsDb().then((data) => {
        if (data) setOptionsDb(data);
      });
    }
  }, []);

  useEffect(() => {
    if (!window.api || !window.api.onSyncOptionsDb) return;
    const unsub = window.api.onSyncOptionsDb((data) => {
      if (data) setOptionsDb(data);
    });
    return () => unsub();
  }, []);

  // Extract draft properties
  const {
    url,
    mediaInfo,
    formatType,
    videoQuality,
    videoFps,
    videoContainer,
    audioQuality,
    audioSampleRate,
    gifFps,
    gifRes,
    gifSpeed,
    trimStart,
    trimEnd,
    playlistItems,
    writeThumbnail,
    writeDescription
  } = mediaDraft;

  // Helper draft state updater
  const updateDraft = (fields) => {
    setMediaDraft((prev) => ({
      ...prev,
      ...fields
    }));
  };

  // Auto-detect format from platform rule helper
  const applyAutoFormatRule = (targetUrl) => {
    if (!targetUrl) {
      setDetectedPlatform(null);
      return;
    }
    const detected = detectFormatFromUrl(targetUrl);
    if (detected.formatType) {
      updateDraft({ formatType: detected.formatType });
      setDetectedPlatform(detected);
    } else {
      setDetectedPlatform(null);
    }
  };

  // Sync selected indexes when mediaInfo is loaded
  useEffect(() => {
    if (mediaInfo && mediaInfo.isPlaylist && mediaInfo.info.entries) {
      const allIdx = mediaInfo.info.entries.map((_, i) => i + 1);
      setPlaylistSelectedIndexes(allIdx);
    }
  }, [mediaInfo]);

  // Handle URL change
  const handleUrlInputChange = (e) => {
    const val = e.target.value;
    updateDraft({ url: val });
    applyAutoFormatRule(val);
  };

  // Auto-paste clipboard
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const cleanText = text.trim();
        updateDraft({ url: cleanText });
        applyAutoFormatRule(cleanText);
      }
    } catch (e) {
      console.error('Failed to read clipboard:', e);
    }
  };

  // Analyze URL or Search Query handler
  const handleAnalyze = async (overrideUrl = null, overridePlatform = null, forceMode = null) => {
    const rawTarget = (overrideUrl !== null ? overrideUrl : url).trim();
    if (!rawTarget) return;

    if (!forceMode && isPlaylistWithSingleVideoUrl(rawTarget)) {
      setPendingPlaylistUrl(rawTarget);
      return;
    }

    let targetToAnalyze = rawTarget;
    if (forceMode === 'single') {
      targetToAnalyze = stripPlaylistParam(rawTarget);
      updateDraft({ url: targetToAnalyze });
      applyAutoFormatRule(targetToAnalyze);
    }

    const activePlat = overridePlatform || searchPlatform;
    const isDirectUrl = /^https?:\/\//i.test(targetToAnalyze);

    let queryToSend = targetToAnalyze;
    if (!isDirectUrl) {
      if (activePlat === 'soundcloud') {
        queryToSend = `scsearch20:${targetToAnalyze}`;
      } else {
        queryToSend = `ytsearch20:${targetToAnalyze}`;
      }
    }

    setIsAnalyzing(true);
    setAnalyzeError('');
    applyAutoFormatRule(targetToAnalyze);

    try {
      if (window.api && window.api.getVideoInfo) {
        const res = await window.api.getVideoInfo(queryToSend);
        if (res.success) {
          updateDraft({ mediaInfo: res });
          if (res.isPlaylist && res.info.entries && !res.isSearch) {
            const allIdx = res.info.entries.map((_, i) => i + 1);
            setPlaylistSelectedIndexes(allIdx);
          }
        } else {
          setAnalyzeError(t('downloadError'));
        }
      } else {
        // Fallback mockup for demo
        updateDraft({
          mediaInfo: {
            success: true,
            isPlaylist: true,
            isSearch: !isDirectUrl,
            searchQuery: rawTarget,
            searchPlatform: activePlat,
            info: {
              title: `Search: ${rawTarget}`,
              uploader: 'Media Engine',
              entriesCount: 2,
              entries: [
                {
                  title: 'Demo Track 1 - Lofi Chill Beats',
                  uploader: 'Lofi Girl',
                  duration: 215,
                  thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80',
                  url: 'https://www.youtube.com/watch?v=X4VbdwhkE10'
                },
                {
                  title: 'Demo Track 2 - Acoustic Guitar Chill',
                  uploader: 'Music Studio',
                  duration: 180,
                  thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
                  url: 'https://www.youtube.com/watch?v=9kzE8isXlQY'
                }
              ]
            }
          }
        });
      }
    } catch (err) {
      setAnalyzeError(t('errorAnalyzing'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePlaylistChoice = (choice) => {
    const rawUrl = pendingPlaylistUrl;
    setPendingPlaylistUrl(null);
    if (!rawUrl) return;
    handleAnalyze(rawUrl, null, choice);
  };

  // Add individual item from search results to Download Queue
  const handleAddToQueue = (item) => {
    if (!item || !item.url) return;
    const downloadData = buildDownloadOptions({
      url: item.url,
      formatType,
      videoQuality,
      audioQuality,
      destDir: settings.defaultPath,
      mediaInfo: { info: item },
      advancedOptions,
      mediaDraft: {
        ...mediaDraft,
        title: item.title,
        uploader: item.uploader,
        thumbnail: item.thumbnail,
        duration: item.duration,
        embedMetadata: settings.embedMetadata,
        embedThumbnail: settings.embedThumbnail
      }
    });

    startDownload(downloadData);
    setAddedToQueueMap((prev) => ({ ...prev, [item.url]: true }));
  };

  // Add all search results to Download Queue
  const handleAddAllToQueue = () => {
    if (!mediaInfo || !mediaInfo.info || !mediaInfo.info.entries) return;
    mediaInfo.info.entries.forEach((item) => {
      if (!addedToQueueMap[item.url]) {
        handleAddToQueue(item);
      }
    });
    setBatchAdded(true);
    setTimeout(() => setBatchAdded(false), 3000);
  };

  // Inspect single search result item in detail
  const handleInspectSingle = (item) => {
    if (!item || !item.url) return;
    updateDraft({ url: item.url, mediaInfo: null });
    handleAnalyze(item.url, 'auto');
  };

  const resetSearch = () => {
    updateDraft({ mediaInfo: null, url: '' });
    setAnalyzeError('');
    setDetectedPlatform(null);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartDownload = () => {
    if (!mediaInfo) return;

    const downloadData = buildDownloadOptions({
      url: url.trim(),
      formatType,
      videoQuality,
      audioQuality,
      destDir: settings.defaultPath,
      mediaInfo,
      playlistSelectedIndexes,
      advancedOptions,
      mediaDraft: {
        ...mediaDraft,
        embedMetadata: settings.embedMetadata,
        embedThumbnail: settings.embedThumbnail
      }
    });

    startDownload(downloadData);
    resetSearch();
  };

  const dustServices = [
    { name: 'YouTube 4K', color: '#fca5a5' },
    { name: 'TikTok No-WM', color: '#67e8f9' },
    { name: 'SoundCloud MP3', color: '#fcd34d' },
    { name: 'Facebook HD', color: '#93c5fd' },
    { name: 'Instagram Reels', color: '#fbcfe8' },
    { name: 'Twitter / X', color: '#7dd3fc' },
    { name: 'Bilibili 1080p', color: '#f472b6' },
    { name: 'Vimeo Pro', color: '#38bdf8' },
    { name: 'Twitch Clips', color: '#c084fc' },
    { name: 'Douyin 60fps', color: '#34d399' },
    { name: 'Dailymotion', color: '#a7f3d0' },
    { name: 'Pinterest HD', color: '#f87171' },
    { name: 'Spotify Audio', color: '#4ade80' },
    { name: 'Rumble', color: '#facc15' },
    { name: 'Streamable', color: '#60a5fa' },
    { name: 'Bandcamp FLAC', color: '#818cf8' },
    { name: 'Reddit Media', color: '#fb923c' },
    { name: 'Threads', color: '#e879f9' }
  ];

  const dustParticles = useMemo(() => {
    return dustServices.map((service, i) => {
      const top = 4 + ((i * 4.8) % 90);
      const duration = 20 + (i % 8) * 4;
      const delay = -((i * 4.3) % 25);
      const opacity = 0.25 + ((i % 5) * 0.05);

      return {
        id: i,
        name: service.name,
        color: service.color,
        style: {
          top: `${top}%`,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          color: service.color,
          opacity: opacity
        }
      };
    });
  }, []);

  const getSearchPlaceholder = () => {
    if (searchPlatform === 'youtube') return t('searchYoutubePlaceholder');
    if (searchPlatform === 'soundcloud') return t('searchSoundcloudPlaceholder');
    return t('urlPlaceholder');
  };

  return (
    <div className="relative min-h-full w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 text-slate-800 dark:text-slate-100 font-sans select-none transition-colors duration-300">
      {/* Floating Service Dust Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {dustParticles.map((p) => (
          <span
            key={p.id}
            className="dust-particle-item absolute flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md bg-white/70 dark:bg-pink-500/10 border border-sky-300/50 dark:border-pink-500/20 shadow-sm transition-opacity duration-500 animate-float"
            style={p.style}
          >
            <Globe size={11} className="opacity-70" />
            {p.name}
          </span>
        ))}
      </div>

      {/* Centered Search Hero Container */}
      {!mediaInfo && (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[68vh] py-8 sm:py-12 px-2 sm:px-4 text-center animate-fade-in-up">
          {/* Main App Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-pink-500 via-purple-400 to-sky-500 bg-clip-text text-transparent drop-shadow-sm">
            {t('appName')}
          </h1>

          {/* Quick Search Mode Switcher Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6">
            <button
              type="button"
              className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 border ${
                searchPlatform === 'youtube'
                  ? 'bg-pink-500/20 border-pink-500 text-pink-600 dark:text-pink-300 shadow-md shadow-pink-500/25 scale-105'
                  : 'bg-white/80 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 shadow-sm'
              }`}
              onClick={() => setSearchPlatform('youtube')}
              title={t('searchYoutubeMode')}
            >
              <Film size={14} className={searchPlatform === 'youtube' ? 'text-pink-500 dark:text-pink-300' : 'text-slate-400'} />
              <span>YouTube Search</span>
            </button>

            <button
              type="button"
              className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 border ${
                searchPlatform === 'soundcloud'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-300 shadow-md shadow-amber-500/25 scale-105'
                  : 'bg-white/80 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 shadow-sm'
              }`}
              onClick={() => {
                setSearchPlatform('soundcloud');
                updateDraft({ formatType: 'audio' });
              }}
              title={t('searchSoundcloudMode')}
            >
              <Music size={14} className={searchPlatform === 'soundcloud' ? 'text-amber-500 dark:text-amber-300' : 'text-slate-400'} />
              <span>SoundCloud Search</span>
            </button>

            <button
              type="button"
              className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 border ${
                searchPlatform === 'auto'
                  ? 'bg-sky-500/20 border-sky-500 text-sky-600 dark:text-sky-300 shadow-md shadow-sky-500/25 scale-105'
                  : 'bg-white/80 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 shadow-sm'
              }`}
              onClick={() => setSearchPlatform('auto')}
              title={t('pasteUrlMode')}
            >
              <Globe size={14} className={searchPlatform === 'auto' ? 'text-sky-500 dark:text-sky-300' : 'text-slate-400'} />
              <span>{t('pasteUrlLabel')}</span>
            </button>
          </div>

          {/* Search Bar Input Container */}
          <div className="w-full max-w-2xl relative flex items-center gap-2 p-2 sm:p-2.5 rounded-2xl sm:rounded-full bg-white/90 dark:bg-slate-950/80 backdrop-blur-xl border border-sky-300 dark:border-pink-500/30 shadow-light-glow dark:shadow-pink-500/10 focus-within:border-pink-500 focus-within:ring-2 focus-within:ring-pink-400/30 transition-all duration-300">
            <Search className="text-sky-500 dark:text-pink-400 ml-3 shrink-0" size={20} />
            <input
              type="text"
              className="flex-1 bg-transparent px-2 py-2 text-sm sm:text-base text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none w-full"
              placeholder={getSearchPlaceholder()}
              value={url}
              onChange={handleUrlInputChange}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              autoFocus
            />

            {url && (
              <button
                type="button"
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-colors cursor-pointer"
                onClick={() => updateDraft({ url: '' })}
                title={t('clearLinkTitle')}
              >
                <X size={16} />
              </button>
            )}

            <button
              type="button"
              className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-sky-600 dark:text-sky-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              onClick={handlePasteClipboard}
              title={t('pasteClipboard')}
            >
              <Clipboard size={16} />
            </button>

            <button
              type="button"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-sky-400 via-cyan-400 to-pink-500 hover:from-sky-300 hover:to-pink-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-md shadow-sky-500/20 active:scale-95 transition-all duration-200 shrink-0 cursor-pointer"
              onClick={() => handleAnalyze()}
              disabled={isAnalyzing || !url.trim()}
            >
              {isAnalyzing ? (
                <>
                  <Clock size={16} className="animate-spin text-slate-950" />
                  <span>{t('analyzing')}</span>
                </>
              ) : (
                <>
                  <Search size={16} className="text-slate-950" />
                  <span>{searchPlatform !== 'auto' && !url.trim().startsWith('http') ? t('searchBtn') : t('analyzeBtn')}</span>
                </>
              )}
            </button>
          </div>

          {/* Auto-detected Platform Badge */}
          {detectedPlatform && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/15 border border-purple-400/40 text-purple-600 dark:text-purple-300 text-xs font-semibold backdrop-blur-sm animate-fade-in-up">
              <Sparkles size={14} className="text-purple-500 dark:text-purple-400" />
              <span>{t('detectedPlatform', { platform: detectedPlatform.platformName })}</span>
            </div>
          )}

          {/* Analyzing Shimmer Card */}
          {isAnalyzing && (
            <div className="w-full max-w-2xl mt-6 p-4 rounded-2xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-md border border-purple-300 dark:border-purple-500/30 shadow-lg animate-pulse">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-300 text-xs sm:text-sm font-semibold">
                  <Loader2 size={16} className="animate-spin text-purple-500 dark:text-purple-400" />
                  <span>
                    {searchPlatform !== 'auto' && !url.trim().startsWith('http')
                      ? t('searchingOn', { platform: searchPlatform === 'soundcloud' ? 'SoundCloud' : 'YouTube' })
                      : t('analyzing')}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">yt-dlp engine</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-sky-400 via-pink-400 to-purple-400 animate-pulse" />
              </div>
            </div>
          )}

          {/* Analyze Error Banner */}
          {analyzeError && (
            <div className="w-full max-w-2xl mt-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-400/40 text-rose-600 dark:text-rose-300 text-xs sm:text-sm flex items-center justify-center gap-2 font-medium">
              <AlertTriangle size={16} className="text-rose-500 shrink-0" />
              <span>{analyzeError}</span>
            </div>
          )}
        </div>
      )}

      {/* Result View State */}
      {mediaInfo && (
        (mediaInfo.isSearch || (mediaInfo.isPlaylist && mediaInfo.searchPlatform)) ? (
          /* SEARCH RESULTS GRID VIEW */
          <div className="relative z-10 space-y-6 animate-fade-in-up">
            {/* Header & Control Toolbar */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-sky-200 dark:border-pink-500/20 shadow-light-glow dark:shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={resetSearch}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>{t('backBtn')}</span>
                  </button>

                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      {mediaInfo.searchPlatform === 'soundcloud' ? (
                        <>
                          <Music size={18} className="text-amber-500" />
                          <span>{t('searchResultsSoundcloud')}</span>
                        </>
                      ) : (
                        <>
                          <Film size={18} className="text-rose-500" />
                          <span>{t('searchResultsYoutube')}</span>
                        </>
                      )}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t('searchKeyword', { query: mediaInfo.searchQuery || url, count: mediaInfo.info.entries?.length || 0 })}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddAllToQueue}
                  disabled={!mediaInfo.info.entries || mediaInfo.info.entries.length === 0}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 via-cyan-400 to-pink-500 hover:from-sky-300 hover:to-pink-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  {batchAdded ? <Check size={16} /> : <ListPlus size={16} />}
                  <span>{batchAdded ? t('addedAllToQueue') : t('addAllToQueue', { count: mediaInfo.info.entries?.length || 0 })}</span>
                </button>
              </div>

              {/* Format selection toolbar for search results */}
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-200 dark:border-slate-800/80">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('formatWhenAdd')}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateDraft({ formatType: 'video' })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      formatType === 'video'
                        ? 'bg-purple-500/20 border-purple-400 text-purple-600 dark:text-purple-200 shadow-sm font-bold'
                        : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Film size={13} />
                    <span>Video (MP4)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateDraft({ formatType: 'audio' })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      formatType === 'audio'
                        ? 'bg-purple-500/20 border-purple-400 text-purple-600 dark:text-purple-200 shadow-sm font-bold'
                        : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Music size={13} />
                    <span>Audio (MP3/M4A)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Results Grid Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {mediaInfo.info.entries && mediaInfo.info.entries.map((item, idx) => {
                const isAdded = !!addedToQueueMap[item.url];
                return (
                  <div
                    key={item.url || idx}
                    className="group flex flex-col justify-between rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 hover:border-pink-400/50 shadow-md hover:shadow-xl hover:shadow-pink-500/10 hover:-translate-y-1 backdrop-blur-md transition-all duration-300 overflow-hidden"
                  >
                    {/* Thumbnail Section */}
                    <div className="relative w-full aspect-video overflow-hidden bg-slate-950">
                      <img
                        src={item.thumbnail || 'https://via.placeholder.com/400x225?text=No+Thumbnail'}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/85 text-[11px] font-semibold text-slate-200 backdrop-blur-md border border-slate-700/50">
                        {mediaInfo.searchPlatform === 'soundcloud' ? <Music size={11} className="text-amber-400" /> : <Film size={11} className="text-rose-400" />}
                        <span>{mediaInfo.searchPlatform === 'soundcloud' ? 'SoundCloud' : 'YouTube'}</span>
                      </div>
                      {item.duration && (
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/90 text-[11px] font-bold text-slate-200 backdrop-blur-md border border-slate-800">
                          {formatDuration(item.duration)}
                        </div>
                      )}
                    </div>

                    {/* Meta & Content Section */}
                    <div className="p-3.5 flex flex-col justify-between flex-1 gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-pink-500 dark:group-hover:text-sky-300 transition-colors" title={item.title}>
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                          <Sparkles size={12} className="text-pink-500 shrink-0" />
                          <span className="truncate">{item.uploader || 'N/A'}</span>
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-800/60">
                        <button
                          type="button"
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                            isAdded
                              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 cursor-default'
                              : 'bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/40 text-sky-600 dark:text-sky-300 hover:text-sky-700 dark:hover:text-sky-200 cursor-pointer active:scale-95'
                          }`}
                          onClick={() => handleAddToQueue(item)}
                          disabled={isAdded}
                        >
                          {isAdded ? (
                            <>
                              <Check size={15} />
                              <span>{t('addedToQueue')}</span>
                            </>
                          ) : (
                            <>
                              <Plus size={15} />
                              <span>{t('addToQueue')}</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-pink-500 border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer"
                          onClick={() => handleInspectSingle(item)}
                          title={t('inspectTitle')}
                        >
                          <SlidersHorizontal size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* SINGLE MEDIA OR PLAYLIST INSPECTOR DETAIL VIEW */
          <div className="relative z-10 space-y-4 animate-fade-in-up">
            {/* Top Toolbar Navigation */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-sky-200 dark:border-pink-500/20 shadow-md">
              <button
                type="button"
                onClick={resetSearch}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>{t('backBtn')}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToAdvanced}
                  className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/30 text-purple-600 dark:text-purple-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <SlidersHorizontal size={14} />
                  <span>{t('navAdvanced')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartDownload}
                  disabled={mediaInfo.isPlaylist && playlistSelectedIndexes.length === 0}
                  className="flex sm:hidden items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-400 to-pink-500 text-slate-950 font-extrabold text-xs shadow-md disabled:opacity-50 active:scale-95"
                >
                  <Check size={16} />
                  <span>OK ({mediaInfo.isPlaylist ? playlistSelectedIndexes.length : t('downloadNow')})</span>
                </button>
              </div>
            </div>

            {/* Main Media Detail Card (2 Column Grid) */}
            <section className="p-4 sm:p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-sky-200 dark:border-pink-500/20 shadow-light-glow dark:shadow-2xl space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Media Thumbnail & Info Meta */}
                <div className="lg:col-span-5 flex flex-col gap-3">
                  <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-md">
                    <img
                      src={mediaInfo.info.thumbnail || 'https://via.placeholder.com/400x225?text=No+Thumbnail'}
                      alt="Thumbnail"
                      className="w-full h-44 sm:h-52 object-cover block"
                    />
                    {mediaInfo.info.duration && (
                      <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-md bg-slate-950/85 text-xs font-bold text-slate-100 backdrop-blur-md border border-slate-800">
                        {formatDuration(mediaInfo.info.duration)}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">
                      {mediaInfo.info.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                      <Sparkles size={13} className="text-purple-500 dark:text-purple-400 shrink-0" />
                      <span>{mediaInfo.info.uploader || t('webMedia')}</span>
                    </p>
                  </div>

                  {mediaInfo.isPlaylist && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-400/30 text-purple-600 dark:text-purple-300 text-xs font-semibold">
                      <Layers size={14} className="text-purple-500 dark:text-purple-400" />
                      <span>
                        {t('playlistTitle')} ({t('playlistItemCount', { count: mediaInfo.info.entriesCount || mediaInfo.info.entries?.length || 0 })})
                      </span>
                    </div>
                  )}
                </div>

                {/* Right Column: Download Configuration & Options */}
                <div className="lg:col-span-7 flex flex-col justify-between gap-5">
                  <div className="space-y-4">
                    {/* Header & Mobile Format Selector */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
                        {t('formatHeader')}
                      </h3>
                      {detectedPlatform && (
                        <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-300 bg-purple-500/15 border border-purple-400/30 px-2.5 py-1 rounded-md">
                          {detectedPlatform.platformName}
                        </span>
                      )}
                    </div>

                    {/* Mobile Select */}
                    <div className="block sm:hidden">
                      <Listbox
                        className="w-full"
                        value={formatType}
                        onChange={(e) => updateDraft({ formatType: e.target.value })}
                      >
                        <option value="video">🎬 {t('formatVideo')}</option>
                        <option value="audio">🎵 {t('formatAudio')}</option>
                        <option value="gif">🖼️ {t('formatGif')}</option>
                        <option value="thumbnail">📷 {t('formatThumbnail')}</option>
                      </Listbox>
                    </div>

                    {/* Desktop Format Cards Toggle */}
                    <div className="hidden sm:grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <button
                        type="button"
                        onClick={() => updateDraft({ formatType: 'video' })}
                        className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                          formatType === 'video'
                            ? 'bg-gradient-to-br from-sky-500/20 to-pink-500/20 border-pink-400 text-pink-600 dark:text-pink-200 shadow-md shadow-pink-500/15 scale-105'
                            : 'bg-slate-100/90 dark:bg-slate-950/60 hover:bg-slate-200 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <Film size={20} className={formatType === 'video' ? 'text-pink-500 dark:text-pink-300' : 'text-slate-400'} />
                        <span>{t('formatVideo')} (MP4)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateDraft({ formatType: 'audio' })}
                        className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                          formatType === 'audio'
                            ? 'bg-gradient-to-br from-sky-500/20 to-pink-500/20 border-pink-400 text-pink-600 dark:text-pink-200 shadow-md shadow-pink-500/15 scale-105'
                            : 'bg-slate-100/90 dark:bg-slate-950/60 hover:bg-slate-200 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <Music size={20} className={formatType === 'audio' ? 'text-pink-500 dark:text-pink-300' : 'text-slate-400'} />
                        <span>{t('formatAudio')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateDraft({ formatType: 'gif' })}
                        className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                          formatType === 'gif'
                            ? 'bg-gradient-to-br from-sky-500/20 to-pink-500/20 border-pink-400 text-pink-600 dark:text-pink-200 shadow-md shadow-pink-500/15 scale-105'
                            : 'bg-slate-100/90 dark:bg-slate-950/60 hover:bg-slate-200 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <ImageIcon size={20} className={formatType === 'gif' ? 'text-pink-500 dark:text-pink-300' : 'text-slate-400'} />
                        <span>{t('formatGif')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateDraft({ formatType: 'thumbnail' })}
                        className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                          formatType === 'thumbnail'
                            ? 'bg-gradient-to-br from-sky-500/20 to-pink-500/20 border-pink-400 text-pink-600 dark:text-pink-200 shadow-md shadow-pink-500/15 scale-105'
                            : 'bg-slate-100/90 dark:bg-slate-950/60 hover:bg-slate-200 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <ImageIcon size={20} className={formatType === 'thumbnail' ? 'text-purple-500 dark:text-purple-300' : 'text-slate-400'} />
                        <span>{t('formatThumbnail')}</span>
                      </button>
                    </div>

                    {/* Dynamic Format Specific Tuning Options */}
                    <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md space-y-3">
                      {/* Thumbnail mode info */}
                      {formatType === 'thumbnail' && (
                        <div className="flex flex-col gap-1 text-xs">
                          <span className="text-purple-600 dark:text-purple-300 font-semibold flex items-center gap-2">
                            <ImageIcon size={16} className="text-purple-500 dark:text-purple-400" />
                            {t('formatThumbnail')}
                          </span>
                          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                            {t('writeThumbnailOpt')}
                          </p>
                        </div>
                      )}

                      {/* Video options */}
                      {formatType === 'video' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1 font-medium">
                                {t('qualityLabel')}
                              </label>
                              <Listbox
                                className="w-full"
                                value={videoQuality}
                                onChange={(e) => updateDraft({ videoQuality: e.target.value })}
                                options={getResolutionOptions(mediaInfo)}
                              />
                            </div>

                            <div>
                              <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1 font-medium">
                                {t('fpsLabel')}
                              </label>
                              <Listbox
                                className="w-full"
                                value={videoFps}
                                onChange={(e) => updateDraft({ videoFps: e.target.value })}
                              >
                                <option value="auto">{t('fpsAuto')}</option>
                                <option value="60">{t('fps60')}</option>
                                <option value="30">{t('fps30')}</option>
                                <option value="24">24 FPS</option>
                              </Listbox>
                            </div>
                          </div>

                          <div>
                            <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1.5 font-medium">
                              {t('containerLabel')}
                            </label>
                            <div className="flex gap-2">
                              {[
                                { id: 'mp4', name: t('containerMp4') },
                                { id: 'mkv', name: t('containerMkv') },
                                { id: 'webm', name: t('containerWebm') }
                              ].map((c) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => updateDraft({ videoContainer: c.id })}
                                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                    videoContainer === c.id
                                      ? 'bg-purple-500/20 border-purple-400 text-purple-600 dark:text-purple-200 font-bold'
                                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                  }`}
                                >
                                  {c.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Audio options */}
                      {formatType === 'audio' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1 font-medium">
                              {t('audioQualityLabel')}
                            </label>
                            <Listbox
                              className="w-full"
                              value={audioQuality}
                              onChange={(e) => updateDraft({ audioQuality: e.target.value })}
                              options={getAudioQualityOptions()}
                            />
                          </div>

                          <div>
                            <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1 font-medium">
                              {t('audioSampleRateLabel')}
                            </label>
                            <Listbox
                              className="w-full"
                              value={audioSampleRate}
                              onChange={(e) => updateDraft({ audioSampleRate: e.target.value })}
                            >
                              <option value="auto">{t('sampleRateAuto')}</option>
                              <option value="48000">{t('sampleRate48k')}</option>
                              <option value="44100">{t('sampleRate44k')}</option>
                            </Listbox>
                          </div>
                        </div>
                      )}

                      {/* GIF options */}
                      {formatType === 'gif' && (
                        <div className="grid grid-cols-3 gap-2.5">
                          <div>
                            <label className="text-[11px] text-purple-600 dark:text-purple-300 block mb-1 font-medium">
                              {t('gifFpsLabel')}
                            </label>
                            <Listbox
                              className="w-full"
                              value={gifFps}
                              onChange={(e) => updateDraft({ gifFps: e.target.value })}
                            >
                              <option value="10">10 FPS</option>
                              <option value="15">15 FPS</option>
                              <option value="20">20 FPS</option>
                              <option value="30">30 FPS</option>
                            </Listbox>
                          </div>

                          <div>
                            <label className="text-[11px] text-purple-600 dark:text-purple-300 block mb-1 font-medium">
                              {t('gifResLabel')}
                            </label>
                            <Listbox
                              className="w-full"
                              value={gifRes}
                              onChange={(e) => updateDraft({ gifRes: e.target.value })}
                            >
                              <option value="480p">480p</option>
                              <option value="360p">360p</option>
                              <option value="240p">240p</option>
                            </Listbox>
                          </div>

                          <div>
                            <label className="text-[11px] text-purple-600 dark:text-purple-300 block mb-1 font-medium">
                              {t('gifSpeedLabel')}
                            </label>
                            <Listbox
                              className="w-full"
                              value={gifSpeed}
                              onChange={(e) => updateDraft({ gifSpeed: e.target.value })}
                            >
                              <option value="1.0">1.0x</option>
                              <option value="1.25">1.25x</option>
                              <option value="1.5">1.5x</option>
                              <option value="2.0">2.0x</option>
                              <option value="0.5">0.5x</option>
                            </Listbox>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Advanced Collapsible Options */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowAdvancedInResult(!showAdvancedInResult)}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-100/90 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-purple-600 dark:text-purple-300 text-xs font-semibold transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <SlidersHorizontal size={15} />
                          <span>{t('advancedCollapse')}</span>
                        </div>
                        {showAdvancedInResult ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>

                      {showAdvancedInResult && (
                        <div className="mt-2.5 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md space-y-4 animate-fade-in-up">
                          {/* Subtitles Visual Controls & Multi-Select Language Selector */}
                          <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-pink-200 dark:border-pink-500/20 space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <Subtitles size={15} className="text-pink-500" />
                                <span>{t('subtitlesSection')}</span>
                              </label>
                              {((mediaInfo?.info?.subtitles && mediaInfo.info.subtitles.length > 0) || (mediaInfo?.info?.automatic_captions && mediaInfo.info.automatic_captions.length > 0)) && (
                                <span className="text-[10px] font-semibold text-pink-600 dark:text-pink-300 bg-pink-500/15 border border-pink-400/30 px-2 py-0.5 rounded-full">
                                  {t('subtitleDetected', { count: (mediaInfo.info.subtitles?.length || 0) + (mediaInfo.info.automatic_captions?.length || 0) })}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer font-medium">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                                  checked={!!advancedOptions.writeSubs}
                                  onChange={(e) => {
                                    if (setAdvancedOptions) {
                                      setAdvancedOptions((prev) => ({ ...prev, writeSubs: e.target.checked }));
                                    }
                                  }}
                                />
                                <span>{t('writeSubs')}</span>
                              </label>

                              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer font-medium">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                                  checked={!!advancedOptions.embedSubs}
                                  onChange={(e) => {
                                    if (setAdvancedOptions) {
                                      setAdvancedOptions((prev) => ({ ...prev, embedSubs: e.target.checked }));
                                    }
                                  }}
                                />
                                <span>{t('embedSubs')}</span>
                              </label>
                            </div>

                            {/* Multi-Select Subtitle Language Combobox */}
                            <div className="pt-1">
                              <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1.5 font-medium">
                              {t('subLangsLabel')} {t('subLangMultiSelect')}
                              </label>
                              <Listbox
                                multiple
                                className="w-full"
                                value={advancedOptions.subLangs || 'vi,en'}
                                onChange={(e, newValues, joinedStr) => {
                                  if (setAdvancedOptions) {
                                    setAdvancedOptions((prev) => ({
                                      ...prev,
                                      subLangs: typeof e.target.value === 'string' ? e.target.value : joinedStr
                                    }));
                                  }
                                }}
                                options={getSubtitleOptions(mediaInfo)}
                                placeholder={t('subLangPlaceholder')}
                              />
                            </div>
                          </div>

                          {/* Asset Extraction Checkboxes */}
                          <div>
                            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-2">
                              <Sliders size={14} className="text-emerald-500 dark:text-emerald-400" />
                              <span>{t('metadataOptions')}</span>
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer font-medium">
                                <input
                                  type="checkbox"
                                  className="accent-pink-500 rounded"
                                  checked={!!writeThumbnail}
                                  onChange={(e) => updateDraft({ writeThumbnail: e.target.checked })}
                                />
                                <span>{t('writeThumbnailOpt')}</span>
                              </label>

                              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer font-medium">
                                <input
                                  type="checkbox"
                                  className="accent-pink-500 rounded"
                                  checked={!!writeDescription}
                                  onChange={(e) => updateDraft({ writeDescription: e.target.checked })}
                                />
                                <span>{t('writeDescriptionOpt')}</span>
                              </label>
                            </div>
                          </div>

                          {/* Trim Video Section */}
                          {formatType !== 'thumbnail' && (
                            <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80">
                              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-2">
                                <Scissors size={14} className="text-sky-500 dark:text-sky-400" />
                                <span>{t('trimLabel')}</span>
                              </label>
                              <div className="grid grid-cols-2 gap-3">
                                <input
                                  type="text"
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-pink-500"
                                  placeholder={t('trimStart')}
                                  value={trimStart}
                                  onChange={(e) => updateDraft({ trimStart: e.target.value })}
                                />
                                <input
                                  type="text"
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-pink-500"
                                  placeholder={t('trimEnd')}
                                  value={trimEnd}
                                  onChange={(e) => updateDraft({ trimEnd: e.target.value })}
                                />
                              </div>
                            </div>
                          )}

                          {(advancedOptions.writeSubs || advancedOptions.downloadSections || advancedOptions.cookiesFromBrowser !== 'none' || advancedOptions.customArgs) && (
                            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-400/20 text-[11px] text-purple-600 dark:text-purple-300 flex items-center gap-2 font-medium">
                              <Terminal size={14} className="shrink-0" />
                              <span>{t('cliOptionsActive')}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Playlist Inspector */}
                    {mediaInfo.isPlaylist && mediaInfo.info.entries && mediaInfo.info.entries.length > 0 && (
                      <PlaylistInspector
                        entries={mediaInfo.info.entries}
                        selectedIndexes={playlistSelectedIndexes}
                        setSelectedIndexes={setPlaylistSelectedIndexes}
                      />
                    )}
                  </div>

                  {/* Start Download CTA Button */}
                  <div className="pt-4">
                    <button
                      type="button"
                      className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-400 via-cyan-400 to-pink-500 hover:from-sky-300 hover:to-pink-400 text-slate-950 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-pink-500/25 active:scale-95 transition-all duration-300 cursor-pointer"
                      onClick={handleStartDownload}
                      disabled={mediaInfo.isPlaylist && playlistSelectedIndexes.length === 0}
                    >
                      <Download size={18} className="text-slate-950 shrink-0" />
                      <span>
                        {mediaInfo.isPlaylist
                          ? t('downloadPlaylist', { count: playlistSelectedIndexes.length })
                          : t('startDownload')}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )
      )}

      {/* Playlist & Single Video Choice Modal */}
      {pendingPlaylistUrl && (
        <PlaylistChoiceModal
          rawUrl={pendingPlaylistUrl}
          onChoose={handlePlaylistChoice}
          onClose={() => handlePlaylistChoice('single')}
        />
      )}
    </div>
  );
}
