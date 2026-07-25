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
  FileCode
} from 'lucide-react';
import { detectFormatFromUrl } from '../utils/formatDetector';
import { useTranslation } from '../i18n/LanguageContext';

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

  // Bottom Toast Banner State (Stage 3 feedback)
  const [toastMessage, setToastMessage] = useState(null);

  // Custom & Built-in Presets
  const [customPresets, setCustomPresets] = useState([]);

  const builtinPresets = useMemo(() => [
    {
      id: 'preset-speed',
      name: t('presetSpeedBoost') || '🚀 Speed Boost',
      options: { rateLimit: '10M', customArgs: '--no-mtime' }
    },
    {
      id: 'preset-subs',
      name: t('presetSubs') || '💬 Subtitles (Vi+En)',
      options: { writeSubs: true, embedSubs: true, subLangs: 'vi,en' }
    },
    {
      id: 'preset-bypass',
      name: t('presetBypass') || '🔐 Geo-Bypass & Cookies',
      options: { cookiesFromBrowser: 'chrome', customArgs: '--geo-bypass' }
    },
    {
      id: 'preset-cut-1m',
      name: t('presetCut') || '✂️ Cut First 1 Min',
      options: { downloadSections: '*00:00:00-00:01:00' }
    }
  ], [t]);

  // Load Presets & History on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('media_downloader_custom_presets');
      if (saved) {
        setCustomPresets(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load custom presets from localStorage', e);
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
      }).catch(() => {});
    }

    if (api && api.miniRequestHistory) {
      api.miniRequestHistory().then((hist) => {
        if (Array.isArray(hist)) {
          setHistory(hist);
        }
      }).catch(() => {});
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
      }).catch(() => {});
    }
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
        }).catch(() => {});
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
      const text = await navigator.clipboard.readText();
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

  const triggerAnalyze = async (overrideUrl = null) => {
    const rawUrl = (overrideUrl !== null ? overrideUrl : url).trim();
    if (!rawUrl) return;

    setIsAnalyzing(true);
    setAnalyzeError('');

    try {
      let queryToSend = rawUrl;
      const isDirectUrl = /^https?:\/\//i.test(rawUrl);
      if (!isDirectUrl) {
        queryToSend = `ytsearch20:${rawUrl}`;
      }

      const res = api ? await api.getVideoInfo(queryToSend) : null;
      if (res && res.success) {
        setMediaInfo(res);
        if (rawUrl.includes('soundcloud.com') && formatType !== 'audio') {
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
      const info = mediaInfo && mediaInfo.info ? mediaInfo.info : {};
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

      const isPlaylist = !!(mediaInfo && mediaInfo.isPlaylist && !mediaInfo.isSearch);
      const entries = (mediaInfo && mediaInfo.info && mediaInfo.info.entries) || [];
      const selectedEntries = isPlaylist && entries.length > 0
        ? entries.filter((_, idx) => playlistSelectedIndexes.includes(idx + 1))
        : (info.entries || null);

      const downloadOptions = {
        id,
        url: url.trim(),
        formatType,
        quality,
        videoQuality: quality,
        audioQuality: quality,
        destDir,
        isPlaylist,
        playlistTitle: isPlaylist ? info.title : null,
        playlistEntries: selectedEntries,
        playlistItems: isPlaylist && playlistSelectedIndexes.length > 0 ? playlistSelectedIndexes.join(',') : null,
        mediaTitle: info.title || 'media',
        uploader: info.uploader || '',
        thumbnail: info.thumbnail || '',
        duration: info.duration || null,
        embedMetadata: true,
        embedThumbnail: formatType === 'audio',
        ...presetOptions
      };

      await api.miniStartDownload(downloadOptions);

      // STAGE 3: Reset back to Stage 1 immediately & show toast notification
      setUrl('');
      setMediaInfo(null);
      setAnalyzeError('');
      setDownloaderStage('stage1');

      const countMsg = isPlaylist ? ` (${selectedEntries.length} tracks)` : '';
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

  // History Save & Sync Handler
  const saveHistory = (newHistory) => {
    setHistory(newHistory);
    localStorage.setItem('media_downloader_history', JSON.stringify(newHistory));
    if (api && api.syncPushHistory) {
      api.syncPushHistory(newHistory);
    }
  };

  const handleDeleteHistoryItem = (id) => {
    const updated = history.filter((item) => item.id !== id);
    saveHistory(updated);
    showToastBanner(t('deletedFileAlert') || 'Deleted item from history');
  };

  const handleClearAllHistory = () => {
    if (confirm(t('confirmClearHistory') || 'Are you sure you want to clear all history?')) {
      saveHistory([]);
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
    let result = [...history];

    if (filesSearch.trim()) {
      const term = filesSearch.toLowerCase();
      result = result.filter(
        (item) =>
          (item.title && item.title.toLowerCase().includes(term)) ||
          (item.mediaTitle && item.mediaTitle.toLowerCase().includes(term)) ||
          (item.uploader && item.uploader.toLowerCase().includes(term)) ||
          (item.filePath && item.filePath.toLowerCase().includes(term)) ||
          (item.folderPath && item.folderPath.toLowerCase().includes(term))
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
    <div className="mini-app-container">
      {/* Top Header / Titlebar */}
      <header className="mini-header">
        <div className="mini-header-brand">
          <div className="mini-logo-icon">
            <Sparkles size={16} className="text-pink-500 animate-pulse" />
          </div>
          <span className="mini-header-title">YT Downloader</span>
        </div>
        <div className="mini-header-actions">
          <button
            className="mini-btn-icon close-btn"
            onClick={handleCloseMiniWindow}
            title={t('close') || 'Close'}
          >
            <X size={13} />
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="mini-content-body">
        {/* ==================== TAB 1: DOWNLOADER ==================== */}
        {activeTab === 'downloader' && (
          <div className="mini-tab-panel">
            {downloaderStage === 'stage1' ? (
              /* ===== STAGE 1: App Branding & Google-Style Search Bar ===== */
              <div className="mini-stage-1-container">
                <div className="mini-brand-hero">
                  <div className="mini-hero-badge">
                    <Sparkles size={20} className="text-pink-500" />
                  </div>
                  <h2 className="mini-hero-title">{t('appName')}</h2>
                  <p className="mini-hero-subtitle">{t('miniHeroSubtitle')}</p>
                </div>

                {/* Google-Style Search Bar */}
                <div className="google-mini-search">
                  <Search size={16} className="google-search-icon" />
                  <input
                    type="text"
                    className="google-search-input"
                    placeholder={t('miniSearchOrPaste')}
                    value={url}
                    onChange={handleUrlChange}
                    onKeyDown={(e) => e.key === 'Enter' && triggerAnalyze()}
                    spellCheck={false}
                    autoFocus
                  />
                  <button
                    className="google-paste-btn"
                    onClick={handlePasteClipboard}
                    title={t('pasteClipboard')}
                  >
                    <Clipboard size={14} />
                    <span>{t('miniPaste')}</span>
                  </button>
                </div>

                {detectedPlatform && (
                  <div className="mini-auto-detect-tag center-tag">
                    <Sparkles size={12} />
                    <span>
                      {t('detectedPlatform', { platform: detectedPlatform.platform || 'Media' })} ({detectedPlatform.formatType.toUpperCase()})
                    </span>
                  </div>
                )}

                {/* Quick Analyze Button */}
                <button
                  className="google-analyze-btn"
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
                  <div className="mini-error-banner mt-2">
                    <AlertCircle size={14} />
                    <span>{analyzeError}</span>
                  </div>
                )}
              </div>
            ) : (
              /* ===== STAGE 2: Media Details, Playlist Manager, Format/Quality & Download ===== */
              <div className="mini-stage-2-container">
                {/* Back to search button */}
                <div className="mini-stage-nav">
                  <button
                    className="mini-back-btn"
                    onClick={() => setDownloaderStage('stage1')}
                  >
                    <ArrowLeft size={13} />
                    <span>{t('miniBackSearch')}</span>
                  </button>
                </div>

                {/* Media Thumbnail & Title Card */}
                {mediaInfo && mediaInfo.info && (
                  <div className="mini-card mini-media-info-card shadow-lg">
                    <div className="mini-media-row">
                      {mediaInfo.info.thumbnail ? (
                        <img
                          src={mediaInfo.info.thumbnail}
                          alt="Thumbnail"
                          className="mini-media-thumb"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="mini-media-thumb-placeholder">
                          <Film size={20} />
                        </div>
                      )}
                      <div className="mini-media-details">
                        <h4 className="mini-media-title">{mediaInfo.info.title || 'Untitled Media'}</h4>
                        <p className="mini-media-uploader">{mediaInfo.info.uploader || 'Unknown Artist'}</p>
                        {mediaInfo.isPlaylist && mediaInfo.info.entries && (
                          <span className="mini-badge-playlist">
                            🎵 {t('playlistTitle')}: {mediaInfo.info.entries.length} {t('playlistItemCount', { count: '' }).trim()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Playlist Inspector & Track Selection Card (Shown if playlist) */}
                {mediaInfo && mediaInfo.isPlaylist && mediaInfo.info && mediaInfo.info.entries && (
                  <div className="mini-card mini-playlist-card">
                    <div className="mini-playlist-header">
                      <div className="mini-playlist-title-wrap">
                        <ListPlus size={14} className="text-purple-400" />
                        <span className="mini-playlist-title">{t('miniSelectPlaylistTracks')}</span>
                      </div>
                      <span className="mini-playlist-count">
                        {playlistSelectedIndexes.length} / {mediaInfo.info.entries.length}
                      </span>
                    </div>

                    <div className="mini-playlist-actions">
                      <button
                        type="button"
                        className="mini-playlist-btn-sm"
                        onClick={handleSelectAllPlaylist}
                      >
                        {t('selectAll')}
                      </button>
                      <button
                        type="button"
                        className="mini-playlist-btn-sm"
                        onClick={handleDeselectAllPlaylist}
                      >
                        {t('deselectAll')}
                      </button>
                    </div>

                    <div className="mini-playlist-track-list">
                      {mediaInfo.info.entries.map((track, idx) => {
                        const trackNum = idx + 1;
                        const isSelected = playlistSelectedIndexes.includes(trackNum);
                        return (
                          <div
                            key={track.id || idx}
                            className={`mini-playlist-track-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleTogglePlaylistItem(trackNum)}
                          >
                            <input
                              type="checkbox"
                              className="mini-track-checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                            />
                            <span className="mini-track-num">{trackNum}.</span>
                            <span className="mini-track-name">
                              {track.title || `Track ${trackNum}`}
                            </span>
                            {track.duration && (
                              <span className="mini-track-duration">
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
                <div className="mini-card mini-format-card">
                  <div className="mini-card-header">
                    <span className="mini-card-label">{t('miniSelectFormatLabel')}</span>
                  </div>
                  <div className="mini-pill-selector">
                    <button
                      className={`mini-pill-btn ${formatType === 'video' ? 'active' : ''}`}
                      onClick={() => {
                        setFormatType('video');
                        setQuality('best');
                      }}
                    >
                      <Film size={13} />
                      <span>{t('formatVideo')}</span>
                    </button>
                    <button
                      className={`mini-pill-btn ${formatType === 'audio' ? 'active' : ''}`}
                      onClick={() => {
                        setFormatType('audio');
                        setQuality('mp3-192');
                      }}
                    >
                      <Music size={13} />
                      <span>{t('formatAudio')}</span>
                    </button>
                    <button
                      className={`mini-pill-btn ${formatType === 'thumbnail' ? 'active' : ''}`}
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
                  <div className="mini-quality-row mt-2">
                    <span className="mini-label">{t('qualityLabel')}:</span>
                    <select
                      className="mini-select"
                      value={quality}
                      onChange={(e) => setQuality(e.target.value)}
                    >
                      {formatType === 'video' && (
                        <>
                          <option value="best">{t('qualityBest')}</option>
                          <option value="1080p">1080p Full HD</option>
                          <option value="720p">720p HD</option>
                          <option value="480p">480p SD</option>
                        </>
                      )}
                      {formatType === 'audio' && (
                        <>
                          <option value="mp3-320">{t('audioMp3_320')}</option>
                          <option value="mp3-192">{t('audioMp3_256')}</option>
                          <option value="m4a">{t('audioM4a')}</option>
                          <option value="flac">{t('audioFlac')}</option>
                        </>
                      )}
                      {formatType === 'thumbnail' && (
                        <>
                          <option value="best">{t('qualityBest')}</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* Advance Preset Selector */}
                <div className="mini-card mini-preset-card">
                  <div className="mini-preset-header">
                    <div className="mini-preset-title">
                      <SlidersHorizontal size={13} className="text-purple-400" />
                      <span>{t('presetsSectionTitle')}</span>
                    </div>
                    <button
                      className="mini-edit-presets-link"
                      onClick={handleOpenMainProgram}
                      title={t('miniOpenMainPresetHint')}
                    >
                      <span>{t('miniEditInMain')}</span>
                      <ExternalLink size={11} />
                    </button>
                  </div>

                  <select
                    className="mini-select mini-preset-select"
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
                  </select>
                </div>

                {/* Primary Download Button */}
                <button
                  className="mini-btn-primary full-width-download"
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
          <div className="mini-tab-panel">
            {/* Header Toolbar: Threads, Remain, & Manage Controls */}
            <div className="mini-panel-title-bar mini-progress-header-bar">
              <div className="mini-progress-meta-badges">
                <div className="mini-badge-pill mini-badge-thread" title={t('miniThreads', { count: activeKeys.length })}>
                  <Cpu size={13} className="text-cyan-400" />
                  <span className="mini-badge-val">{activeKeys.length}</span>
                </div>
                <div className="mini-badge-pill mini-badge-remain" title={t('miniRemain', { count: totalRemainItems })}>
                  <Layers size={13} className="text-purple-400" />
                  <span className="mini-badge-val">{totalRemainItems}</span>
                </div>
              </div>

              <div className="mini-progress-global-actions">
                {activeKeys.length > 0 && (
                  <>
                    <button
                      className="mini-icon-btn mini-btn-pause-all"
                      onClick={handlePauseAll}
                      title={t('miniPauseAll')}
                    >
                      <Pause size={13} />
                    </button>
                    <button
                      className="mini-icon-btn mini-btn-cancel-all"
                      onClick={handleCancelAll}
                      title={t('miniCancelAll')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
                <button
                  className="mini-icon-btn mini-btn-manage-main"
                  onClick={handleOpenMainProgram}
                  title={t('miniOpenMainQueueHint')}
                >
                  <Maximize2 size={13} />
                </button>
              </div>
            </div>

            {activeKeys.length === 0 ? (
              <div className="mini-empty-state">
                <Loader2 size={32} className="opacity-20 mb-2" />
                <span>{t('miniNoActiveDownloads')}</span>
              </div>
            ) : (
              <div className="mini-active-list">
                {activeKeys.map((id) => {
                  const dl = activeDownloads[id];
                  const pct = Math.min(100, Math.max(0, dl.percent || 0));
                  const isAudio = dl.formatType === 'audio';
                  const isThumb = dl.formatType === 'thumbnail';
                  const isPlaylist = !!dl.isPlaylist;

                  return (
                    <div key={id} className="mini-card mini-active-item shadow-md">
                      {/* Top Item Row: Thumbnail + Item Meta + Quick Action Buttons */}
                      <div className="mini-active-top-row">
                        <div className="mini-active-thumb-wrap">
                          {dl.thumbnail ? (
                            <img
                              src={dl.thumbnail}
                              alt="Item Thumbnail"
                              className="mini-active-thumb"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="mini-active-thumb-fallback">
                              {isAudio ? (
                                <Music size={16} className="text-purple-400" />
                              ) : isThumb ? (
                                <ImageIcon size={16} className="text-blue-400" />
                              ) : (
                                <Film size={16} className="text-pink-400" />
                              )}
                            </div>
                          )}
                          {isPlaylist && (
                            <span className="mini-thumb-playlist-badge">
                              🎵 {dl.currentItem || 1}/{dl.totalItems || 1}
                            </span>
                          )}
                        </div>

                        <div className="mini-active-info">
                          <h4 className="mini-active-item-title" title={dl.title || dl.mediaTitle}>
                            {dl.title || dl.mediaTitle || t('miniDownloadingMedia')}
                          </h4>

                          <div className="mini-active-item-sub">
                            {dl.uploader && <span className="mini-active-uploader">{dl.uploader}</span>}
                            <span className="mini-active-format-pill">
                              {dl.formatType ? dl.formatType.toUpperCase() : 'MEDIA'}
                            </span>
                          </div>

                          {/* Dedicated Playlist Track Progress detail */}
                          {isPlaylist && (
                            <div className="mini-playlist-track-banner">
                              <span className="mini-playlist-current-track">
                                {t('miniTrackProgress', { current: dl.currentItem || 1, total: dl.totalItems || 1 })}:{' '}
                                <strong>{dl.currentTrackTitle || dl.title || t('miniDownloadingMedia')}</strong>
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Individual Item Controls */}
                        <div className="mini-active-item-actions">
                          <button
                            className="mini-item-action-btn pause"
                            onClick={() => handlePauseItem(id)}
                            title="Pause Download"
                          >
                            <Pause size={13} />
                          </button>
                          <button
                            className="mini-item-action-btn cancel"
                            onClick={() => handleCancelItem(id)}
                            title="Cancel Download"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Animated Progress Bar */}
                      <div className="mini-progress-bar-bg">
                        <div
                          className="mini-progress-bar-fill animate-shimmer"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {/* Progress Stats */}
                      <div className="mini-active-stats">
                        <span className="mini-stat-pct">{pct.toFixed(1)}%</span>
                        <span className="mini-stat-speed">{dl.speed || '—'}</span>
                        <span className="mini-stat-eta">ETA {dl.eta || '—'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 3: DOWNLOADED FILE ==================== */}
        {activeTab === 'files' && (
          <div className="mini-tab-panel">
            {/* Header Toolbar */}
            <div className="mini-panel-title-bar mini-files-header-bar">
              <div className="mini-progress-meta-badges">
                <span className="mini-badge-thread" style={{ borderColor: 'rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                  <FolderCheck size={12} />
                  <span>{t('downloadedTitle') || 'Downloaded'} ({filteredFiles.length})</span>
                </span>
              </div>

              {history.length > 0 && (
                <button
                  className="mini-manage-btn cancel-all-btn"
                  onClick={handleClearAllHistory}
                  title={t('clearHistoryBtn') || 'Clear History'}
                >
                  <Trash2 size={12} />
                  <span>{t('clearHistoryBtn') || 'Clear'}</span>
                </button>
              )}
            </div>

            {/* Search, Filter & Sort Bar */}
            <div className="mini-card mini-files-filter-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <div className="mini-search-box" style={{ flex: 1 }}>
                  <Search size={13} className="mini-search-icon" />
                  <input
                    type="text"
                    className="mini-search-input"
                    placeholder={t('searchHistoryPlaceholder') || 'Search files...'}
                    value={filesSearch}
                    onChange={(e) => setFilesSearch(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ArrowUpDown size={12} className="text-gray-400" />
                  <select
                    className="mini-select mini-filter-select"
                    value={filesSort}
                    onChange={(e) => setFilesSort(e.target.value)}
                    style={{ fontSize: '11px', padding: '3px 6px' }}
                  >
                    <option value="newest">{t('sortNewest') || 'Newest'}</option>
                    <option value="oldest">{t('sortOldest') || 'Oldest'}</option>
                    <option value="title-asc">{t('sortTitleAsc') || 'Title A-Z'}</option>
                    <option value="title-desc">{t('sortTitleDesc') || 'Title Z-A'}</option>
                  </select>
                </div>
              </div>

              {/* Type Filter Pills */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
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
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      border: filesFilter === f.id ? '1px solid #8b5cf6' : '1px solid var(--border-color)',
                      background: filesFilter === f.id ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                      color: filesFilter === f.id ? '#fff' : '#94a3b8',
                      cursor: 'pointer'
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Files List */}
            <div className="mini-files-list">
              {filteredFiles.length === 0 ? (
                <div className="mini-empty-state">
                  <FolderOpen size={32} className="opacity-30 mb-2" />
                  <span>{t('noHistory') || 'No downloaded history files'}</span>
                </div>
              ) : (
                filteredFiles.map((item, idx) => {
                  const title = item.title || item.mediaTitle || 'Untitled Media';
                  const folderPath = item.folderPath || item.destDir || item.filePath;
                  const filePath = item.filePath || folderPath;
                  const isExpanded = expandedFolders[item.id];
                  const displayThumb = item.thumbnail || (item.playlistEntries && item.playlistEntries[0] ? item.playlistEntries[0].thumbnail : '');

                  return (
                    <div
                      key={item.id || idx}
                      className="mini-card mini-file-item-card"
                      draggable={!item.isCancelled}
                      onDragStart={(e) => handleDragStart(e, item)}
                      style={{
                        background: item.isCancelled ? 'rgba(239, 68, 68, 0.08)' : 'rgba(15, 23, 42, 0.65)',
                        border: item.isCancelled ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '10px',
                        marginBottom: '8px',
                        cursor: 'grab'
                      }}
                      title={t('dragHint') || 'Drag to export file'}
                    >
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
                        {/* Left: Drag handle + Thumbnail / Icon */}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1, minWidth: 0 }}>
                          <div style={{ color: '#475569', cursor: 'grab', display: 'flex', flexShrink: 0 }}>
                            <GripVertical size={15} />
                          </div>

                          <div style={{ width: '56px', height: '36px', borderRadius: '6px', overflow: 'hidden', background: '#000', position: 'relative', flexShrink: 0 }}>
                            {displayThumb ? (
                              <img src={displayThumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)' }}>
                                {item.formatType === 'audio' ? <Music size={16} className="text-purple-400" /> : <Film size={16} className="text-pink-400" />}
                              </div>
                            )}
                            <span style={{ position: 'absolute', bottom: '1px', right: '1px', background: 'rgba(0,0,0,0.85)', color: '#fff', fontSize: '8px', fontWeight: '700', padding: '1px 3px', borderRadius: '2px' }}>
                              {item.isPlaylist ? 'PL' : (item.formatType ? item.formatType.toUpperCase() : 'FILE')}
                            </span>
                          </div>

                          {/* Meta */}
                          <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                            <h4 style={{ fontSize: '12px', fontWeight: '600', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {title}
                            </h4>
                            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <span>{item.uploader || 'Media'}</span>
                              {item.downloadedAt && <span>• {formatDate(item.downloadedAt)}</span>}
                              {item.isPlaylist && (
                                <span style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', padding: '0 5px', borderRadius: '8px', fontSize: '9px', fontWeight: '600' }}>
                                  📁 {item.entriesCount || (item.playlistEntries ? item.playlistEntries.length : 1)} tracks
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '3px', alignItems: 'center', flexShrink: 0 }}>
                          <button
                            className="mini-action-btn-sm"
                            title={t('openFolder') || 'Open Folder'}
                            onClick={() => handleOpenFolder(folderPath)}
                          >
                            <FolderOpen size={12} />
                          </button>

                          {!item.isPlaylist && (
                            <button
                              className="mini-action-btn-sm"
                              title={t('openFile') || 'Open File'}
                              onClick={() => handleOpenFile(filePath)}
                            >
                              <Play size={12} />
                            </button>
                          )}

                          <button
                            className="mini-action-btn-sm"
                            title={t('copyPath') || 'Copy Path'}
                            onClick={() => handleCopyFilePath(filePath || folderPath)}
                          >
                            <Copy size={12} />
                          </button>

                          <button
                            className="mini-action-btn-sm danger"
                            title={t('deleteItem') || 'Delete Item'}
                            onClick={() => handleDeleteHistoryItem(item.id)}
                            style={{ color: '#ef4444' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Playlist Drawer Toggle Button */}
                      {item.isPlaylist && (
                        <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => toggleExpandFolder(item.id)}
                            style={{ background: 'transparent', border: 'none', color: '#c084fc', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                          >
                            <span>{isExpanded ? (t('collapseBtn') || 'Collapse') : (t('detailBtn') || 'Tracks')}</span>
                            {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                          </button>
                        </div>
                      )}

                      {/* Expandable Playlist Drawer */}
                      {item.isPlaylist && isExpanded && (
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                          <div style={{ fontSize: '11px', fontWeight: '600', color: '#c084fc', marginBottom: '6px' }}>
                            {t('playlistTitle') || 'Playlist Tracks'}:
                          </div>

                          {item.playlistEntries && item.playlistEntries.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '180px', overflowY: 'auto', background: '#090d16', padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                              {item.playlistEntries.map((entry, trkIdx) => {
                                const trackFilePath = item.downloadedFiles && item.downloadedFiles[trkIdx] ? item.downloadedFiles[trkIdx] : null;

                                return (
                                  <div
                                    key={trkIdx}
                                    draggable
                                    onDragStart={(e) => handleTrackDragStart(e, trackFilePath, item.folderPath)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      padding: '4px 6px',
                                      borderRadius: '4px',
                                      background: 'rgba(255,255,255,0.03)',
                                      border: '1px solid rgba(255,255,255,0.04)',
                                      cursor: 'grab'
                                    }}
                                    title={t('dragHint') || 'Drag to export file'}
                                  >
                                    <div style={{ color: '#475569', cursor: 'grab', display: 'flex', flexShrink: 0 }}>
                                      <GripVertical size={13} />
                                    </div>

                                    <div style={{ width: '24px', height: '24px', borderRadius: '4px', overflow: 'hidden', background: '#1e293b', flexShrink: 0 }}>
                                      <img src={entry.thumbnail || item.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>

                                    <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        #{trkIdx + 1}. {entry.title || 'Track'}
                                      </div>
                                    </div>

                                    <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace', flexShrink: 0 }}>
                                      {formatDuration(entry.duration)}
                                    </div>

                                    <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                                      <button
                                        className="mini-action-btn-sm"
                                        style={{ padding: '2px 4px' }}
                                        onClick={() => (trackFilePath ? handleOpenFile(trackFilePath) : handleOpenFolder(item.folderPath))}
                                        title={t('openFile') || 'Open File'}
                                      >
                                        <Play size={10} />
                                      </button>
                                      <button
                                        className="mini-action-btn-sm"
                                        style={{ padding: '2px 4px' }}
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
                            <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                              Folder: <code style={{ color: '#a7f3d0' }}>{item.folderPath}</code>
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

      {/* STAGE 3 Toast Notification Banner (under taskbar banner) */}
      {toastMessage && (
        <div className="mini-toast-banner animate-slide-up">
          <div className="mini-toast-content">
            <CheckCircle2 size={15} className="text-green-400 flex-shrink-0" />
            <span className="mini-toast-text">{toastMessage}</span>
          </div>
          <button
            className="mini-toast-action-btn"
            onClick={() => setActiveTab('progress')}
          >
            {t('miniNavProgress')}
          </button>
        </div>
      )}

      {/* ==================== UNDER TABS (BOTTOM NAVIGATION BAR) ==================== */}
      <nav className="mini-bottom-nav">
        {/* Animated Nav-Under Progress Bar */}
        {activeKeys.length > 0 && (
          <div className="mini-nav-under-progress" title={`Progress: ${overallAvgPercent.toFixed(1)}%`}>
            <div
              className="mini-nav-under-fill animate-shimmer"
              style={{ width: `${overallAvgPercent}%` }}
            />
            <div className="mini-nav-under-glow" />
          </div>
        )}
        <button
          className={`mini-bottom-tab ${activeTab === 'downloader' ? 'active' : ''}`}
          onClick={() => setActiveTab('downloader')}
          title={t('navDownloader')}
        >
          <Download size={16} />
          <span>{t('navDownloader')}</span>
        </button>

        <button
          className={`mini-bottom-tab ${activeTab === 'progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('progress')}
          title={t('miniNavProgress')}
        >
          <div className="mini-tab-icon-wrap">
            <Loader2 size={16} className={activeKeys.length > 0 ? 'animate-spin text-purple-400' : ''} />
            {activeKeys.length > 0 && (
              <span className="mini-bottom-badge">{activeKeys.length}</span>
            )}
          </div>
          <span>{t('miniNavProgress')}</span>
        </button>

        <button
          className={`mini-bottom-tab ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
          title={t('miniNavFiles')}
        >
          <div className="mini-tab-icon-wrap">
            <Folder size={16} />
            {completedCount > 0 && (
              <span className="mini-bottom-badge">{completedCount}</span>
            )}
          </div>
          <span>{t('miniNavFiles')}</span>
        </button>

        {/* 4. Pop về main program Button */}
        <button
          className="mini-bottom-tab pop-main-btn"
          onClick={handleOpenMainProgram}
          title={t('miniPopMainHint')}
        >
          <Maximize2 size={16} />
          <span>{t('miniNavMainApp')}</span>
        </button>
      </nav>
    </div>
  );
}
