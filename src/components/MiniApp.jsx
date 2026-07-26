import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Link,
  Film,
  Music,
  Image as ImageIcon,
  Download,
  Clipboard,
  X,
  ExternalLink,
  Folder,
  Copy,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  SlidersHorizontal,
  Maximize2,
  ListPlus,
  CheckSquare,
  Square,
  Pause,
  Play,
  Trash2,
  Cpu,
  Layers,
  Activity,
  ListFilter,
  GripVertical,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  FolderOpen,
  FolderCheck,
  RefreshCw,
  FileCode,
  Zap
} from 'lucide-react';
import { detectFormatFromUrl, isAutoDetectableUrl, isPlaylistWithSingleVideoUrl, stripPlaylistParam } from '../utils/formatDetector';
import { useTranslation } from '../i18n/LanguageContext';
import { getResolutionOptions, getAudioQualityOptions, buildDownloadOptions } from '../utils/downloadHelper';
import Listbox from './Listbox';
import PlaylistChoiceModal from './PlaylistChoiceModal';

export default function MiniApp() {
  const { t } = useTranslation();
  const api = window.api;

  // Bottom Nav Tab State: 'downloader' | 'progress' | 'files'
  const [activeTab, setActiveTab] = useState('downloader');

  // Downloader Stage State: 'stage1' (Search/Paste) | 'stage2' (Analyzed details)
  const [downloaderStage, setDownloaderStage] = useState('stage1');

  // Input & Auto Detect State
  const [url, setUrl] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState(null);
  const [formatType, setFormatType] = useState('video'); // 'video' | 'audio' | 'thumbnail' | 'gif'
  const [quality, setQuality] = useState('best');
  const [selectedPresetId, setSelectedPresetId] = useState('');

  // Analysis & Download State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const [mediaInfo, setMediaInfo] = useState(null);

  // Playlist track selection state (1-indexed track numbers)
  const [playlistSelectedIndexes, setPlaylistSelectedIndexes] = useState([]);

  // Active Downloads & Files History State
  const [activeDownloads, setActiveDownloads] = useState({});
  const [history, setHistory] = useState([]);
  const [filesSearch, setFilesSearch] = useState('');
  const [filesFilter, setFilesFilter] = useState('all');
  const [filesSort, setFilesSort] = useState('newest');
  const [expandedFolders, setExpandedFolders] = useState({});

  // Toast message state
  const [toastMessage, setToastMessage] = useState(null);

  // Playlist Choice Modal State
  const [pendingPlaylistUrl, setPendingPlaylistUrl] = useState(null);

  // Custom & Built-in Presets
  const [customPresets, setCustomPresets] = useState([]);

  const builtinPresets = useMemo(() => [
    {
      id: 'preset-speed',
      name: t('presetSpeedBoost') || '🚀 Speed Boost',
      options: { rateLimit: '10M', customArgs: '--no-mtime' }
    },
    {
      id: 'preset-bypass',
      name: t('presetBypass') || '🔐 Geo-Bypass',
      options: { customArgs: '--geo-bypass' }
    },
    {
      id: 'preset-cut-1m',
      name: t('presetCut') || '✂️ Cut First 1 Min',
      options: { downloadSections: '*00:00:00-00:01:00' }
    }
  ], [t]);

  // Load Presets & History on mount from User Documents JSON Database
  useEffect(() => {
    if (api && api.loadPresetsDb) {
      api.loadPresetsDb().then((presets) => {
        if (Array.isArray(presets)) setCustomPresets(presets);
      }).catch(() => {});
    } else {
      try {
        const saved = localStorage.getItem('media_downloader_custom_presets');
        if (saved) setCustomPresets(JSON.parse(saved));
      } catch (e) {}
    }

    if (api && api.loadDownloadsDb) {
      api.loadDownloadsDb().then((hist) => {
        if (Array.isArray(hist)) setHistory(hist);
      }).catch(() => {});
    } else if (api && api.miniRequestHistory) {
      api.miniRequestHistory().then((hist) => {
        if (Array.isArray(hist)) setHistory(hist);
      }).catch(() => {});
    }

    if (api && api.miniGetDownloadsMeta) {
      api.miniGetDownloadsMeta().then((metas) => {
        if (Array.isArray(metas)) {
          const map = {};
          metas.forEach((m) => {
            map[m.id] = m;
          });
          setActiveDownloads(map);
        }
      }).catch(() => { });
    }

    // Initial draft fetch from Main process
    if (api && api.syncGetDraft) {
      api.syncGetDraft().then((draft) => {
        if (draft && typeof draft === 'object') {
          if (draft.url) setUrl(draft.url);
          if (draft.mediaInfo) {
            setMediaInfo(draft.mediaInfo);
            setDownloaderStage('stage2');
          }
          if (draft.formatType) setFormatType(draft.formatType);
          if (draft.quality || draft.videoQuality) setQuality(draft.quality || draft.videoQuality);
          if (draft.playlistSelectedIndexes && Array.isArray(draft.playlistSelectedIndexes)) {
            setPlaylistSelectedIndexes(draft.playlistSelectedIndexes);
          } else if (draft.playlistItems && typeof draft.playlistItems === 'string') {
            const parsed = draft.playlistItems.split(',').map((n) => parseInt(n.trim(), 10)).filter((n) => !isNaN(n));
            if (parsed.length > 0) setPlaylistSelectedIndexes(parsed);
          }
        }
      }).catch(() => { });
    }
  }, []);

  useEffect(() => {
    if (!api) return;
    const unsubDl = api.onSyncDownloadsDb ? api.onSyncDownloadsDb((dbItems) => {
      if (Array.isArray(dbItems)) setHistory(dbItems);
    }) : null;

    const unsubPreset = api.onSyncPresetsDb ? api.onSyncPresetsDb((presets) => {
      if (Array.isArray(presets)) setCustomPresets(presets);
    }) : null;

    return () => {
      if (unsubDl) unsubDl();
      if (unsubPreset) unsubPreset();
    };
  }, []);

  // Initialize selected playlist indexes when mediaInfo is loaded
  useEffect(() => {
    if (mediaInfo && mediaInfo.isPlaylist && mediaInfo.info && mediaInfo.info.entries) {
      const all = mediaInfo.info.entries.map((_, idx) => idx + 1);
      setPlaylistSelectedIndexes(all);
    } else {
      setPlaylistSelectedIndexes([]);
    }
  }, [mediaInfo]);

  // Set up IPC event listeners
  useEffect(() => {
    if (!api) return;

    const unsubActiveUpdate = api.onMiniActiveUpdate ? api.onMiniActiveUpdate((data) => {
      setActiveDownloads((prev) => ({ ...prev, [data.id]: data }));
    }) : null;

    const unsubActiveRemoved = api.onMiniActiveRemoved ? api.onMiniActiveRemoved((data) => {
      setActiveDownloads((prev) => {
        const copy = { ...prev };
        delete copy[data.id];
        return copy;
      });
      if (api.miniRequestHistory) {
        api.miniRequestHistory().then((hist) => {
          if (Array.isArray(hist)) setHistory(hist);
        }).catch(() => { });
      }
    }) : null;

    const unsubProgress = api.onDownloadProgress ? api.onDownloadProgress((data) => {
      setActiveDownloads((prev) => {
        const existing = prev[data.id] || {
          id: data.id,
          title: data.mediaTitle || 'Downloading...',
          percent: 0,
          totalItems: 1,
          currentItem: 1
        };
        return {
          ...prev,
          [data.id]: {
            ...existing,
            percent: data.percent !== undefined ? data.percent : existing.percent,
            speed: data.speed || existing.speed || '—',
            eta: data.eta || existing.eta || '—'
          }
        };
      });
    }) : null;

    const unsubItemChange = api.onDownloadItemChange ? api.onDownloadItemChange((data) => {
      setActiveDownloads((prev) => {
        const existing = prev[data.id] || { id: data.id, title: 'Downloading...', percent: 0 };
        return {
          ...prev,
          [data.id]: {
            ...existing,
            currentItem: data.currentItem,
            totalItems: data.totalItems || existing.totalItems || 1
          }
        };
      });
    }) : null;

    const unsubSyncHistory = api.onSyncHistory ? api.onSyncHistory((hist) => {
      if (Array.isArray(hist)) setHistory(hist);
    }) : null;

    const unsubSyncDraft = api.onSyncDraft ? api.onSyncDraft((draft) => {
      if (draft && typeof draft === 'object') {
        const isInputFocused = document.activeElement && document.activeElement.tagName === 'INPUT';
        if (draft.url !== undefined && !isInputFocused) {
          setUrl(draft.url);
        }
        if (draft.mediaInfo !== undefined) {
          setMediaInfo(draft.mediaInfo);
          if (draft.mediaInfo) setDownloaderStage('stage2');
        }
        if (draft.formatType) setFormatType(draft.formatType);
        if (draft.quality || draft.videoQuality || draft.audioQuality) setQuality(draft.quality || draft.videoQuality || draft.audioQuality);
        if (draft.playlistSelectedIndexes && Array.isArray(draft.playlistSelectedIndexes)) {
          setPlaylistSelectedIndexes(draft.playlistSelectedIndexes);
        } else if (draft.playlistItems && typeof draft.playlistItems === 'string') {
          const parsed = draft.playlistItems.split(',').map((n) => parseInt(n.trim(), 10)).filter((n) => !isNaN(n));
          if (parsed.length > 0) setPlaylistSelectedIndexes(parsed);
        }
      }
    }) : null;

    const unsubLog = api.onDownloadLog ? api.onDownloadLog((data) => {
      if (data && data.id && data.currentTrackTitle) {
        setActiveDownloads((prev) => {
          if (!prev[data.id]) return prev;
          return {
            ...prev,
            [data.id]: {
              ...prev[data.id],
              currentTrackTitle: data.currentTrackTitle
            }
          };
        });
      }
    }) : null;

    return () => {
      if (typeof unsubActiveUpdate === 'function') unsubActiveUpdate();
      if (typeof unsubActiveRemoved === 'function') unsubActiveRemoved();
      if (typeof unsubProgress === 'function') unsubProgress();
      if (typeof unsubItemChange === 'function') unsubItemChange();
      if (typeof unsubSyncHistory === 'function') unsubSyncHistory();
      if (typeof unsubLog === 'function') unsubLog();
    };
  }, [api]);

  // Auto detect format from URL
  const applyAutoFormatRule = (targetUrl) => {
    if (!targetUrl) {
      setDetectedPlatform(null);
      return;
    }
    const detected = detectFormatFromUrl(targetUrl);
    if (detected.formatType) {
      setFormatType(detected.formatType);
      setDetectedPlatform(detected);
      if (detected.formatType === 'audio') setQuality('mp3-192');
      else setQuality('best');
    } else {
      setDetectedPlatform(null);
    }
  };

  const handleUrlChange = (e) => {
    const val = e.target.value;
    setUrl(val);
    applyAutoFormatRule(val);
    setAnalyzeError('');
  };

  const handlePasteClipboard = async () => {
    try {
      let text = '';
      if (navigator.clipboard && navigator.clipboard.readText) {
        try {
          text = await navigator.clipboard.readText();
        } catch (e) {
          console.warn('navigator.clipboard.readText failed:', e);
        }
      }
      if (!text) {
        const textarea = document.createElement('textarea');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        if (document.execCommand('paste')) {
          text = textarea.value;
        }
        document.body.removeChild(textarea);
      }
      if (text && text.trim()) {
        const clean = text.trim();
        setUrl(clean);
        applyAutoFormatRule(clean);
        setAnalyzeError('');
        if (/^https?:\/\//i.test(clean)) {
          triggerAnalyze(clean);
        }
      }
    } catch (e) {
      console.error('Clipboard error:', e);
    }
  };

  const triggerAnalyze = async (overrideUrl = null, forceMode = null) => {
    const rawUrl = (overrideUrl !== null ? overrideUrl : url).trim();
    if (!rawUrl) return;

    if (!forceMode && isPlaylistWithSingleVideoUrl(rawUrl)) {
      setPendingPlaylistUrl(rawUrl);
      return;
    }

    let urlToAnalyze = rawUrl;
    if (forceMode === 'single') {
      urlToAnalyze = stripPlaylistParam(rawUrl);
      setUrl(urlToAnalyze);
      applyAutoFormatRule(urlToAnalyze);
    }

    setIsAnalyzing(true);
    setAnalyzeError('');

    try {
      let queryToSend = urlToAnalyze;
      const isDirectUrl = /^https?:\/\//i.test(urlToAnalyze);
      if (!isDirectUrl) {
        queryToSend = `ytsearch20:${urlToAnalyze}`;
      }

      const res = api ? await api.getVideoInfo(queryToSend) : null;
      if (res && res.success) {
        setMediaInfo(res);
        if (urlToAnalyze.includes('soundcloud.com') && formatType !== 'audio') {
          setFormatType('audio');
          setQuality('mp3-192');
        }
        setDownloaderStage('stage2');
      } else {
        setAnalyzeError(t('downloadError') || 'Could not fetch media info.');
      }
    } catch (err) {
      setAnalyzeError(err.message || 'Error fetching media info.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePlaylistChoice = (choice) => {
    const rawUrl = pendingPlaylistUrl;
    setPendingPlaylistUrl(null);
    if (!rawUrl) return;
    triggerAnalyze(rawUrl, choice);
  };

  // Playlist selection handlers
  const handleTogglePlaylistItem = (trackIndex) => {
    if (playlistSelectedIndexes.includes(trackIndex)) {
      setPlaylistSelectedIndexes(playlistSelectedIndexes.filter((i) => i !== trackIndex));
    } else {
      setPlaylistSelectedIndexes([...playlistSelectedIndexes, trackIndex].sort((a, b) => a - b));
    }
  };

  const handleSelectAllPlaylist = () => {
    if (mediaInfo && mediaInfo.info && mediaInfo.info.entries) {
      const all = mediaInfo.info.entries.map((_, idx) => idx + 1);
      setPlaylistSelectedIndexes(all);
    }
  };

  const handleDeselectAllPlaylist = () => {
    setPlaylistSelectedIndexes([]);
  };

  const handleStartDownload = async () => {
    if (!url.trim() || !api) return;

    const targetTitle = mediaInfo && mediaInfo.info && mediaInfo.info.title ? mediaInfo.info.title : 'Media';

    try {
      const destDir = await api.getDownloadsPath();
      const id = `mini_${Date.now()}`;

      let presetOptions = {};
      if (selectedPresetId) {
        const foundBuiltin = builtinPresets.find((p) => p.id === selectedPresetId);
        if (foundBuiltin) {
          presetOptions = foundBuiltin.options;
        } else {
          const foundCustom = customPresets.find((p) => p.id === selectedPresetId);
          if (foundCustom && foundCustom.options) {
            presetOptions = foundCustom.options;
          }
        }
      }

      const downloadOptions = buildDownloadOptions({
        id,
        url: url.trim(),
        formatType,
        quality,
        videoQuality: quality,
        audioQuality: quality,
        destDir,
        mediaInfo,
        playlistSelectedIndexes,
        advancedOptions: {
          ...presetOptions
        }
      });

      await api.miniStartDownload(downloadOptions);

      // STAGE 3: Reset back to Stage 1 immediately & show toast notification
      setUrl('');
      setMediaInfo(null);
      setAnalyzeError('');
      setDownloaderStage('stage1');

      const isPlaylist = !!(mediaInfo && mediaInfo.isPlaylist && !mediaInfo.isSearch);
      const countMsg = isPlaylist ? ` (${downloadOptions.playlistEntries ? downloadOptions.playlistEntries.length : 0} tracks)` : '';
      showToastBanner(`Added "${targetTitle.substring(0, 20)}${targetTitle.length > 20 ? '...' : ''}"${countMsg} to queue`);
    } catch (err) {
      setAnalyzeError(err.message || 'Failed to start download.');
    }
  };

  const showToastBanner = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleOpenMainProgram = () => {
    const draftData = {
      url: url.trim(),
      mediaInfo,
      formatType,
      quality,
      playlistSelectedIndexes,
      playlistItems: playlistSelectedIndexes.join(','),
      downloaderStage,
      isAnalyzing
    };
    if (api && api.syncPushDraft) {
      api.syncPushDraft(draftData);
    }
    if (api && api.miniShowMain) {
      api.miniShowMain(draftData);
    }
    if (api && api.miniClose) {
      api.miniClose();
    }
  };

  const handleCloseMiniWindow = () => {
    if (api && api.miniClose) {
      api.miniClose();
    }
  };

  const handlePauseItem = (id) => {
    if (api && api.pauseDownload) api.pauseDownload(id);
  };

  const handleCancelItem = (id) => {
    if (api && api.cancelDownload) api.cancelDownload(id);
  };

  const handlePauseAll = () => {
    Object.keys(activeDownloads).forEach((id) => {
      if (api && api.pauseDownload) api.pauseDownload(id);
    });
  };

  const handleCancelAll = () => {
    Object.keys(activeDownloads).forEach((id) => {
      if (api && api.cancelDownload) api.cancelDownload(id);
    });
  };

  const activeKeys = Object.keys(activeDownloads).filter((id) => {
    const item = activeDownloads[id];
    return item && (item.percent === undefined || item.percent < 100);
  });
  const completedCount = history.filter((d) => !d.isCancelled).length;

  const totalRemainItems = Object.keys(activeDownloads).reduce((acc, id) => {
    const item = activeDownloads[id];
    if (!item) return acc;
    if (item.percent >= 100) return acc;
    const total = item.totalItems || 1;
    const current = item.currentItem || 1;
    let remaining = Math.max(1, total - current + 1);
    if (item.percent > 99) remaining = Math.max(0, remaining - 1);
    return acc + remaining;
  }, 0);

  const overallAvgPercent = activeKeys.length > 0
    ? activeKeys.reduce((acc, id) => acc + (activeDownloads[id]?.percent || 0), 0) / activeKeys.length
    : 0;

  // History Save & Sync Handler backed by User Documents JSON Database
  const saveHistory = async (newHistory) => {
    setHistory(newHistory);
    localStorage.setItem('media_downloader_history', JSON.stringify(newHistory));
    if (api && api.saveDownloadsDb) {
      await api.saveDownloadsDb(newHistory);
    }
    if (api && api.syncPushHistory) {
      api.syncPushHistory(newHistory);
    }
  };

  const handleDeleteHistoryItem = async (id) => {
    if (api && api.deleteDownloadDbItem) {
      const updated = await api.deleteDownloadDbItem(id);
      setHistory(updated);
    } else {
      const updated = history.filter((item) => item.id !== id);
      saveHistory(updated);
    }
    showToastBanner(t('deletedFileAlert') || 'Deleted item from history');
  };

  const handleClearAllHistory = async () => {
    if (confirm(t('confirmClearHistory') || 'Are you sure you want to clear all history?')) {
      if (api && api.clearDownloadsDb) {
        const updated = await api.clearDownloadsDb();
        setHistory(updated);
      } else {
        saveHistory([]);
      }
      showToastBanner(t('clearHistoryBtn') || 'History cleared');
    }
  };

  const handleCopyFilePath = (filePath) => {
    if (api && api.copyFile && filePath) {
      api.copyFile(filePath);
      showToastBanner(t('copiedPathAlert') || 'Path copied to clipboard');
    }
  };

  const handleOpenFile = (filePath) => {
    if (api && api.openFile && filePath) {
      api.openFile(filePath);
    }
  };

  const handleOpenFolder = (folderPath) => {
    if (api && api.openFolder && folderPath) {
      api.openFolder(folderPath);
    }
  };

  const toggleExpandFolder = (id) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleDragStart = (e, item) => {
    e.preventDefault();
    const targetPath = item.filePath || item.folderPath;
    if (api && api.startDrag && targetPath) {
      if (item.isPlaylist) {
        if (item.downloadedFiles && item.downloadedFiles.length > 0) {
          api.startDrag(item.downloadedFiles);
        } else {
          api.startDrag(item.folderPath || item.filePath);
        }
      } else {
        api.startDrag(item.filePath || item.folderPath);
      }
    }
  };

  const handleTrackDragStart = (e, trackFilePath, fallbackFolderPath) => {
    e.stopPropagation();
    e.preventDefault();
    const targetPath = trackFilePath || fallbackFolderPath;
    if (api && api.startDrag && targetPath) {
      api.startDrag(targetPath);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredFiles = useMemo(() => {
    // Hide standalone sub-playlist items from top-level list
    let result = history.filter((item) => {
      if (item.isPlaylistItem) return false;
      if (item.id && typeof item.id === 'string' && item.id.includes('_item_')) return false;
      return true;
    });

    if (filesSearch.trim()) {
      const term = filesSearch.toLowerCase();
      result = result.filter(
        (item) =>
          (item.title && item.title.toLowerCase().includes(term)) ||
          (item.mediaTitle && item.mediaTitle.toLowerCase().includes(term)) ||
          (item.uploader && item.uploader.toLowerCase().includes(term)) ||
          (item.filePath && item.filePath.toLowerCase().includes(term)) ||
          (item.folderPath && item.folderPath.toLowerCase().includes(term)) ||
          (item.playlist_items && Array.isArray(item.playlist_items) && item.playlist_items.some(child => child.title?.toLowerCase().includes(term) || child.filePath?.toLowerCase().includes(term)))
      );
    }

    if (filesFilter === 'video') {
      result = result.filter((item) => item.formatType === 'video');
    } else if (filesFilter === 'audio') {
      result = result.filter((item) => item.formatType === 'audio');
    } else if (filesFilter === 'gif') {
      result = result.filter((item) => item.formatType === 'gif');
    } else if (filesFilter === 'playlist') {
      result = result.filter((item) => item.isPlaylist);
    }

    result.sort((a, b) => {
      const timeA = a.downloadedAt || 0;
      const timeB = b.downloadedAt || 0;
      const titleA = a.title || a.mediaTitle || '';
      const titleB = b.title || b.mediaTitle || '';

      if (filesSort === 'oldest') return timeA - timeB;
      if (filesSort === 'title-asc') return titleA.localeCompare(titleB);
      if (filesSort === 'title-desc') return titleB.localeCompare(titleA);
      return timeB - timeA; // newest default
    });

    return result;
  }, [history, filesSearch, filesFilter, filesSort]);

  return (
    <div className="relative flex flex-col h-screen w-screen max-h-screen max-w-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans select-none overflow-hidden rounded-none border-none shadow-2xl transform-gpu transition-colors duration-300">
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(236,72,153,0.12)_0%,transparent_50%),radial-gradient(circle_at_85%_85%,rgba(59,130,246,0.12)_0%,transparent_50%)] pointer-events-none z-0 transform-gpu" />

      {/* Top Header / Titlebar */}
      <header className="relative z-10 flex items-center justify-between h-11 px-3 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10 shrink-0 drag-region transition-colors duration-300">
        <div className="flex items-center gap-2 no-drag">
          <div className="flex items-center drop-shadow-[0_0_6px_rgba(236,72,153,0.5)]">
            <Sparkles size={16} className="text-pink-500 animate-pulse" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-tight">Quick Downloader</span>
        </div>
        <div className="flex items-center gap-1 no-drag">
          <button
            className="w-6.5 h-6.5 rounded-lg bg-slate-100 hover:bg-red-500/15 dark:bg-white/5 dark:hover:bg-red-500/20 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-red-500 flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer transform-gpu"
            onClick={handleCloseMiniWindow}
            title={t('close') || 'Close'}
          >
            <X size={13} />
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="relative z-1 flex-1 flex flex-col p-2.5 overflow-y-auto no-drag transition-opacity duration-300">
        {/* ==================== TAB 1: DOWNLOADER ==================== */}
        {activeTab === 'downloader' && (
          <div className="flex flex-col gap-2 transform-gpu">
            {downloaderStage === 'stage1' ? (
              /* ===== STAGE 1: App Branding & Google-Style Search Bar ===== */
              <div className="flex flex-col items-center justify-center py-6 px-2 space-y-4 animate-fade-in-up transform-gpu">
                <div className="text-center space-y-1">
                  <div className="inline-flex p-2.5 rounded-2xl bg-pink-500/10 border border-pink-500/20 mb-1 shadow-md shadow-pink-500/10">
                    <Sparkles size={20} className="text-pink-500 animate-pulse" />
                  </div>
                  <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">{t('appName')}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('miniHeroSubtitle')}</p>
                </div>

                {/* Google-Style Search Bar */}
                <div className="relative w-full flex items-center gap-2 bg-white/90 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700/60 focus-within:border-pink-500 rounded-xl px-3 py-1.5 shadow-md transition-all duration-200">
                  <Search size={16} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    className="flex-1 bg-transparent border-none outline-none text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder={t('miniSearchOrPaste')}
                    value={url}
                    onChange={handleUrlChange}
                    onKeyDown={(e) => e.key === 'Enter' && triggerAnalyze()}
                    spellCheck={false}
                    autoFocus
                  />
                  <button
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 active:scale-95 border border-pink-500/30 text-pink-600 dark:text-pink-300 text-[11px] font-semibold transition-all duration-200 cursor-pointer shrink-0 transform-gpu"
                    onClick={handlePasteClipboard}
                    title={t('pasteClipboard')}
                  >
                    <Clipboard size={14} />
                    <span>{t('miniPaste')}</span>
                  </button>
                </div>

                {detectedPlatform && (
                  <div className="flex items-center gap-1.5 text-xs text-pink-600 dark:text-pink-400 font-semibold animate-fade-in">
                    <Sparkles size={12} className="animate-pulse" />
                    <span>
                      {t('detectedPlatform', { platform: detectedPlatform.platform || 'Media' })} ({detectedPlatform.formatType.toUpperCase()})
                    </span>
                  </div>
                )}

                {/* Quick Analyze Button */}
                <button
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-sky-500 hover:opacity-95 active:scale-98 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-pink-500/20 transition-all duration-200 cursor-pointer transform-gpu"
                  onClick={() => triggerAnalyze()}
                  disabled={isAnalyzing || !url.trim()}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>{t('analyzing')}</span>
                    </>
                  ) : (
                    <>
                      <Search size={15} />
                      <span>{t('analyzeBtn')}</span>
                    </>
                  )}
                </button>

                {analyzeError && (
                  <div className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-300 text-xs mt-2 animate-fade-in">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{analyzeError}</span>
                  </div>
                )}
              </div>
            ) : (
              /* ===== STAGE 2: Media Details, Playlist Manager, Format/Quality & Download ===== */
              <div className="flex flex-col gap-2.5 animate-fade-in-up transform-gpu">
                {/* Back to search button */}
                <div className="flex items-center justify-between pb-0.5">
                  <button
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 active:scale-95 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-white/10 transition-all duration-200 cursor-pointer transform-gpu"
                    onClick={() => setDownloaderStage('stage1')}
                  >
                    <ArrowLeft size={13} />
                    <span>{t('miniBackSearch')}</span>
                  </button>
                </div>

                {/* Media Thumbnail & Title Card */}
                {mediaInfo && mediaInfo.info && (
                  <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl shadow-md space-y-2 transform-gpu transition-transform duration-200 hover:scale-[1.01]">
                    <div className="flex items-center gap-3">
                      {mediaInfo.info.thumbnail ? (
                        <img
                          src={mediaInfo.info.thumbnail}
                          alt="Thumbnail"
                          className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-md"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                          <Film size={20} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{mediaInfo.info.title || 'Untitled Media'}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{mediaInfo.info.uploader || 'Unknown Artist'}</p>
                        {mediaInfo.isPlaylist && mediaInfo.info.entries && (
                          <span className="inline-block text-[10px] font-semibold text-purple-600 dark:text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-md border border-purple-500/30">
                            🎵 {t('playlistTitle')}: {mediaInfo.info.entries.length} {t('playlistItemCount', { count: '' }).trim()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Playlist Inspector & Track Selection Card (Shown if playlist) */}
                {mediaInfo && mediaInfo.isPlaylist && mediaInfo.info && mediaInfo.info.entries && (
                  <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl space-y-2.5 shadow-md transform-gpu">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                        <ListPlus size={14} className="text-purple-500" />
                        <span>{t('miniSelectPlaylistTracks')}</span>
                      </div>
                      <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 font-bold">
                        {playlistSelectedIndexes.length} / {mediaInfo.info.entries.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="flex-1 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 transition-all duration-200 cursor-pointer transform-gpu"
                        onClick={handleSelectAllPlaylist}
                      >
                        {t('selectAll')}
                      </button>
                      <button
                        type="button"
                        className="flex-1 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 transition-all duration-200 cursor-pointer transform-gpu"
                        onClick={handleDeselectAllPlaylist}
                      >
                        {t('deselectAll')}
                      </button>
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-1 bg-slate-50 dark:bg-slate-950/60 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      {mediaInfo.info.entries.map((track, idx) => {
                        const trackNum = idx + 1;
                        const isSelected = playlistSelectedIndexes.includes(trackNum);
                        return (
                          <div
                            key={track.id || idx}
                            className={`flex items-center gap-2 p-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer ${isSelected ? 'bg-purple-500/20 text-purple-700 dark:text-purple-200 border border-purple-500/30 font-semibold' : 'hover:bg-slate-200/50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 border border-transparent'
                              }`}
                            onClick={() => handleTogglePlaylistItem(trackNum)}
                          >
                            <input
                              type="checkbox"
                              className="rounded text-purple-500 focus:ring-0 cursor-pointer"
                              checked={isSelected}
                              onChange={() => { }}
                            />
                            <span className="font-mono text-[11px] opacity-60 shrink-0">{trackNum}.</span>
                            <span className="truncate flex-1 font-medium text-slate-800 dark:text-slate-200">
                              {track.title || `Track ${trackNum}`}
                            </span>
                            {track.duration && (
                              <span className="font-mono text-[10px] opacity-60 shrink-0">
                                {Math.floor(track.duration / 60)}:{Math.floor(track.duration % 60).toString().padStart(2, '0')}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Format Type Selector Pills */}
                <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl space-y-2.5 shadow-md transform-gpu">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t('miniSelectFormatLabel')}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                    <button
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${formatType === 'video'
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20 scale-[1.02]'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      onClick={() => {
                        setFormatType('video');
                        setQuality('best');
                      }}
                    >
                      <Film size={13} />
                      <span>{t('formatVideo')}</span>
                    </button>
                    <button
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${formatType === 'audio'
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20 scale-[1.02]'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      onClick={() => {
                        setFormatType('audio');
                        setQuality('mp3-192');
                      }}
                    >
                      <Music size={13} />
                      <span>{t('formatAudio')}</span>
                    </button>
                    <button
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${formatType === 'thumbnail'
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20 scale-[1.02]'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      onClick={() => {
                        setFormatType('thumbnail');
                        setQuality('best');
                      }}
                    >
                      <ImageIcon size={13} />
                      <span>{t('miniThumbPill')}</span>
                    </button>
                  </div>

                  {/* Quality Select */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('qualityLabel')}:</span>
                    <Listbox
                      size="sm"
                      className="w-36"
                      value={quality}
                      onChange={(e) => setQuality(e.target.value)}
                      options={formatType === 'video' ? getResolutionOptions(mediaInfo) : (formatType === 'audio' ? getAudioQualityOptions() : [{ value: 'best', label: t('qualityBestSimple') }])}
                    />
                  </div>
                </div>

                {/* Advance Preset Selector */}
                <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl space-y-2 shadow-md transform-gpu">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                      <SlidersHorizontal size={13} className="text-purple-500" />
                      <span>{t('presetsSectionTitle')}</span>
                    </div>
                    <button
                      className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-500 hover:bg-purple-500/10 px-2 py-0.5 rounded-md transition-all duration-200 cursor-pointer"
                      onClick={handleOpenMainProgram}
                      title={t('miniOpenMainPresetHint')}
                    >
                      <span>{t('miniEditInMain')}</span>
                      <ExternalLink size={11} />
                    </button>
                  </div>

                  <Listbox
                    className="w-full"
                    value={selectedPresetId}
                    onChange={(e) => setSelectedPresetId(e.target.value)}
                  >
                    <option value="">-- {t('miniDefaultPreset')} --</option>
                    <optgroup label={t('presetsSectionTitle')}>
                      {builtinPresets.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.name}
                        </option>
                      ))}
                    </optgroup>
                    {customPresets.length > 0 && (
                      <optgroup label={t('customPresetsTitle')}>
                        {customPresets.map((preset) => (
                          <option key={preset.id} value={preset.id}>
                            ⭐ {preset.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </Listbox>
                </div>


                {/* Primary Download Button */}
                <button
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-sky-500 hover:opacity-95 active:scale-98 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-pink-500/25 transition-all duration-200 cursor-pointer transform-gpu"
                  onClick={handleStartDownload}
                  disabled={mediaInfo && mediaInfo.isPlaylist && playlistSelectedIndexes.length === 0}
                >
                  <Download size={16} />
                  <span>
                    {mediaInfo && mediaInfo.isPlaylist
                      ? t('miniDownloadXTracks', { count: playlistSelectedIndexes.length })
                      : t('miniStartDownloadNow')}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 2: DOWNLOAD PROGRESS ==================== */}
        {activeTab === 'progress' && (
          <div className="flex flex-col gap-2 animate-fade-in-up transform-gpu">
            {/* Header Toolbar: Threads, Remain, & Manage Controls */}
            <div className="flex items-center justify-between p-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl shadow-md">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-semibold shadow-sm transition-transform duration-200 hover:scale-105" title={t('miniThreads', { count: activeKeys.length })}>
                  <Activity size={14} className={`text-cyan-500 dark:text-cyan-400 ${activeKeys.length > 0 ? 'animate-pulse' : ''}`} />
                  <span className="font-mono font-bold transition-all duration-300">{activeKeys.length}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-semibold shadow-sm transition-transform duration-200 hover:scale-105" title={t('miniRemain', { count: totalRemainItems })}>
                  <Layers size={14} className="text-purple-500 dark:text-purple-400" />
                  <span className="font-mono font-bold transition-all duration-300">{totalRemainItems}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {activeKeys.length > 0 && (
                  <>
                    <button
                      className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all duration-200 cursor-pointer transform-gpu"
                      onClick={handlePauseAll}
                      title={t('miniPauseAll')}
                    >
                      <Pause size={13} />
                    </button>
                    <button
                      className="p-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 active:scale-95 text-red-600 dark:text-red-400 border border-red-500/30 transition-all duration-200 cursor-pointer transform-gpu"
                      onClick={handleCancelAll}
                      title={t('miniCancelAll')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
                <button
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-purple-600 dark:text-purple-400 border border-slate-200 dark:border-slate-700 transition-all duration-200 cursor-pointer transform-gpu"
                  onClick={handleOpenMainProgram}
                  title={t('miniOpenMainQueueHint')}
                >
                  <Maximize2 size={13} />
                </button>
              </div>
            </div>

            {activeKeys.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500 text-xs space-y-2">
                <Activity size={32} className="opacity-30 mb-1 animate-pulse text-cyan-500" />
                <span>{t('miniNoActiveDownloads')}</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {activeKeys.map((id) => {
                  const dl = activeDownloads[id];
                  const pct = Math.min(100, Math.max(0, dl.percent || 0));
                  const isAudio = dl.formatType === 'audio';
                  const isThumb = dl.formatType === 'thumbnail';
                  const isPlaylist = !!dl.isPlaylist;

                  return (
                    <div key={id} className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl shadow-md space-y-2.5 transform-gpu transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700">
                      {/* Top Item Row: Thumbnail + Item Meta + Quick Action Buttons */}
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-950 shadow-md">
                          {dl.thumbnail ? (
                            <img
                              src={dl.thumbnail}
                              alt="Item Thumbnail"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                              {isAudio ? (
                                <Music size={16} className="text-purple-500" />
                              ) : isThumb ? (
                                <ImageIcon size={16} className="text-blue-500" />
                              ) : (
                                <Film size={16} className="text-pink-500" />
                              )}
                            </div>
                          )}
                          {isPlaylist && (
                            <span className="absolute bottom-0 right-0 bg-black/80 text-[9px] font-bold text-purple-300 px-1 rounded-tl">
                              🎵 {dl.currentItem || 1}/{dl.totalItems || 1}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate" title={dl.title || dl.mediaTitle}>
                            {dl.title || dl.mediaTitle || t('miniDownloadingMedia')}
                          </h4>

                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                            {dl.uploader && <span className="truncate max-w-[120px]">{dl.uploader}</span>}
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {dl.formatType ? dl.formatType.toUpperCase() : 'MEDIA'}
                            </span>
                          </div>

                          {/* Dedicated Playlist Track Progress detail */}
                          {isPlaylist && (
                            <div className="text-[10px] text-purple-600 dark:text-purple-300 truncate">
                              {t('miniTrackProgress', { current: dl.currentItem || 1, total: dl.totalItems || 1 })}:{' '}
                              <strong className="font-semibold">{dl.currentTrackTitle || dl.title || t('miniDownloadingMedia')}</strong>
                            </div>
                          )}
                        </div>

                        {/* Individual Item Controls */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all duration-200 cursor-pointer transform-gpu"
                            onClick={() => handlePauseItem(id)}
                            title="Pause Download"
                          >
                            <Pause size={13} />
                          </button>
                          <button
                            className="p-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 active:scale-95 text-red-600 dark:text-red-400 border border-red-500/30 transition-all duration-200 cursor-pointer transform-gpu"
                            onClick={() => handleCancelItem(id)}
                            title="Cancel Download"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Animated Progress Bar */}
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-white/5 relative">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 rounded-full transition-all duration-500 ease-out transform-gpu"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {/* Progress Stats */}
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        <span className="font-bold text-cyan-600 dark:text-cyan-400">{pct.toFixed(1)}%</span>
                        <span className="text-slate-700 dark:text-slate-300">{dl.speed || '—'}</span>
                        <span className="text-purple-600 dark:text-purple-300">ETA {dl.eta || '—'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 3: DOWNLOADED FILES ==================== */}
        {activeTab === 'files' && (
          <div className="flex flex-col gap-2 animate-fade-in-up transform-gpu">
            {/* Search, Filter & Sort Bar (Style 1: Segmented Control liền khối iOS/macOS) */}
            <div className="p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl space-y-2.5 shadow-lg">
              {/* Unified Search + Sort Row */}
              <div className="flex items-center gap-2 h-9">
                <div className="flex-1 h-full flex items-center gap-2 bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700/60 focus-within:border-pink-500/60 focus-within:bg-white dark:focus-within:bg-slate-950 rounded-xl px-2.5 text-xs transition-all duration-200 shadow-inner">
                  <Search size={14} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    className="w-full bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs font-medium"
                    placeholder={t('searchHistoryPlaceholder') || 'Search items...'}
                    value={filesSearch}
                    onChange={(e) => setFilesSearch(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-1.5 h-full shrink-0">
                  <Listbox
                    size="sm"
                    className="w-28 sm:w-32 h-full"
                    buttonClassName="h-full rounded-xl py-0"
                    value={filesSort}
                    onChange={(e) => setFilesSort(e.target.value)}
                  >
                    <option value="newest">{t('sortNewest') || 'Newest'}</option>
                    <option value="oldest">{t('sortOldest') || 'Oldest'}</option>
                    <option value="title-asc">{t('sortTitleAsc') || 'Title A-Z'}</option>
                    <option value="title-desc">{t('sortTitleDesc') || 'Title Z-A'}</option>
                  </Listbox>

                  {history.length > 0 && (
                    <button
                      className="h-full aspect-square rounded-xl bg-red-500/10 hover:bg-red-500/20 active:scale-95 text-red-600 dark:text-red-400 border border-red-500/25 flex items-center justify-center transition-all duration-200 cursor-pointer transform-gpu"
                      onClick={handleClearAllHistory}
                      title={t('clearHistoryBtn') || 'Clear History'}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Type Filter Segmented Control Bar */}
              <div className="grid grid-cols-5 gap-1 p-1 rounded-xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80">
                {[
                  { id: 'all', label: t('filterAll') || 'All' },
                  { id: 'video', label: t('filterVideo') || 'Video' },
                  { id: 'audio', label: t('filterAudio') || 'Audio' },
                  { id: 'gif', label: t('filterGif') || 'GIF' },
                  { id: 'playlist', label: t('filterPlaylist') || 'Playlist' }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilesFilter(f.id)}
                    className={`py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 cursor-pointer flex items-center justify-center ${filesFilter === f.id
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20 scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/70 dark:hover:bg-white/5 font-semibold'
                      }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Files List */}
            <div className="flex flex-col gap-2">
              {filteredFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500 text-xs space-y-2">
                  <FolderOpen size={32} className="opacity-30 mb-1" />
                  <span>{t('noHistory') || 'No downloaded history files'}</span>
                </div>
              ) : (
                filteredFiles.map((item, idx) => {
                  const title = item.title || item.mediaTitle || 'Untitled Media';
                  const firstValidTrackPath = item.playlist_items?.find(i => i.filePath && i.filePath !== item.folderPath)?.filePath;
                  const folderPath = item.playlistDir || item.folderPath || (item.downloadedFiles && item.downloadedFiles[0] ? item.downloadedFiles[0] : firstValidTrackPath || item.filePath);
                  const filePath = item.filePath || folderPath;
                  const isExpanded = expandedFolders[item.id];
                  const displayThumb = item.thumbnail || (item.playlistEntries && item.playlistEntries[0] ? item.playlistEntries[0].thumbnail : '');

                  return (
                    <div
                      key={item.id || idx}
                      className={`p-2.5 rounded-2xl border backdrop-blur-xl space-y-2 transition-all duration-200 cursor-grab transform-gpu ${item.isCancelled
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                        }`}
                      draggable={!item.isCancelled}
                      onDragStart={(e) => handleDragStart(e, item)}
                      title={t('dragHint') || 'Drag to export file'}
                    >
                      <div className="flex items-center justify-between gap-2">
                        {/* Left: Drag handle + Thumbnail / Icon */}
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <div className="text-slate-400 dark:text-slate-500 cursor-grab shrink-0">
                            <GripVertical size={15} />
                          </div>

                          <div className="relative w-14 h-9 rounded-lg overflow-hidden bg-slate-900 shrink-0 shadow-sm">
                            {displayThumb ? (
                              <img src={displayThumb} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-white/5">
                                {item.formatType === 'audio' ? <Music size={16} className="text-purple-400" /> : <Film size={16} className="text-pink-400" />}
                              </div>
                            )}
                            <span className="absolute bottom-0.5 right-0.5 bg-black/85 text-white text-[8px] font-bold px-1 rounded">
                              {item.isPlaylist ? 'PL' : (item.formatType ? item.formatType.toUpperCase() : 'FILE')}
                            </span>
                          </div>

                          {/* Meta */}
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                              {title}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 flex-wrap">
                              <span className="truncate max-w-[100px]">{item.uploader || 'Media'}</span>
                              {item.downloadedAt && <span>• {formatDate(item.downloadedAt)}</span>}
                              {item.isPlaylist && (
                                <span className="bg-purple-500/20 text-purple-700 dark:text-purple-300 px-1.5 py-0.2 rounded-full text-[9px] font-semibold">
                                  📁 {item.entriesCount || (item.playlistEntries ? item.playlistEntries.length : 1)} tracks
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all duration-200 cursor-pointer transform-gpu"
                            title={t('openFolder') || 'Open Folder'}
                            onClick={() => handleOpenFolder(folderPath)}
                          >
                            <FolderOpen size={12} />
                          </button>

                          {!item.isPlaylist && (
                            <button
                              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all duration-200 cursor-pointer transform-gpu"
                              title={t('openFile') || 'Open File'}
                              onClick={() => handleOpenFile(filePath)}
                            >
                              <Play size={12} />
                            </button>
                          )}

                          <button
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all duration-200 cursor-pointer transform-gpu"
                            title={t('copyPath') || 'Copy Path'}
                            onClick={() => handleCopyFilePath(filePath || folderPath)}
                          >
                            <Copy size={12} />
                          </button>

                          <button
                            className="p-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 active:scale-95 text-red-600 dark:text-red-400 border border-red-500/30 transition-all duration-200 cursor-pointer transform-gpu"
                            title={t('deleteItem') || 'Delete Item'}
                            onClick={() => handleDeleteHistoryItem(item.id)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Playlist Drawer Toggle Button */}
                      {item.isPlaylist && (
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => toggleExpandFolder(item.id)}
                            className="flex items-center gap-1 text-[10px] font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-500 transition-all duration-200 cursor-pointer"
                          >
                            <span>{isExpanded ? (t('collapseBtn') || 'Collapse') : (t('detailBtn') || 'Tracks')}</span>
                            {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                          </button>
                        </div>
                      )}

                      {/* Expandable Playlist Drawer */}
                      {item.isPlaylist && isExpanded && (
                        <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-1.5 animate-fade-in transform-gpu">
                          <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-300">
                            {t('playlistTitle') || 'Playlist Tracks'}:
                          </div>

                          {item.playlistEntries && item.playlistEntries.length > 0 ? (
                            <div className="max-h-44 overflow-y-auto space-y-1 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                              {item.playlistEntries.map((entry, trkIdx) => {
                                const trackFilePath = item.downloadedFiles && item.downloadedFiles[trkIdx] ? item.downloadedFiles[trkIdx] : null;

                                return (
                                  <div
                                    key={trkIdx}
                                    draggable
                                    onDragStart={(e) => handleTrackDragStart(e, trackFilePath, item.folderPath)}
                                    className="flex items-center gap-2 p-1.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5 hover:border-slate-300 dark:hover:border-slate-700 cursor-grab text-xs transition-all duration-150"
                                    title={t('dragHint') || 'Drag to export file'}
                                  >
                                    <div className="text-slate-400 dark:text-slate-500 cursor-grab shrink-0">
                                      <GripVertical size={13} />
                                    </div>

                                    <div className="w-6 h-6 rounded overflow-hidden bg-slate-800 shrink-0">
                                      <img src={entry.thumbnail || item.thumbnail} alt="" className="w-full h-full object-cover" />
                                    </div>

                                    <div className="min-w-0 flex-1 truncate font-medium text-slate-800 dark:text-slate-100 text-[11px]">
                                      #{trkIdx + 1}. {entry.title || 'Track'}
                                    </div>

                                    <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
                                      {formatDuration(entry.duration)}
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all duration-150 cursor-pointer"
                                        onClick={() => (trackFilePath ? handleOpenFile(trackFilePath) : handleOpenFolder(item.folderPath))}
                                        title={t('openFile') || 'Open File'}
                                      >
                                        <Play size={10} />
                                      </button>
                                      <button
                                        className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all duration-150 cursor-pointer"
                                        onClick={() => handleCopyFilePath(trackFilePath || item.folderPath)}
                                        title={t('copyPath') || 'Copy Path'}
                                      >
                                        <Copy size={10} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                              Folder: <code className="text-emerald-600 dark:text-emerald-300">{item.folderPath}</code>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* STAGE 3 Toast Notification Banner */}
      {toastMessage && (
        <div className="absolute bottom-[72px] left-3 right-3 z-50 flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/95 text-slate-100 dark:bg-slate-900/95 border border-pink-500/30 shadow-2xl shadow-pink-500/20 backdrop-blur-xl text-xs animate-fade-in-up transform-gpu">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0 animate-bounce" />
            <span className="truncate font-medium text-slate-100">{toastMessage}</span>
          </div>
          <button
            className="px-2.5 py-1 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 active:scale-95 text-pink-300 font-bold text-[11px] border border-pink-500/30 transition-all duration-200 cursor-pointer shrink-0 ml-2 transform-gpu"
            onClick={() => setActiveTab('progress')}
          >
            {t('miniNavProgress')}
          </button>
        </div>
      )}

      {/* ==================== FLOATING BOTTOM NAVIGATION BAR ==================== */}
      <nav className="relative z-10 mx-2 mb-2 p-1 rounded-2xl bg-white/90 dark:bg-slate-950/90 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-2xl shadow-xl flex items-center justify-around gap-1 shrink-0 no-drag transition-colors duration-300">
        {/* Animated Nav-Under Progress Bar */}
        {activeKeys.length > 0 && (
          <div className="absolute top-0 left-3 right-3 h-0.5 bg-slate-200 dark:bg-slate-950 rounded-full overflow-hidden" title={`Progress: ${overallAvgPercent.toFixed(1)}%`}>
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 transition-all duration-300 transform-gpu"
              style={{ width: `${overallAvgPercent}%` }}
            />
          </div>
        )}

        <button
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-[10px] font-extrabold transition-all duration-200 cursor-pointer transform-gpu ${activeTab === 'downloader'
            ? 'text-pink-600 dark:text-pink-300 bg-pink-500/10 dark:bg-pink-500/20 border border-pink-500/30 dark:border-pink-500/40 shadow-sm scale-102'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
            }`}
          onClick={() => setActiveTab('downloader')}
          title={t('navDownloader')}
        >
          <Download size={16} className={activeTab === 'downloader' ? 'text-pink-500 dark:text-pink-400' : ''} />
          <span>{t('navDownloader')}</span>
        </button>

        <button
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-[10px] font-extrabold transition-all duration-200 cursor-pointer transform-gpu ${activeTab === 'progress'
            ? 'text-cyan-600 dark:text-cyan-300 bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/30 dark:border-cyan-500/40 shadow-sm scale-102'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
            }`}
          onClick={() => setActiveTab('progress')}
          title={t('miniNavProgress')}
        >
          <div className="relative flex items-center justify-center">
            <Zap
              size={16}
              className={`transition-all duration-300 ${activeKeys.length > 0
                ? 'text-cyan-500 dark:text-cyan-400 animate-pulse drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                : activeTab === 'progress'
                  ? 'text-cyan-500 dark:text-cyan-400'
                  : 'text-slate-500 dark:text-slate-400'
                }`}
            />
            {activeKeys.length > 0 && (
              <span className="absolute -top-2 -right-3 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 text-[9px] font-extrabold text-white shadow-lg shadow-cyan-500/50 animate-bounce">
                <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 animate-ping" />
                <span className="relative z-10 font-mono">{activeKeys.length}</span>
              </span>
            )}
          </div>
          <span>{t('miniNavProgress')}</span>
        </button>

        <button
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-[10px] font-extrabold transition-all duration-200 cursor-pointer transform-gpu ${activeTab === 'files'
            ? 'text-purple-600 dark:text-purple-300 bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/30 dark:border-purple-500/40 shadow-sm scale-102'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
            }`}
          onClick={() => setActiveTab('files')}
          title={t('miniNavFiles')}
        >
          <div className="relative flex items-center justify-center">
            <Folder size={16} className={activeTab === 'files' ? 'text-purple-500 dark:text-purple-400' : ''} />
            {completedCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-purple-500 text-white text-[9px] font-extrabold px-1 rounded-full shadow-md">
                {completedCount}
              </span>
            )}
          </div>
          <span>{t('miniNavFiles')}</span>
        </button>

        <button
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-[10px] font-extrabold text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/30 active:scale-95 transition-all duration-200 cursor-pointer transform-gpu"
          onClick={handleOpenMainProgram}
          title={t('miniPopMainHint')}
        >
          <Maximize2 size={16} />
          <span>{t('miniNavMainApp')}</span>
        </button>
      </nav>

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
