import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Link as LinkIcon,
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
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Maximize2,
  ListPlus,
  Pause,
  Play,
  Trash2,
  Layers,
  Activity,
  GripVertical,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Zap,
  Globe,
  Sun,
  Moon,
  Monitor,
  RefreshCw,
  CheckSquare,
  Square
} from 'lucide-react';
import { detectFormatFromUrl, isAutoDetectableUrl, isPlaylistWithSingleVideoUrl, stripPlaylistParam } from './utils/formatDetector';
import { getResolutionOptions, getAudioQualityOptions, buildDownloadOptions } from './utils/downloadHelper';
import { t, getLang } from './utils/i18n';
import Listbox from './Listbox';
import PlaylistChoiceModal from './PlaylistChoiceModal';
import APP_ICON from './assets/appIcon';

const API_BASE = 'http://127.0.0.1:38472';

export default function Popup() {
  // Navigation Tab State: 'downloader' | 'progress' | 'files'
  const [activeTab, setActiveTab] = useState('downloader');

  // Connection State
  const [isAppOnline, setIsAppOnline] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Theme State: 'system' | 'dark' | 'light'
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('ext_theme_mode') || 'system';
  });
  const [systemIsDark, setSystemIsDark] = useState(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Active Tab Info from Chrome
  const [activeTabInfo, setActiveTabInfo] = useState(null);

  // Downloader Stage State: 'stage1' (Search/Paste) | 'stage2' (Analyzed details)
  const [downloaderStage, setDownloaderStage] = useState('stage1');

  // Input & Auto Detect State
  const [url, setUrl] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState(null);
  const [formatType, setFormatType] = useState('video'); // 'video' | 'audio' | 'thumbnail'
  const [quality, setQuality] = useState('best');
  const [selectedPresetId, setSelectedPresetId] = useState('');

  // Analysis & Download State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const [mediaInfo, setMediaInfo] = useState(null);
  const [playlistSelectedIndexes, setPlaylistSelectedIndexes] = useState([]);

  // Active Downloads & Files History
  const [activeDownloads, setActiveDownloads] = useState([]);
  const [history, setHistory] = useState([]);
  const [filesSearch, setFilesSearch] = useState('');
  const [filesFilter, setFilesFilter] = useState('all');
  const [filesSort, setFilesSort] = useState('newest');
  const [expandedFolders, setExpandedFolders] = useState({});

  // Playlist Choice Modal State
  const [pendingPlaylistUrl, setPendingPlaylistUrl] = useState(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState(null);

  // Custom Presets
  const [customPresets, setCustomPresets] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('media_downloader_custom_presets');
      if (saved) setCustomPresets(JSON.parse(saved));
    } catch (e) {}
  }, []);

  // Built-in Presets
  const builtinPresets = useMemo(() => [
    {
      id: 'preset-speed',
      name: '🚀 Speed Boost (10M Limit)',
      options: { rateLimit: '10M', customArgs: '--no-mtime' }
    },
    {
      id: 'preset-bypass',
      name: '🔐 Geo-Bypass',
      options: { customArgs: '--geo-bypass' }
    },
    {
      id: 'preset-cut-1m',
      name: '✂️ Cắt 1 Phút Đầu',
      options: { downloadSections: '*00:00:00-00:01:00' }
    }
  ], []);

  // Theme Listener & Resolution
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setSystemIsDark(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const isDarkMode = themeMode === 'system' ? systemIsDark : themeMode === 'dark';

  const toggleThemeMode = () => {
    let next = 'system';
    if (themeMode === 'system') next = 'dark';
    else if (themeMode === 'dark') next = 'light';
    else if (themeMode === 'light') next = 'system';
    setThemeMode(next);
    localStorage.setItem('ext_theme_mode', next);
  };

  // Check connection to Desktop App
  const checkConnection = async () => {
    setCheckingStatus(true);
    try {
      const res = await fetch(`${API_BASE}/api/status`, { method: 'GET' });
      if (res.ok) {
        setIsAppOnline(true);
      } else {
        setIsAppOnline(false);
      }
    } catch (e) {
      setIsAppOnline(false);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Initial tab detection & status check
  useEffect(() => {
    checkConnection();

    // Query active browser tab
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      const queryTab = () => {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
          if (!tabs || !tabs.length) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs2) => {
              processTab(tabs2 && tabs2[0]);
            });
          } else {
            processTab(tabs[0]);
          }
        });
      };

      const processTab = (tab) => {
        if (tab && tab.url) {
          setActiveTabInfo(tab);
          applyAutoFormatRule(tab.url);
          if (isValidMediaUrl(tab.url)) {
            setUrl(tab.url);
          }
        }
      };

      queryTab();
    }
  }, []);

  // Real-time polling for downloads & history when online
  useEffect(() => {
    let interval = null;
    if (isAppOnline) {
      fetchProgressAndHistory();
      interval = setInterval(fetchProgressAndHistory, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAppOnline]);

  // Playlist track default selection when mediaInfo changes
  useEffect(() => {
    if (mediaInfo && mediaInfo.isPlaylist && mediaInfo.info && mediaInfo.info.entries) {
      const all = mediaInfo.info.entries.map((_, idx) => idx + 1);
      setPlaylistSelectedIndexes(all);
    } else {
      setPlaylistSelectedIndexes([]);
    }
  }, [mediaInfo]);

  const fetchProgressAndHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/progress`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setActiveDownloads(data.activeDownloads || []);
        setHistory(data.history || []);
      }
    } catch (e) { }
  };

  const handleOpenDesktopApp = async () => {
    try {
      await fetch(`${API_BASE}/api/open-app`, { method: 'POST' });
    } catch (e) { }
  };

  const isValidMediaUrl = (targetUrl) => {
    if (!targetUrl || typeof targetUrl !== 'string') return false;
    const lower = targetUrl.toLowerCase();
    if (
      lower.startsWith('chrome://') ||
      lower.startsWith('chrome-extension://') ||
      lower.startsWith('edge://') ||
      lower.startsWith('about:') ||
      lower.startsWith('file://')
    ) {
      return false;
    }
    return lower.startsWith('http://') || lower.startsWith('https://');
  };

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
          console.warn('navigator.clipboard.readText failed, trying DOM fallback:', e);
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
        if (/^https?:\/\//i.test(clean) || isValidMediaUrl(clean)) {
          triggerAnalyze(clean);
        }
      }
    } catch (e) {
      console.error('Clipboard read error:', e);
    }
  };

  const handleDownloadActiveTab = () => {
    if (activeTabInfo && activeTabInfo.url && isValidMediaUrl(activeTabInfo.url) && isAutoDetectableUrl(activeTabInfo.url)) {
      setUrl(activeTabInfo.url);
      applyAutoFormatRule(activeTabInfo.url);
      triggerAnalyze(activeTabInfo.url);
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
      if (!isValidMediaUrl(urlToAnalyze)) {
        queryToSend = `ytsearch20:${urlToAnalyze}`;
      }

      const res = await fetch(`${API_BASE}/api/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: queryToSend })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setMediaInfo(data);
        if (urlToAnalyze.includes('soundcloud.com') && formatType !== 'audio') {
          setFormatType('audio');
          setQuality('mp3-192');
        }
        setDownloaderStage('stage2');
      } else {
        setAnalyzeError(data.error || 'Không thể trích xuất thông tin từ đường dẫn.');
      }
    } catch (err) {
      setAnalyzeError(err.message || 'Chưa kết nối tới ứng dụng Desktop.');
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
    if (!url.trim() || !isAppOnline) return;

    const targetTitle = mediaInfo && mediaInfo.info && mediaInfo.info.title ? mediaInfo.info.title : 'Media';

    try {
      const id = `ext_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

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
        mediaInfo,
        playlistSelectedIndexes,
        advancedOptions: {
          ...presetOptions
        }
      });

      const res = await fetch(`${API_BASE}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(downloadOptions)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setUrl('');
        setMediaInfo(null);
        setAnalyzeError('');
        setDownloaderStage('stage1');

        const isPlaylist = !!(mediaInfo && mediaInfo.isPlaylist && !mediaInfo.isSearch);
        const countMsg = isPlaylist ? ` (${downloadOptions.playlistEntries ? downloadOptions.playlistEntries.length : 0} bài)` : '';
        showToastBanner(`Đã thêm "${targetTitle.substring(0, 20)}${targetTitle.length > 20 ? '...' : ''}"${countMsg} vào hàng đợi`);
        fetchProgressAndHistory();
      } else {
        setAnalyzeError(data.error || 'Khởi tạo tải xuống thất bại.');
      }
    } catch (err) {
      setAnalyzeError(err.message || 'Lỗi khi gửi yêu cầu tải xuống.');
    }
  };

  const showToastBanner = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handlePauseItem = async (id) => {
    try {
      await fetch(`${API_BASE}/api/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'pause' })
      });
      fetchProgressAndHistory();
    } catch (e) { }
  };

  const handleCancelItem = async (id) => {
    try {
      await fetch(`${API_BASE}/api/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'cancel' })
      });
      fetchProgressAndHistory();
    } catch (e) { }
  };

  const handlePauseAll = () => {
    activeDownloads.forEach((item) => handlePauseItem(item.id));
  };

  const handleCancelAll = () => {
    activeDownloads.forEach((item) => handleCancelItem(item.id));
  };

  const toggleExpandFolder = (id) => {
    setExpandedFolders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // FILE MANAGEMENT & DRAG HANDLERS
  const handleOpenFile = async (filePath) => {
    if (!filePath) return;
    try {
      await fetch(`${API_BASE}/api/file-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'openFile', filePath })
      });
    } catch (e) { }
  };

  const handleOpenFolder = async (folderPath) => {
    if (!folderPath) return;
    try {
      await fetch(`${API_BASE}/api/file-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'openFolder', filePath: folderPath })
      });
    } catch (e) { }
  };

  const handleCopyFilePath = async (filePath) => {
    if (!filePath) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(filePath);
      }
      await fetch(`${API_BASE}/api/file-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'copyPath', filePath })
      });
      showToastBanner('Đã sao chép đường dẫn tệp vào clipboard');
    } catch (e) { }
  };

  const handleDeleteHistoryItem = async (id, filePath) => {
    try {
      setHistory((prev) => prev.filter((item) => item.id !== id));
      await fetch(`${API_BASE}/api/file-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteHistory', id, filePath })
      });
      showToastBanner('Đã xóa mục khỏi lịch sử');
    } catch (e) { }
  };

  const handleClearAllHistory = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử tệp đã tải?')) {
      setHistory([]);
      try {
        await fetch(`${API_BASE}/api/file-action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'clearHistory' })
        });
        showToastBanner('Đã xóa toàn bộ lịch sử');
      } catch (e) { }
    }
  };

  const handleDragStart = (e, item) => {
    const targetPath = item.filePath || item.folderPath || '';
    if (targetPath) {
      const fileUrl = `file:///${targetPath.replace(/\\/g, '/')}`;
      const fileName = targetPath.split(/[/\\]/).pop() || 'file';
      e.dataTransfer.setData('DownloadURL', `application/octet-stream:${fileName}:${fileUrl}`);
      e.dataTransfer.setData('text/plain', targetPath);
      e.dataTransfer.setData('text/uri-list', fileUrl);
      fetch(`${API_BASE}/api/file-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'startDrag', filePath: targetPath })
      }).catch(() => { });
    }
  };

  const handleTrackDragStart = (e, trackFilePath, fallbackFolderPath) => {
    e.stopPropagation();
    const targetPath = trackFilePath || fallbackFolderPath || '';
    if (targetPath) {
      const fileUrl = `file:///${targetPath.replace(/\\/g, '/')}`;
      const fileName = targetPath.split(/[/\\]/).pop() || 'file';
      e.dataTransfer.setData('DownloadURL', `application/octet-stream:${fileName}:${fileUrl}`);
      e.dataTransfer.setData('text/plain', targetPath);
      e.dataTransfer.setData('text/uri-list', fileUrl);
      fetch(`${API_BASE}/api/file-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'startDrag', filePath: targetPath })
      }).catch(() => { });
    }
  };

  // Progress stats calculation
  const activeKeysCount = activeDownloads.length;
  const completedCount = history.filter((d) => !d.isCancelled).length;

  const totalRemainItems = activeDownloads.reduce((acc, item) => {
    if (!item) return acc;
    if (item.percent >= 100) return acc;
    const total = item.totalItems || 1;
    const current = item.currentItem || 1;
    let remaining = Math.max(1, total - current + 1);
    if (item.percent > 99) remaining = Math.max(0, remaining - 1);
    return acc + remaining;
  }, 0);

  const overallAvgPercent = activeDownloads.length > 0
    ? activeDownloads.reduce((acc, dl) => acc + (dl.percent || 0), 0) / activeDownloads.length
    : 0;

  // Filtered files calculation
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
      return timeB - timeA;
    });

    return result;
  }, [history, filesSearch, filesFilter, filesSort]);

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

  return (
    <div
      data-theme={isDarkMode ? 'dark' : 'light'}
      className={`${isDarkMode ? 'dark' : ''} w-[380px] h-[560px] flex flex-col font-sans select-none overflow-hidden relative transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
        }`}
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(236,72,153,0.10)_0%,transparent_50%),radial-gradient(circle_at_85%_85%,rgba(59,130,246,0.10)_0%,transparent_50%)] dark:bg-[radial-gradient(circle_at_15%_10%,rgba(236,72,153,0.18)_0%,transparent_50%),radial-gradient(circle_at_85%_85%,rgba(59,130,246,0.18)_0%,transparent_50%)] pointer-events-none z-0 transform-gpu" />

      {/* Extension Header */}
      <header className="relative z-10 flex items-center justify-between h-11 px-3 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10 shrink-0 transition-colors duration-300">
        <div className="flex items-center gap-2">
          <img src={APP_ICON} alt="App Icon" className="w-5 h-5 rounded-md app-header-icon-img drop-shadow-[0_0_6px_rgba(59,130,246,0.5)]" />
          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Nyanko's Media Downloader
          </span>
        </div>

        {/* Connection Status & Theme Toggle */}
        <div className="flex items-center gap-2">
          {/* Connection Status Pill */}
          <button
            onClick={checkConnection}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all duration-200 ${isAppOnline
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
              }`}
            title={isAppOnline ? 'Desktop App Connected' : 'App Offline - Click to Retry'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isAppOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                }`}
            />
            <span>{isAppOnline ? 'Connected' : 'Offline'}</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleThemeMode}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 transition-all duration-200 cursor-pointer"
            title={`Theme: ${themeMode.toUpperCase()} (Click to toggle)`}
          >
            {themeMode === 'light' ? (
              <Sun size={13} className="text-amber-500" />
            ) : themeMode === 'dark' ? (
              <Moon size={13} className="text-purple-400" />
            ) : (
              <Monitor size={13} className="text-sky-400" />
            )}
          </button>

          {/* Open Main App */}
          <button
            onClick={handleOpenDesktopApp}
            className="p-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 text-pink-600 dark:text-pink-400 transition-all duration-200 cursor-pointer"
            title="Open Desktop App Window"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </header>

      {/* Main Content Scroll Area */}
      <div className="relative z-1 flex-1 flex flex-col p-2.5 overflow-y-auto transition-opacity duration-300">
        {/* ==================== TAB 1: DOWNLOADER ==================== */}
        {activeTab === 'downloader' && (
          <div className="flex flex-col gap-2 transform-gpu">
            {downloaderStage === 'stage1' ? (
              /* ===== STAGE 1: App Branding, Active Tab Detect & Search Bar ===== */
              <div className="flex flex-col items-center justify-center py-4 px-2 space-y-3 animate-fade-in-up transform-gpu">
                <div className="text-center space-y-1">
                  <div className="inline-flex p-1.5 rounded-2xl bg-pink-500/10 border border-pink-500/20 mb-0.5 shadow-md shadow-pink-500/10">
                    <img src={APP_ICON} alt="App Icon" className="w-6 h-6 rounded-lg app-header-icon-img" />
                  </div>
                  <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                    Quick Downloader Companion
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tải media tốc độ cao trực tiếp từ trình duyệt
                  </p>
                </div>

                {/* Google-Style Search & Paste Bar */}
                <div className="relative w-full flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus-within:border-pink-500 rounded-xl px-3 py-1.5 shadow-sm transition-all duration-200">
                  <Search size={15} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    className="flex-1 bg-transparent border-none outline-none text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-medium"
                    placeholder="Dán URL hoặc từ khóa tìm kiếm..."
                    value={url}
                    onChange={handleUrlChange}
                    onKeyDown={(e) => e.key === 'Enter' && triggerAnalyze()}
                    spellCheck={false}
                  />
                  <button
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 active:scale-95 border border-pink-500/30 text-pink-600 dark:text-pink-300 text-[11px] font-semibold transition-all duration-200 cursor-pointer shrink-0"
                    onClick={handlePasteClipboard}
                    title="Dán từ Clipboard"
                  >
                    <Clipboard size={13} />
                    <span>Dán</span>
                  </button>
                </div>

                {detectedPlatform && (
                  <div className="flex items-center gap-1.5 text-xs text-pink-600 dark:text-pink-400 font-semibold animate-fade-in">
                    <Sparkles size={12} className="animate-pulse" />
                    <span>
                      Phát hiện: {detectedPlatform.platformName || 'Media'} ({detectedPlatform.formatType.toUpperCase()})
                    </span>
                  </div>
                )}

                {/* Quick Analyze Button */}
                <button
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-pink-500 hover:bg-pink-600 dark:bg-pink-400 dark:hover:bg-pink-300 text-white dark:text-slate-950 text-xs font-extrabold shadow-sm transition-all duration-200 cursor-pointer"
                  onClick={() => triggerAnalyze()}
                  disabled={isAnalyzing || !url.trim()}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Đang phân tích URL...</span>
                    </>
                  ) : (
                    <>
                      <Search size={15} />
                      <span>Phân tích & Tải xuống</span>
                    </>
                  )}
                </button>

                {analyzeError && (
                  <div className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-300 text-xs mt-1 animate-fade-in">
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
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-all duration-200 cursor-pointer"
                    onClick={() => setDownloaderStage('stage1')}
                  >
                    <ArrowLeft size={13} />
                    <span>Quay lại tìm kiếm</span>
                  </button>
                </div>

                {/* Media Thumbnail & Title Card */}
                {mediaInfo && mediaInfo.info && (
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-pink-400/30 shadow-md space-y-2">
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
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                          {mediaInfo.info.title || 'Untitled Media'}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {mediaInfo.info.uploader || 'Nghệ sĩ không rõ'}
                        </p>
                        {mediaInfo.isPlaylist && mediaInfo.info.entries && (
                          <span className="inline-block text-[10px] font-semibold text-purple-600 dark:text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-md border border-purple-500/30">
                            🎵 Playlist: {mediaInfo.info.entries.length} bài hát
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Playlist Track Selection Card */}
                {mediaInfo && mediaInfo.isPlaylist && mediaInfo.info && mediaInfo.info.entries && (
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-purple-400/30 space-y-2.5 shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                        <ListPlus size={14} className="text-purple-500" />
                        <span>Chọn bài trong Playlist</span>
                      </div>
                      <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 font-bold">
                        {playlistSelectedIndexes.length} / {mediaInfo.info.entries.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="flex-1 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                        onClick={handleSelectAllPlaylist}
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        className="flex-1 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                        onClick={handleDeselectAllPlaylist}
                      >
                        Deselect All
                      </button>
                    </div>

                    <div className="max-h-36 overflow-y-auto space-y-1 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      {mediaInfo.info.entries.map((track, idx) => {
                        const trackNum = idx + 1;
                        const isSelected = playlistSelectedIndexes.includes(trackNum);
                        return (
                          <div
                            key={track.id || idx}
                            className={`flex items-center gap-2 p-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer ${isSelected
                              ? 'bg-purple-500/20 text-purple-700 dark:text-purple-200 border border-purple-500/30 font-semibold'
                              : 'hover:bg-slate-200/50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 border border-transparent'
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
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-pink-400/30 space-y-2.5 shadow-md">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    ĐỊNH DẠNG XUẤT
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <button
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${formatType === 'video'
                        ? 'bg-pink-500 text-white dark:bg-pink-400 dark:text-slate-950 font-extrabold shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      onClick={() => {
                        setFormatType('video');
                        setQuality('best');
                      }}
                    >
                      <Film size={13} />
                      <span>Video</span>
                    </button>
                    <button
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${formatType === 'audio'
                        ? 'bg-pink-500 text-white dark:bg-pink-400 dark:text-slate-950 font-extrabold shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      onClick={() => {
                        setFormatType('audio');
                        setQuality('mp3-192');
                      }}
                    >
                      <Music size={13} />
                      <span>Audio</span>
                    </button>
                    <button
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${formatType === 'thumbnail'
                        ? 'bg-pink-500 text-white dark:bg-pink-400 dark:text-slate-950 font-extrabold shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      onClick={() => {
                        setFormatType('thumbnail');
                        setQuality('best');
                      }}
                    >
                      <ImageIcon size={13} />
                      <span>Thumbnail</span>
                    </button>
                  </div>

                  {/* Quality Select */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Chất lượng:</span>
                    <Listbox
                      size="sm"
                      className="w-36"
                      value={quality}
                      onChange={(e) => setQuality(e.target.value)}
                      options={formatType === 'video' ? getResolutionOptions(mediaInfo) : (formatType === 'audio' ? getAudioQualityOptions() : [{ value: 'best', label: 'Tốt nhất' }])}
                    />
                  </div>
                </div>

                {/* Advance Preset Selector */}
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                      <SlidersHorizontal size={13} className="text-purple-500" />
                      <span>Cấu hình Preset Nâng cao</span>
                    </div>
                  </div>

                  <Listbox
                    className="w-full"
                    value={selectedPresetId}
                    onChange={(e) => setSelectedPresetId(e.target.value)}
                  >
                    <option value="">-- Mặc định (Tải tiêu chuẩn) --</option>
                    <optgroup label="Preset Tích hợp">
                      {builtinPresets.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.name}
                        </option>
                      ))}
                    </optgroup>
                    {customPresets.length > 0 && (
                      <optgroup label="Preset Tự tạo">
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
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-pink-500 hover:bg-pink-600 dark:bg-pink-400 dark:hover:bg-pink-300 text-white dark:text-slate-950 text-xs font-extrabold shadow-sm transition-all duration-200 cursor-pointer"
                  onClick={handleStartDownload}
                  disabled={!isAppOnline || (mediaInfo && mediaInfo.isPlaylist && playlistSelectedIndexes.length === 0)}
                >
                  <Download size={16} />
                  <span>
                    {mediaInfo && mediaInfo.isPlaylist
                      ? `Tải ${playlistSelectedIndexes.length} bài đã chọn`
                      : 'Bắt đầu tải xuống ngay'}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 2: DOWNLOAD PROGRESS ==================== */}
        {activeTab === 'progress' && (
          <div className="flex flex-col gap-2 animate-fade-in-up transform-gpu">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between p-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl shadow-md">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-semibold shadow-sm">
                  <Activity size={14} className={`text-cyan-500 dark:text-cyan-400 ${activeKeysCount > 0 ? 'animate-pulse' : ''}`} />
                  <span className="font-mono font-bold">{activeKeysCount} Threads</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-semibold shadow-sm">
                  <Layers size={14} className="text-purple-500 dark:text-purple-400" />
                  <span className="font-mono font-bold">{totalRemainItems} Còn lại</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {activeKeysCount > 0 && (
                  <>
                    <button
                      className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                      onClick={handlePauseAll}
                      title="Tạm dừng tất cả"
                    >
                      <Pause size={13} />
                    </button>
                    <button
                      className="p-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 border border-red-500/30 transition-all cursor-pointer"
                      onClick={handleCancelAll}
                      title="Hủy tất cả"
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
                <button
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-purple-600 dark:text-purple-400 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                  onClick={handleOpenDesktopApp}
                  title="Mở hàng đợi Desktop"
                >
                  <Maximize2 size={13} />
                </button>
              </div>
            </div>

            {activeKeysCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500 text-xs space-y-2">
                <Activity size={32} className="opacity-30 mb-1 animate-pulse text-cyan-500" />
                <span>Không có tiến trình tải nào đang chạy</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {activeDownloads.map((dl) => {
                  const pct = Math.min(100, Math.max(0, dl.percent || 0));
                  const isAudio = dl.formatType === 'audio';
                  const isThumb = dl.formatType === 'thumbnail';
                  const isPlaylist = !!dl.isPlaylist;

                  return (
                    <div
                      key={dl.id}
                      className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl shadow-md space-y-2.5 transform-gpu transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-950 shadow-md">
                          {dl.thumbnail ? (
                            <img
                              src={dl.thumbnail}
                              alt="Thumbnail"
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
                          <h4
                            className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate"
                            title={dl.title || dl.mediaTitle}
                          >
                            {dl.title || dl.mediaTitle || 'Đang tải tệp...'}
                          </h4>

                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                            {dl.uploader && <span className="truncate max-w-[120px]">{dl.uploader}</span>}
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {dl.formatType ? dl.formatType.toUpperCase() : 'MEDIA'}
                            </span>
                          </div>

                          {isPlaylist && (
                            <div className="text-[10px] text-purple-600 dark:text-purple-300 truncate">
                              Bài {dl.currentItem || 1}/{dl.totalItems || 1}:{' '}
                              <strong className="font-semibold">{dl.currentTrackTitle || dl.title || 'Downloading...'}</strong>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                            onClick={() => handlePauseItem(dl.id)}
                            title="Tạm dừng"
                          >
                            <Pause size={13} />
                          </button>
                          <button
                            className="p-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 border border-red-500/30 transition-all cursor-pointer"
                            onClick={() => handleCancelItem(dl.id)}
                            title="Hủy tải"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Animated Progress Bar */}
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-white/5 relative">
                        <div
                          className="h-full bg-pink-500 rounded-full transition-all duration-500 ease-out transform-gpu"
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
            {/* Search, Filter & Sort Bar */}
            <div className="p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl space-y-2.5 shadow-lg">
              <div className="flex items-center gap-2 h-9">
                <div className="flex-1 h-full flex items-center gap-2 bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700/60 focus-within:border-pink-500/60 focus-within:bg-white dark:focus-within:bg-slate-950 rounded-xl px-2.5 text-xs transition-all shadow-inner">
                  <Search size={14} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    className="w-full bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs font-medium"
                    placeholder="Tìm kiếm tệp..."
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
                    <option value="newest">Mới nhất</option>
                    <option value="oldest">Cũ nhất</option>
                    <option value="title-asc">Tên A-Z</option>
                    <option value="title-desc">Tên Z-A</option>
                  </Listbox>

                  {history.length > 0 && (
                    <button
                      className="h-full aspect-square rounded-xl bg-red-500/10 hover:bg-red-500/20 active:scale-95 text-red-600 dark:text-red-400 border border-red-500/25 flex items-center justify-center transition-all cursor-pointer"
                      onClick={handleClearAllHistory}
                      title="Xóa toàn bộ lịch sử"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Pills */}
              <div className="grid grid-cols-5 gap-1 p-1 rounded-xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'video', label: 'Video' },
                  { id: 'audio', label: 'Audio' },
                  { id: 'gif', label: 'GIF' },
                  { id: 'playlist', label: 'Playlist' }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilesFilter(f.id)}
                    className={`py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center ${filesFilter === f.id
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20 scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-semibold'
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
                  <span>Chưa có lịch sử tệp nào đã tải</span>
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
                      draggable={!item.isCancelled}
                      onDragStart={(e) => handleDragStart(e, item)}
                      className={`p-2.5 rounded-2xl border backdrop-blur-xl space-y-2 transition-all cursor-grab active:cursor-grabbing transform-gpu ${item.isCancelled
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                        }`}
                      title="Kéo thả để xuất tệp / sao chép đường dẫn"
                    >
                      <div className="flex items-center justify-between gap-2">
                        {/* Drag Handle + Thumbnail + Info */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="text-slate-400 dark:text-slate-500 cursor-grab shrink-0">
                            <GripVertical size={15} />
                          </div>

                          <div className="relative w-12 h-9 rounded-lg overflow-hidden bg-slate-900 shrink-0 shadow-sm">
                            {displayThumb ? (
                              <img src={displayThumb} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-white/5">
                                {item.formatType === 'audio' ? (
                                  <Music size={16} className="text-purple-400" />
                                ) : (
                                  <Film size={16} className="text-pink-400" />
                                )}
                              </div>
                            )}
                            <span className="absolute bottom-0.5 right-0.5 bg-black/85 text-white text-[8px] font-bold px-1 rounded">
                              {item.isPlaylist ? 'PL' : (item.formatType ? item.formatType.toUpperCase() : 'FILE')}
                            </span>
                          </div>

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

                        {/* File Action Controls (Open Folder, Open File, Copy Path, Delete) */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                            title="Mở thư mục chứa"
                            onClick={() => handleOpenFolder(folderPath)}
                          >
                            <FolderOpen size={12} />
                          </button>

                          {!item.isPlaylist && (
                            <button
                              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                              title="Mở tệp"
                              onClick={() => handleOpenFile(filePath)}
                            >
                              <Play size={12} />
                            </button>
                          )}

                          <button
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                            title="Sao chép đường dẫn"
                            onClick={() => handleCopyFilePath(filePath || folderPath)}
                          >
                            <Copy size={12} />
                          </button>

                          <button
                            className="p-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 active:scale-95 text-red-600 dark:text-red-400 border border-red-500/30 transition-all cursor-pointer"
                            title="Xóa mục"
                            onClick={() => handleDeleteHistoryItem(item.id, filePath)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Playlist Track Drawer Toggle */}
                      {item.isPlaylist && (
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => toggleExpandFolder(item.id)}
                            className="flex items-center gap-1 text-[10px] font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-500 transition-all cursor-pointer"
                          >
                            <span>{isExpanded ? 'Thu gọn' : 'Xem danh sách bài'}</span>
                            {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                          </button>
                        </div>
                      )}

                      {/* Expandable Playlist Drawer */}
                      {item.isPlaylist && isExpanded && (
                        <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-1.5 animate-fade-in">
                          <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-300">
                            Các bài trong Playlist:
                          </div>

                          {item.playlistEntries && item.playlistEntries.length > 0 ? (
                            <div className="max-h-36 overflow-y-auto space-y-1 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                              {item.playlistEntries.map((entry, trkIdx) => {
                                const trackFilePath = item.downloadedFiles && item.downloadedFiles[trkIdx] ? item.downloadedFiles[trkIdx] : null;

                                return (
                                  <div
                                    key={trkIdx}
                                    draggable
                                    onDragStart={(e) => handleTrackDragStart(e, trackFilePath, item.folderPath)}
                                    className="flex items-center gap-2 p-1.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5 hover:border-slate-300 dark:hover:border-slate-700 cursor-grab text-xs transition-all"
                                    title="Kéo thả bài hát này"
                                  >
                                    <div className="text-slate-400 dark:text-slate-500 cursor-grab shrink-0">
                                      <GripVertical size={13} />
                                    </div>

                                    <div className="w-5 h-5 rounded overflow-hidden bg-slate-800 shrink-0">
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
                                        className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                                        onClick={() => (trackFilePath ? handleOpenFile(trackFilePath) : handleOpenFolder(item.folderPath))}
                                        title="Mở bài hát"
                                      >
                                        <Play size={10} />
                                      </button>
                                      <button
                                        className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                                        onClick={() => handleCopyFilePath(trackFilePath || item.folderPath)}
                                        title="Sao chép đường dẫn"
                                      >
                                        <Copy size={10} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : null}
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
        <div className="absolute bottom-[72px] left-3 right-3 z-50 flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/95 text-slate-100 border border-pink-500/30 shadow-2xl backdrop-blur-xl text-xs animate-fade-in-up">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0 animate-bounce" />
            <span className="truncate font-medium text-slate-100">{toastMessage}</span>
          </div>
          <button
            className="px-2 py-0.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 font-bold text-[10px] border border-pink-500/30 transition-all cursor-pointer shrink-0 ml-2"
            onClick={() => setActiveTab('progress')}
          >
            Tiến trình
          </button>
        </div>
      )}

      {/* ==================== FLOATING BOTTOM NAVIGATION BAR ==================== */}
      <nav className="relative z-10 mx-2 mb-2 p-1 rounded-2xl bg-white/90 dark:bg-slate-950/90 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-2xl shadow-xl flex items-center justify-around gap-1 shrink-0 transition-colors duration-300">
        {/* Animated Nav Progress Fill Bar */}
        {activeKeysCount > 0 && (
          <div
            className="absolute top-0 left-3 right-3 h-0.5 bg-slate-200 dark:bg-slate-950 rounded-full overflow-hidden"
            title={`Progress: ${overallAvgPercent.toFixed(1)}%`}
          >
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 transition-all duration-300 transform-gpu"
              style={{ width: `${overallAvgPercent}%` }}
            />
          </div>
        )}

        <button
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer ${activeTab === 'downloader'
            ? 'text-pink-600 dark:text-pink-300 bg-pink-500/10 dark:bg-pink-500/20 border border-pink-500/30 dark:border-pink-500/40 shadow-sm scale-102'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
            }`}
          onClick={() => setActiveTab('downloader')}
          title="Tải xuống"
        >
          <Download size={16} className={activeTab === 'downloader' ? 'text-pink-500 dark:text-pink-400' : ''} />
          <span>Tải xuống</span>
        </button>

        <button
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer ${activeTab === 'progress'
            ? 'text-cyan-600 dark:text-cyan-300 bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/30 dark:border-cyan-500/40 shadow-sm scale-102'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
            }`}
          onClick={() => setActiveTab('progress')}
          title="Tiến trình"
        >
          <div className="relative flex items-center justify-center">
            <Zap
              size={16}
              className={`transition-all duration-300 ${activeKeysCount > 0
                ? 'text-cyan-500 dark:text-cyan-400 animate-pulse drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                : activeTab === 'progress'
                  ? 'text-cyan-500 dark:text-cyan-400'
                  : 'text-slate-500 dark:text-slate-400'
                }`}
            />
            {activeKeysCount > 0 && (
              <span className="absolute -top-2 -right-3 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 text-[9px] font-extrabold text-white shadow-lg shadow-cyan-500/50 animate-bounce">
                <span className="relative z-10 font-mono">{activeKeysCount}</span>
              </span>
            )}
          </div>
          <span>Tiến trình</span>
        </button>

        <button
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer ${activeTab === 'files'
            ? 'text-purple-600 dark:text-purple-300 bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/30 dark:border-purple-500/40 shadow-sm scale-102'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
            }`}
          onClick={() => setActiveTab('files')}
          title="Lịch sử tệp"
        >
          <div className="relative flex items-center justify-center">
            <Folder size={16} className={activeTab === 'files' ? 'text-purple-500 dark:text-purple-400' : ''} />
            {completedCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-purple-500 text-white text-[9px] font-extrabold px-1 rounded-full shadow-md">
                {completedCount}
              </span>
            )}
          </div>
          <span>Lịch sử</span>
        </button>

        <button
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-[10px] font-extrabold text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/30 transition-all cursor-pointer"
          onClick={handleOpenDesktopApp}
          title="Mở ứng dụng Desktop"
        >
          <Maximize2 size={16} />
          <span>Desktop</span>
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
