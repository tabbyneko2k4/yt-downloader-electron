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
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  SlidersHorizontal,
  Maximize2,
  ListPlus,
  Pause,
  Play,
  Trash2,
  Cpu,
  Layers,
  GripVertical,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  FolderOpen,
  FolderCheck,
  RefreshCw,
  Laptop
} from 'lucide-react';
import { detectFormatFromUrl } from './utils/formatDetector';
import Listbox from './Listbox';

const API_BASE = 'http://127.0.0.1:38472';

export default function Popup() {
  // Navigation Tabs: 'downloader' | 'progress' | 'files'
  const [activeTab, setActiveTab] = useState('downloader');

  // Connection State
  const [isAppOnline, setIsAppOnline] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Downloader Stage State: 'stage1' (Search/Paste) | 'stage2' (Analyzed details)
  const [downloaderStage, setDownloaderStage] = useState('stage1');

  // Input & Format State
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

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState(null);

  // Custom Presets
  const [customPresets, setCustomPresets] = useState([]);

  const builtinPresets = useMemo(() => [
    {
      id: 'preset-speed',
      name: '🚀 Speed Boost (10M Limit Off)',
      options: { rateLimit: '10M', customArgs: '--no-mtime' }
    },
    {
      id: 'preset-subs',
      name: '💬 Phụ đề (Vi+En)',
      options: { writeSubs: true, embedSubs: true, subLangs: 'vi,en' }
    },
    {
      id: 'preset-bypass',
      name: '🔐 Geo-Bypass & Chrome Cookies',
      options: { cookiesFromBrowser: 'chrome', customArgs: '--geo-bypass' }
    },
    {
      id: 'preset-cut-1m',
      name: '✂️ Cắt 1 Phút Đầu',
      options: { downloadSections: '*00:00:00-00:01:00' }
    }
  ], []);

  // 1. Initial Connection Check & Auto Detection from Tab
  useEffect(() => {
    checkAppConnection();

    // Check active tab URL & Auto Analyze + Direct Stage 2 Jump
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].url) {
          const activeUrl = tabs[0].url;
          if (isValidMediaUrl(activeUrl)) {
            setUrl(activeUrl);
            applyAutoFormatRule(activeUrl);
            // DIRECT TO ANALYZE & DOWNLOAD STAGE
            setDownloaderStage('stage2');
            triggerAnalyze(activeUrl);
          }
        }
      });
    }
  }, []);

  // 2. Real-time Progress & History Polling (every 1.2s when connected)
  useEffect(() => {
    let interval = null;
    if (isAppOnline) {
      fetchProgressAndHistory();
      interval = setInterval(fetchProgressAndHistory, 1200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAppOnline]);

  // Reset playlist selections when mediaInfo changes
  useEffect(() => {
    if (mediaInfo && mediaInfo.isPlaylist && mediaInfo.info && mediaInfo.info.entries) {
      const all = mediaInfo.info.entries.map((_, idx) => idx + 1);
      setPlaylistSelectedIndexes(all);
    } else {
      setPlaylistSelectedIndexes([]);
    }
  }, [mediaInfo]);

  const checkAppConnection = async () => {
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
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const clean = text.trim();
        setUrl(clean);
        applyAutoFormatRule(clean);
        setAnalyzeError('');
        if (isValidMediaUrl(clean)) {
          setDownloaderStage('stage2');
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
      if (!isValidMediaUrl(rawUrl)) {
        queryToSend = `ytsearch20:${rawUrl}`;
      }

      const res = await fetch(`${API_BASE}/api/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: queryToSend })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setMediaInfo(data);
        if (rawUrl.includes('soundcloud.com') && formatType !== 'audio') {
          setFormatType('audio');
          setQuality('mp3-192');
        }
        setDownloaderStage('stage2');
      } else {
        setAnalyzeError(data.error || 'Không thể lấy thông tin media từ đường dẫn này.');
      }
    } catch (err) {
      setAnalyzeError(err.message || 'Không thể kết nối đến ứng dụng Desktop.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Playlist track selection handlers
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
      const info = mediaInfo && mediaInfo.info ? mediaInfo.info : {};
      const id = `ext_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      let presetOptions = {};
      if (selectedPresetId) {
        const found = builtinPresets.find((p) => p.id === selectedPresetId);
        if (found) presetOptions = found.options;
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
        isPlaylist,
        playlistTitle: isPlaylist ? info.title : null,
        playlistEntries: selectedEntries,
        playlistItems: isPlaylist && playlistSelectedIndexes.length > 0 ? playlistSelectedIndexes.join(',') : null,
        mediaTitle: info.title || 'Video từ Chrome Extension',
        uploader: info.uploader || '',
        thumbnail: info.thumbnail || '',
        duration: info.duration || null,
        embedMetadata: true,
        embedThumbnail: formatType === 'audio',
        ...presetOptions
      };

      const res = await fetch(`${API_BASE}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(downloadOptions)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const countMsg = isPlaylist ? ` (${selectedEntries.length} bài hát)` : '';
        showToastBanner(`Đã thêm "${targetTitle.substring(0, 22)}${targetTitle.length > 22 ? '...' : ''}"${countMsg} vào hàng đợi`);
        fetchProgressAndHistory();
      } else {
        setAnalyzeError(data.error || 'Tải xuống thất bại.');
      }
    } catch (err) {
      setAnalyzeError(err.message || 'Thất bại khi khởi tạo tải xuống.');
    }
  };

  const showToastBanner = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
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

  const handleFileAction = async (action, filePath) => {
    try {
      await fetch(`${API_BASE}/api/file-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, filePath })
      });
      if (action === 'copyPath') {
        showToastBanner('Đã sao chép đường dẫn tệp');
      } else if (action === 'delete') {
        showToastBanner('Đã xóa tệp khỏi lịch sử');
        fetchProgressAndHistory();
      }
    } catch (e) { }
  };

  const toggleExpandFolder = (id) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
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

  // Active items filtering & progress stats
  const activeKeys = useMemo(() => {
    return activeDownloads.filter((d) => d && (d.percent === undefined || d.percent < 100));
  }, [activeDownloads]);

  const totalRemainItems = useMemo(() => {
    return activeDownloads.reduce((acc, item) => {
      if (!item || item.percent >= 100) return acc;
      const total = item.totalItems || 1;
      const current = item.currentItem || 1;
      let remaining = Math.max(1, total - current + 1);
      if (item.percent > 99) remaining = Math.max(0, remaining - 1);
      return acc + remaining;
    }, 0);
  }, [activeDownloads]);

  const overallAvgPercent = useMemo(() => {
    if (activeKeys.length === 0) return 0;
    return activeKeys.reduce((acc, d) => acc + (d.percent || 0), 0) / activeKeys.length;
  }, [activeKeys]);

  const filteredFiles = useMemo(() => {
    let result = [...history];

    if (filesSearch.trim()) {
      const term = filesSearch.toLowerCase();
      result = result.filter(
        (item) =>
          (item.title && item.title.toLowerCase().includes(term)) ||
          (item.mediaTitle && item.mediaTitle.toLowerCase().includes(term)) ||
          (item.uploader && item.uploader.toLowerCase().includes(term)) ||
          (item.filePath && item.filePath.toLowerCase().includes(term))
      );
    }

    if (filesFilter === 'video') {
      result = result.filter((item) => item.formatType === 'video');
    } else if (filesFilter === 'audio') {
      result = result.filter((item) => item.formatType === 'audio');
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

  return (
    <div className="ext-app">
      {/* Top Header Bar */}
      <header className="ext-header">
        <div className="ext-brand">
          <Sparkles size={16} className="text-pink-500 animate-pulse" />
          <span>YT Downloader</span>
        </div>

        <div className="header-right">
          <div className={`status-badge ${isAppOnline ? 'status-online' : 'status-offline'}`}>
            <span className="dot-indicator"></span>
            <span>{isAppOnline ? 'Đã kết nối App' : 'Ngoại tuyến'}</span>
          </div>

          <button
            className="icon-btn-header"
            onClick={checkAppConnection}
            title="Kiểm tra lại kết nối"
          >
            <RefreshCw size={13} className={checkingStatus ? 'animate-spin' : ''} />
          </button>

          <button
            className="icon-btn-header"
            onClick={handleOpenDesktopApp}
            title="Mở ứng dụng Desktop"
          >
            <Laptop size={13} />
          </button>
        </div>
      </header>

      {/* Connection Failure Banner */}
      {!isAppOnline && !checkingStatus && (
        <div className="ext-offline-banner">
          <span>Chưa mở ứng dụng YT Downloader Desktop</span>
          <button className="open-app-btn" onClick={handleOpenDesktopApp}>
            <ExternalLink size={11} />
            <span>Mở App</span>
          </button>
        </div>
      )}

      {/* Main Content Body */}
      <div className="ext-content-body">
        {/* ==================== TAB 1: DOWNLOADER ==================== */}
        {activeTab === 'downloader' && (
          <div className="ext-tab-panel">
            {downloaderStage === 'stage1' ? (
              /* ===== STAGE 1: Search / Paste URL ===== */
              <div className="mini-stage-1-container">
                <div className="mini-brand-hero">
                  <div className="mini-hero-badge">
                    <Sparkles size={20} className="text-pink-500" />
                  </div>
                  <h2 className="mini-hero-title">YT Downloader</h2>
                  <p className="mini-hero-subtitle">Tải video, audio chất lượng cao từ mọi nguồn</p>
                </div>

                <div className="google-mini-search">
                  <Search size={16} className="google-search-icon" />
                  <input
                    type="text"
                    className="google-search-input"
                    placeholder="Dán link hoặc nhập từ khóa tìm kiếm..."
                    value={url}
                    onChange={handleUrlChange}
                    onKeyDown={(e) => e.key === 'Enter' && triggerAnalyze()}
                    spellCheck={false}
                    autoFocus
                  />
                  <button
                    className="google-paste-btn"
                    onClick={handlePasteClipboard}
                    title="Dán từ Clipboard"
                  >
                    <Clipboard size={14} />
                    <span>Dán</span>
                  </button>
                </div>

                {detectedPlatform && (
                  <div className="mini-auto-detect-tag center-tag">
                    <Sparkles size={12} />
                    <span>
                      Nhận dạng: {detectedPlatform.platformName || 'Media'} ({detectedPlatform.formatType.toUpperCase()})
                    </span>
                  </div>
                )}

                <button
                  className="google-analyze-btn"
                  onClick={() => triggerAnalyze()}
                  disabled={isAnalyzing || !url.trim()}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Đang phân tích link...</span>
                    </>
                  ) : (
                    <>
                      <Search size={15} />
                      <span>Phân tích Link / Tìm kiếm</span>
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
              /* ===== STAGE 2: Media Analysis Inspector & Direct Download ===== */
              <div className="mini-stage-2-container">
                <div className="mini-stage-nav">
                  <button
                    className="mini-back-btn"
                    onClick={() => setDownloaderStage('stage1')}
                  >
                    <ArrowLeft size={13} />
                    <span>Quay lại tìm kiếm</span>
                  </button>
                </div>

                {/* Loading state during automatic analysis */}
                {isAnalyzing ? (
                  <div className="mini-card text-center py-6">
                    <Loader2 size={28} className="animate-spin text-purple-400 mx-auto mb-2" />
                    <span className="text-xs font-semibold text-gray-300">Đang nhận dạng media & trích xuất định dạng...</span>
                  </div>
                ) : (
                  <>
                    {/* Media Thumbnail & Title Card */}
                    {mediaInfo && mediaInfo.info && (
                      <div className="mini-card shadow-lg">
                        <div className="mini-media-row">
                          {mediaInfo.info.thumbnail ? (
                            <img
                              src={mediaInfo.info.thumbnail}
                              alt="Thumbnail"
                              className="mini-media-thumb"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="mini-media-thumb-placeholder">
                              <Film size={20} />
                            </div>
                          )}
                          <div className="mini-media-details">
                            <h4 className="mini-media-title">{mediaInfo.info.title || 'Untitled Media'}</h4>
                            <p className="mini-media-uploader">{mediaInfo.info.uploader || 'Nghệ sĩ / Kênh'}</p>
                            {mediaInfo.isPlaylist && mediaInfo.info.entries && (
                              <span className="mini-badge-playlist">
                                🎵 Danh sách phát: {mediaInfo.info.entries.length} mục
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Playlist Track Selection Drawer */}
                    {mediaInfo && mediaInfo.isPlaylist && mediaInfo.info && mediaInfo.info.entries && (
                      <div className="mini-card">
                        <div className="mini-playlist-header">
                          <div className="mini-playlist-title-wrap">
                            <ListPlus size={14} className="text-purple-400" />
                            <span>Chọn bài trong Playlist</span>
                          </div>
                          <span className="mini-playlist-count">
                            {playlistSelectedIndexes.length} / {mediaInfo.info.entries.length}
                          </span>
                        </div>

                        <div className="mini-playlist-actions">
                          <button type="button" className="mini-playlist-btn-sm" onClick={handleSelectAllPlaylist}>
                            Chọn tất cả
                          </button>
                          <button type="button" className="mini-playlist-btn-sm" onClick={handleDeselectAllPlaylist}>
                            Bỏ chọn
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
                                <span className="mini-track-name">{track.title || `Track ${trackNum}`}</span>
                                {track.duration && (
                                  <span className="mini-track-duration">{formatDuration(track.duration)}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Format Selector Pills & Quality */}
                    <div className="mini-card">
                      <div className="mini-card-header">
                        <span className="mini-card-label">Định dạng xuất</span>
                      </div>

                      <div className="mini-pill-selector">
                        <button
                          className={`mini-pill-btn ${formatType === 'video' ? 'active' : ''}`}
                          onClick={() => { setFormatType('video'); setQuality('best'); }}
                        >
                          <Film size={13} />
                          <span>Video</span>
                        </button>

                        <button
                          className={`mini-pill-btn ${formatType === 'audio' ? 'active' : ''}`}
                          onClick={() => { setFormatType('audio'); setQuality('mp3-192'); }}
                        >
                          <Music size={13} />
                          <span>Audio (MP3)</span>
                        </button>

                        <button
                          className={`mini-pill-btn ${formatType === 'thumbnail' ? 'active' : ''}`}
                          onClick={() => { setFormatType('thumbnail'); setQuality('best'); }}
                        >
                          <ImageIcon size={13} />
                          <span>Ảnh Bìa</span>
                        </button>
                      </div>

                      <div className="mini-quality-row">
                        <span className="mini-label">Chất lượng:</span>
                        <Listbox
                          size="sm"
                          className="w-36"
                          value={quality}
                          onChange={(e) => setQuality(e.target.value)}
                        >
                          {formatType === 'video' && (
                            <>
                              <option value="best">Cao nhất (Best quality)</option>
                              <option value="1080p">1080p Full HD</option>
                              <option value="720p">720p HD</option>
                              <option value="480p">480p SD</option>
                            </>
                          )}
                          {formatType === 'audio' && (
                            <>
                              <option value="mp3-320">MP3 - 320 kbps (Cao cấp)</option>
                              <option value="mp3-192">MP3 - 192 kbps (Chuẩn)</option>
                              <option value="m4a">M4A (Gốc)</option>
                              <option value="flac">FLAC (Không nén)</option>
                            </>
                          )}
                          {formatType === 'thumbnail' && (
                            <option value="best">Ảnh Bìa Gốc (Best resolution)</option>
                          )}
                        </Listbox>
                      </div>
                    </div>

                    {/* Presets Option */}
                    <div className="mini-card">
                      <div className="mini-preset-header">
                        <div className="mini-preset-title">
                          <SlidersHorizontal size={13} className="text-purple-400" />
                          <span>Cấu hình nâng cao (Preset)</span>
                        </div>
                      </div>

                      <Listbox
                        className="w-full"
                        value={selectedPresetId}
                        onChange={(e) => setSelectedPresetId(e.target.value)}
                      >
                        <option value="">-- Mặc định --</option>
                        {builtinPresets.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </Listbox>
                    </div>

                    {analyzeError && (
                      <div className="mini-error-banner">
                        <AlertCircle size={14} />
                        <span>{analyzeError}</span>
                      </div>
                    )}

                    {/* Primary Download Button */}
                    <button
                      className="mini-btn-primary full-width-download"
                      onClick={handleStartDownload}
                      disabled={!isAppOnline || (mediaInfo && mediaInfo.isPlaylist && playlistSelectedIndexes.length === 0)}
                    >
                      <Download size={16} />
                      <span>
                        {mediaInfo && mediaInfo.isPlaylist
                          ? `Tải xuống ${playlistSelectedIndexes.length} bài đã chọn`
                          : 'Tải xuống ngay'}
                      </span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 2: DOWNLOAD PROGRESS ==================== */}
        {activeTab === 'progress' && (
          <div className="ext-tab-panel">
            <div className="mini-panel-title-bar">
              <div className="mini-progress-meta-badges">
                <div className="mini-badge-pill mini-badge-thread" title="Tiến trình đang chạy">
                  <Cpu size={13} />
                  <span>{activeKeys.length} Đang tải</span>
                </div>
                <div className="mini-badge-pill mini-badge-remain" title="Số tệp còn lại">
                  <Layers size={13} />
                  <span>{totalRemainItems} Tệp</span>
                </div>
              </div>

              {activeKeys.length > 0 && (
                <div className="mini-progress-global-actions">
                  <button className="mini-icon-btn" onClick={handlePauseAll} title="Tạm dừng tất cả">
                    <Pause size={13} />
                  </button>
                  <button className="mini-icon-btn" onClick={handleCancelAll} title="Hủy tất cả">
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>

            {activeKeys.length === 0 ? (
              <div className="mini-empty-state">
                <Loader2 size={32} className="opacity-20 mb-2" />
                <span>Không có tiến trình tải xuống nào đang chạy</span>
              </div>
            ) : (
              <div className="mini-active-list">
                {activeKeys.map((dl) => {
                  const pct = Math.min(100, Math.max(0, dl.percent || 0));
                  const isAudio = dl.formatType === 'audio';

                  return (
                    <div key={dl.id} className="mini-card mini-active-item">
                      <div className="mini-active-top-row">
                        <div className="mini-active-thumb-wrap">
                          {dl.thumbnail ? (
                            <img src={dl.thumbnail} alt="" className="mini-active-thumb" onError={(e) => { e.target.style.display = 'none'; }} />
                          ) : (
                            <div className="mini-active-thumb-fallback">
                              {isAudio ? <Music size={16} className="text-purple-400" /> : <Film size={16} className="text-pink-400" />}
                            </div>
                          )}
                        </div>

                        <div className="mini-active-info">
                          <h4 className="mini-active-item-title" title={dl.title || dl.mediaTitle}>
                            {dl.title || dl.mediaTitle || 'Đang tải media...'}
                          </h4>
                          <div className="mini-active-item-sub">
                            <span className="mini-active-uploader">{dl.uploader || 'N/A'}</span>
                            <span className="mini-active-format-pill">{(dl.formatType || 'media').toUpperCase()}</span>
                          </div>
                        </div>

                        <div className="mini-active-item-actions">
                          <button className="mini-item-action-btn" onClick={() => handlePauseItem(dl.id)} title="Tạm dừng">
                            <Pause size={12} />
                          </button>
                          <button className="mini-item-action-btn" onClick={() => handleCancelItem(dl.id)} title="Hủy tải">
                            <X size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="mini-progress-bar-bg">
                        <div className="mini-progress-bar-fill" style={{ width: `${pct}%` }} />
                      </div>

                      <div className="mini-active-stats">
                        <span className="mini-stat-pct">{pct.toFixed(1)}%</span>
                        <span>{dl.speed || '—'}</span>
                        <span>ETA {dl.eta || '—'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 3: DOWNLOADED FILES HISTORY ==================== */}
        {activeTab === 'files' && (
          <div className="ext-tab-panel">
            <div className="mini-panel-title-bar">
              <div className="mini-progress-meta-badges">
                <span className="mini-badge-pill" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <FolderCheck size={12} />
                  <span>Đã tải ({filteredFiles.length})</span>
                </span>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="mini-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <div className="mini-search-box" style={{ flex: 1 }}>
                  <Search size={13} className="mini-search-icon" />
                  <input
                    type="text"
                    className="mini-search-input"
                    placeholder="Tìm kiếm lịch sử tệp..."
                    value={filesSearch}
                    onChange={(e) => setFilesSearch(e.target.value)}
                  />
                </div>

                <Listbox
                  size="sm"
                  className="w-28"
                  value={filesSort}
                  onChange={(e) => setFilesSort(e.target.value)}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="title-asc">Tên A-Z</option>
                  <option value="title-desc">Tên Z-A</option>
                </Listbox>
              </div>

              <div style={{ display: 'flex', gap: '4px' }}>
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'video', label: 'Video' },
                  { id: 'audio', label: 'Audio' },
                  { id: 'playlist', label: 'Playlist' }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilesFilter(f.id)}
                    style={{
                      padding: '2px 7px',
                      borderRadius: '4px',
                      fontSize: '10px',
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
                  <span>Lịch sử tệp tải trống</span>
                </div>
              ) : (
                filteredFiles.map((item, idx) => {
                  const title = item.title || item.mediaTitle || 'Untitled Media';
                  const filePath = item.filePath || item.folderPath;

                  return (
                    <div key={item.id || idx} className="mini-card" style={{ padding: '8px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                          <div style={{ width: '40px', height: '30px', borderRadius: '4px', overflow: 'hidden', background: '#000', flexShrink: 0 }}>
                            {item.thumbnail ? (
                              <img src={item.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {item.formatType === 'audio' ? <Music size={14} className="text-purple-400" /> : <Film size={14} className="text-pink-400" />}
                              </div>
                            )}
                          </div>

                          <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                            <h4 style={{ fontSize: '11px', fontWeight: '600', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {title}
                            </h4>
                            <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                              {item.uploader || 'Media'} {item.downloadedAt ? `• ${formatDate(item.downloadedAt)}` : ''}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
                          <button
                            className="mini-action-btn-sm"
                            title="Mở thư mục"
                            onClick={() => handleFileAction('openFolder', filePath)}
                          >
                            <FolderOpen size={11} />
                          </button>
                          <button
                            className="mini-action-btn-sm"
                            title="Mở tệp"
                            onClick={() => handleFileAction('openFile', filePath)}
                          >
                            <Play size={11} />
                          </button>
                          <button
                            className="mini-action-btn-sm"
                            title="Sao chép đường dẫn"
                            onClick={() => handleFileAction('copyPath', filePath)}
                          >
                            <Copy size={11} />
                          </button>
                          <button
                            className="mini-action-btn-sm"
                            title="Xóa khỏi lịch sử"
                            onClick={() => handleFileAction('delete', filePath)}
                            style={{ color: '#ef4444' }}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
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
        <div className="mini-toast-banner">
          <div className="mini-toast-content">
            <CheckCircle2 size={15} className="text-green-400 flex-shrink-0" />
            <span className="mini-toast-text">{toastMessage}</span>
          </div>
          <button
            className="mini-toast-action-btn"
            onClick={() => setActiveTab('progress')}
          >
            Tiến trình
          </button>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="mini-bottom-nav">
        {activeKeys.length > 0 && (
          <div className="mini-nav-under-progress" title={`Tiến trình: ${overallAvgPercent.toFixed(1)}%`}>
            <div className="mini-nav-under-fill" style={{ width: `${overallAvgPercent}%` }} />
          </div>
        )}

        <button
          className={`mini-bottom-tab ${activeTab === 'downloader' ? 'active' : ''}`}
          onClick={() => setActiveTab('downloader')}
        >
          <Download size={16} />
          <span>Tải xuống</span>
        </button>

        <button
          className={`mini-bottom-tab ${activeTab === 'progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('progress')}
        >
          <div className="mini-tab-icon-wrap">
            <Loader2 size={16} className={activeKeys.length > 0 ? 'animate-spin text-purple-400' : ''} />
            {activeKeys.length > 0 && <span className="mini-bottom-badge">{activeKeys.length}</span>}
          </div>
          <span>Tiến trình</span>
        </button>

        <button
          className={`mini-bottom-tab ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          <div className="mini-tab-icon-wrap">
            <Folder size={16} />
            {history.length > 0 && <span className="mini-bottom-badge">{history.length}</span>}
          </div>
          <span>Đã tải</span>
        </button>

        <button
          className="mini-bottom-tab pop-main-btn"
          onClick={handleOpenDesktopApp}
          title="Mở ứng dụng Desktop đầy đủ"
        >
          <Maximize2 size={16} />
          <span>App Desktop</span>
        </button>
      </nav>
    </div>
  );
}
