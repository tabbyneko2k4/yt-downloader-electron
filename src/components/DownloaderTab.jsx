import React, { useState, useEffect } from 'react';
import { Search, Film, Music, Image as ImageIcon, Download, Play, AlertTriangle, Terminal, Clock, Clipboard, ArrowLeft, Globe, SlidersHorizontal, Scissors, Sliders, Volume2, Gauge, CheckCircle2, ChevronDown, ChevronUp, PauseCircle, Loader2, Sparkles, FileText, X, Zap, Layers, Cpu, Plus, Check, ListPlus } from 'lucide-react';
import PlaylistInspector from './PlaylistInspector';
import { detectFormatFromUrl } from '../utils/formatDetector';
import { useTranslation } from '../i18n/LanguageContext';

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
  const [searchPlatform, setSearchPlatform] = useState('auto'); // 'youtube' | 'soundcloud' | 'auto'
  const [addedToQueueMap, setAddedToQueueMap] = useState({});
  const [batchAdded, setBatchAdded] = useState(false);
  const [showAdvancedInResult, setShowAdvancedInResult] = useState(false);

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
  const handleAnalyze = async (overrideUrl = null, overridePlatform = null) => {
    const rawTarget = (overrideUrl !== null ? overrideUrl : url).trim();
    if (!rawTarget) return;

    const activePlat = overridePlatform || searchPlatform;
    const isDirectUrl = /^https?:\/\//i.test(rawTarget);

    let queryToSend = rawTarget;
    if (!isDirectUrl) {
      if (activePlat === 'soundcloud') {
        queryToSend = `scsearch20:${rawTarget}`;
      } else {
        queryToSend = `ytsearch20:${rawTarget}`;
      }
    }

    setIsAnalyzing(true);
    setAnalyzeError('');
    applyAutoFormatRule(rawTarget);

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
      setAnalyzeError(err.message || t('downloadError'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Add individual item from search results to Download Queue
  const handleAddToQueue = (item) => {
    if (!item || !item.url) return;
    const downloadId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 4);
    const downloadData = {
      id: downloadId,
      url: item.url,
      formatType,
      quality: formatType === 'video' ? videoQuality : (formatType === 'audio' ? audioQuality : (formatType === 'gif' ? 'gif' : 'thumbnail')),
      destDir: settings.defaultPath,
      embedMetadata: settings.embedMetadata,
      embedThumbnail: settings.embedThumbnail,
      writeThumbnail: !!writeThumbnail,
      writeDescription: !!writeDescription,

      videoFps,
      videoContainer,
      audioSampleRate,
      gifFps: formatType === 'gif' ? gifFps : null,
      gifRes: formatType === 'gif' ? gifRes : null,
      gifSpeed: formatType === 'gif' ? gifSpeed : null,
      trimStart: trimStart.trim(),
      trimEnd: trimEnd.trim(),

      writeSubs: advancedOptions.writeSubs,
      embedSubs: advancedOptions.embedSubs,
      subLangs: advancedOptions.writeSubs ? advancedOptions.subLangs.trim() : null,
      downloadSections: advancedOptions.downloadSections.trim() || null,
      cookiesFromBrowser: advancedOptions.cookiesFromBrowser !== 'none' ? advancedOptions.cookiesFromBrowser : null,
      rateLimit: advancedOptions.rateLimit.trim() || null,
      customFormat: advancedOptions.customFormat.trim() || null,
      customArgs: advancedOptions.customArgs.trim() || null,

      mediaTitle: item.title,
      uploader: item.uploader,
      thumbnail: item.thumbnail,
      duration: item.duration
    };

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

  const toggleExpandActiveTask = (id) => {
    setExpandedActiveTasks((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleStartDownload = () => {
    if (!mediaInfo) return;

    // Filter ONLY selected entries when downloading playlist
    const selectedEntries = mediaInfo.isPlaylist && mediaInfo.info.entries
      ? mediaInfo.info.entries.filter((_, idx) => playlistSelectedIndexes.includes(idx + 1))
      : null;

    const downloadId = Date.now().toString();
    const downloadData = {
      id: downloadId,
      url: url.trim(),
      formatType,
      quality: formatType === 'video' ? videoQuality : (formatType === 'audio' ? audioQuality : (formatType === 'gif' ? 'gif' : 'thumbnail')),
      destDir: settings.defaultPath,
      isPlaylist: mediaInfo.isPlaylist,
      playlistTitle: mediaInfo.isPlaylist ? mediaInfo.info.title : null,
      playlistItems: mediaInfo.isPlaylist ? playlistSelectedIndexes.join(',') : null,
      embedMetadata: settings.embedMetadata,
      embedThumbnail: settings.embedThumbnail,
      writeThumbnail: !!writeThumbnail,
      writeDescription: !!writeDescription,

      // Inline Media Tuning options
      videoFps,
      videoContainer,
      audioSampleRate,
      gifFps: formatType === 'gif' ? gifFps : null,
      gifRes: formatType === 'gif' ? gifRes : null,
      gifSpeed: formatType === 'gif' ? gifSpeed : null,
      trimStart: trimStart.trim(),
      trimEnd: trimEnd.trim(),

      // Apply Advanced CLI Options
      writeSubs: advancedOptions.writeSubs,
      embedSubs: advancedOptions.embedSubs,
      subLangs: advancedOptions.writeSubs ? advancedOptions.subLangs.trim() : null,
      downloadSections: advancedOptions.downloadSections.trim() || null,
      cookiesFromBrowser: advancedOptions.cookiesFromBrowser !== 'none' ? advancedOptions.cookiesFromBrowser : null,
      rateLimit: advancedOptions.rateLimit.trim() || null,
      customFormat: advancedOptions.customFormat.trim() || null,
      customArgs: advancedOptions.customArgs.trim() || null,

      mediaTitle: mediaInfo.info.title,
      uploader: mediaInfo.info.uploader,
      thumbnail: mediaInfo.info.thumbnail,
      duration: mediaInfo.info.duration,
      playlistEntries: selectedEntries
    };

    // Launch download & auto-collapse
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
    { name: 'Threads', color: '#e879f9' },
    { name: 'KakaoTV', color: '#fef08a' },
    { name: 'VKontakte', color: '#93c5fd' },
    { name: 'Weibo Video', color: '#fca5a5' },
    { name: 'Rutube', color: '#f87171' },
    { name: 'PeerTube', color: '#c084fc' },
    { name: 'Mixcloud', color: '#38bdf8' },
    { name: 'LinkedIn Video', color: '#60a5fa' },
    { name: 'Niconico', color: '#fbcfe8' },
    { name: '9GAG Video', color: '#fde047' },
    { name: 'BitChute', color: '#a7f3d0' }
  ];

  const dustParticles = React.useMemo(() => {
    return dustServices.map((service, i) => {
      const top = 4 + ((i * 3.3) % 90);
      const duration = 22 + (i % 8) * 4;
      const delay = -((i * 4.3) % 30);
      const opacity = 0.16 + ((i % 5) * 0.04);
      const fontSize = 11 + (i % 3);

      return {
        id: i,
        name: service.name,
        color: service.color,
        style: {
          top: `${top}%`,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          fontSize: `${fontSize}px`,
          color: service.color,
          '--particle-opacity': opacity
        }
      };
    });
  }, []);

  const quickPlatforms = [
    { id: 'youtube', name: 'YouTube Search', cls: 'youtube', hint: 'lofi chill', isSearch: true },
    { id: 'soundcloud', name: 'SoundCloud Search', cls: 'soundcloud', hint: 'chill lofi track', isSearch: true },
    { id: 'tiktok', name: 'TikTok', cls: 'tiktok', hint: 'https://tiktok.com/@user/video/...', isSearch: false },
    { id: 'facebook', name: 'Facebook', cls: 'facebook', hint: 'https://facebook.com/watch/...', isSearch: false },
    { id: 'instagram', name: 'Instagram', cls: 'instagram', hint: 'https://instagram.com/reel/...', isSearch: false },
    { id: 'twitter', name: 'Twitter / X', cls: 'twitter', hint: 'https://x.com/user/status/...', isSearch: false }
  ];

  const getSearchPlaceholder = () => {
    if (searchPlatform === 'youtube') return '🔍 Tìm kiếm video YouTube (ví dụ: lofi chill, nhạc trẻ...) hoặc dán link...';
    if (searchPlatform === 'soundcloud') return '🎵 Tìm kiếm nhạc SoundCloud (ví dụ: lofi, remix...) hoặc dán link...';
    return t('urlPlaceholder');
  };

  return (
    <div className="downloader-tab-wrapper">
      {/* Floating Service Dust Particles Background */}
      <div className="bg-dust-container">
        {dustParticles.map((p) => (
          <span key={p.id} className="dust-particle-item" style={p.style}>
            <Globe size={11} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle', opacity: 0.7 }} />
            {p.name}
          </span>
        ))}
      </div>

      {/* Centered Search Container */}
      {!mediaInfo && (
        <div className="hero-search-container fade-in-up">
          <h1 className="center-app-title">{t('appName')}</h1>

          {/* Quick Search Mode Switchers */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
            <span
              className={`site-pill-badge youtube ${searchPlatform === 'youtube' ? 'active' : ''}`}
              onClick={() => setSearchPlatform('youtube')}
              title="Chế độ tìm kiếm video YouTube"
            >
              <Film size={13} color={searchPlatform === 'youtube' ? '#fca5a5' : undefined} />
              <span>YouTube Search</span>
            </span>
            <span
              className={`site-pill-badge soundcloud ${searchPlatform === 'soundcloud' ? 'active' : ''}`}
              onClick={() => {
                setSearchPlatform('soundcloud');
                updateDraft({ formatType: 'audio' });
              }}
              title="Chế độ tìm kiếm nhạc SoundCloud"
            >
              <Music size={13} color={searchPlatform === 'soundcloud' ? '#fcd34d' : undefined} />
              <span>SoundCloud Search</span>
            </span>
            <span
              className={`site-pill-badge ${searchPlatform === 'auto' ? 'active' : ''}`}
              onClick={() => setSearchPlatform('auto')}
              title="Chế độ dán trực tiếp URL video/bài hát"
            >
              <Globe size={13} />
              <span>Dán Link URL</span>
            </span>
          </div>

          <div className="google-search-bar">
            <Search className="search-icon-left" size={20} />
            <input
              type="text"
              className="google-search-input"
              placeholder={getSearchPlaceholder()}
              value={url}
              onChange={handleUrlInputChange}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              autoFocus
            />

            {url && (
              <button
                type="button"
                className="btn-clear-input"
                onClick={() => updateDraft({ url: '' })}
                title="Xóa liên kết"
              >
                <X size={15} />
              </button>
            )}

            <button
              type="button"
              className="btn-paste-clipboard"
              onClick={handlePasteClipboard}
              title={t('pasteClipboard')}
            >
              <Clipboard size={16} />
            </button>

            <button
              className="btn-analyze-pill"
              onClick={() => handleAnalyze()}
              disabled={isAnalyzing || !url.trim()}
            >
              {isAnalyzing ? (
                <>
                  <Clock size={16} className="spin" />
                  <span>{t('analyzing')}</span>
                </>
              ) : (
                <>
                  <Search size={16} />
                  <span>{searchPlatform !== 'auto' && !url.trim().startsWith('http') ? 'Tìm kiếm' : t('analyzeBtn')}</span>
                </>
              )}
            </button>
          </div>

          {detectedPlatform && (
            <div style={{ marginTop: '14px', fontSize: '12px', color: '#c084fc', background: 'rgba(192, 132, 252, 0.12)', border: '1px solid rgba(192, 132, 252, 0.3)', padding: '6px 14px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px' }} className="fade-in-up">
              <Sparkles size={14} color="#c084fc" />
              <span>{t('detectedPlatform', { platform: detectedPlatform.platformName })}</span>
            </div>
          )}

          {isAnalyzing && (
            <div className="analyzing-shimmer-card fade-in-up">
              <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc', fontSize: '13px', fontWeight: '600' }}>
                  <Loader2 size={16} className="spin" />
                  <span>{searchPlatform !== 'auto' && !url.trim().startsWith('http') ? `Đang tìm kiếm trên ${searchPlatform === 'soundcloud' ? 'SoundCloud' : 'YouTube'}...` : t('analyzing')}</span>
                </div>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>yt-dlp engine</span>
              </div>
              <div className="analyzing-pulse-bar" />
            </div>
          )}

          {analyzeError && (
            <div className="analyze-error-toast fade-in-up">
              <AlertTriangle size={16} />
              <span>{analyzeError}</span>
            </div>
          )}

        </div>
      )}

      {/* Result Card State */}
      {mediaInfo && (
        (mediaInfo.isSearch || (mediaInfo.isPlaylist && mediaInfo.searchPlatform)) ? (
          <div className="search-results-section fade-in-up">
            {/* Search Results Header */}
            <div className="search-results-header">
              <div className="search-results-top-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={resetSearch}
                    style={{ padding: '8px 14px', fontSize: '13px' }}
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>

                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                      {mediaInfo.searchPlatform === 'soundcloud' ? (
                        <>
                          <Music size={18} color="#f59e0b" />
                          <span>Kết quả tìm kiếm SoundCloud</span>
                        </>
                      ) : (
                        <>
                          <Film size={18} color="#ef4444" />
                          <span>Kết quả tìm kiếm YouTube</span>
                        </>
                      )}
                    </h2>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                      Từ khóa: "{mediaInfo.searchQuery || url}" ({mediaInfo.info.entries?.length || 0} kết quả)
                    </p>
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={handleAddAllToQueue}
                  disabled={!mediaInfo.info.entries || mediaInfo.info.entries.length === 0}
                  style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {batchAdded ? <Check size={16} /> : <ListPlus size={16} />}
                  <span>{batchAdded ? 'Đã thêm tất cả!' : `Thêm tất cả (${mediaInfo.info.entries?.length || 0}) vào Queue`}</span>
                </button>
              </div>

              {/* Format options for queue items */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>Định dạng khi bấm +:</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => updateDraft({ formatType: 'video' })}
                    style={{
                      padding: '4px 12px',
                      fontSize: '12px',
                      background: formatType === 'video' ? 'rgba(139, 92, 246, 0.25)' : undefined,
                      borderColor: formatType === 'video' ? '#8b5cf6' : undefined,
                      color: formatType === 'video' ? '#fff' : undefined
                    }}
                  >
                    <Film size={13} style={{ marginRight: '4px' }} /> Video (MP4)
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => updateDraft({ formatType: 'audio' })}
                    style={{
                      padding: '4px 12px',
                      fontSize: '12px',
                      background: formatType === 'audio' ? 'rgba(139, 92, 246, 0.25)' : undefined,
                      borderColor: formatType === 'audio' ? '#8b5cf6' : undefined,
                      color: formatType === 'audio' ? '#fff' : undefined
                    }}
                  >
                    <Music size={13} style={{ marginRight: '4px' }} /> Audio (MP3/M4A)
                  </button>
                </div>
              </div>
            </div>

            {/* Search Results Grid (YouTube list layout) */}
            <div className="search-results-grid">
              {mediaInfo.info.entries && mediaInfo.info.entries.map((item, idx) => {
                const isAdded = !!addedToQueueMap[item.url];
                return (
                  <div key={item.url || idx} className="yt-video-card">
                    {/* Thumbnail */}
                    <div className="yt-thumb-wrapper">
                      <img
                        src={item.thumbnail || 'https://via.placeholder.com/400x225?text=No+Thumbnail'}
                        alt={item.title}
                        className="yt-thumb-img"
                      />
                      <div className="yt-platform-badge">
                        {mediaInfo.searchPlatform === 'soundcloud' ? <Music size={11} color="#f59e0b" /> : <Film size={11} color="#ef4444" />}
                        <span>{mediaInfo.searchPlatform === 'soundcloud' ? 'SoundCloud' : 'YouTube'}</span>
                      </div>
                      {item.duration && (
                        <div className="yt-duration-pill">
                          {formatDuration(item.duration)}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="yt-card-content">
                      <div>
                        <h3 className="yt-video-title" title={item.title}>
                          {item.title}
                        </h3>
                        <p className="yt-uploader-name">
                          <Sparkles size={12} color="#8b5cf6" />
                          <span>{item.uploader || 'N/A'}</span>
                        </p>
                      </div>

                      {/* Action row with + button */}
                      <div className="yt-card-actions">
                        <button
                          type="button"
                          className={`btn-add-queue-card ${isAdded ? 'added' : ''}`}
                          onClick={() => handleAddToQueue(item)}
                          disabled={isAdded}
                        >
                          {isAdded ? (
                            <>
                              <Check size={16} />
                              <span>Đã thêm vào Queue</span>
                            </>
                          ) : (
                            <>
                              <Plus size={16} />
                              <span>Thêm vào Queue</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          className="btn-inspect-card"
                          onClick={() => handleInspectSingle(item)}
                          title="Xem chi tiết & Tùy chỉnh"
                        >
                          <SlidersHorizontal size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="downloader-result-container">
            {/* 0. Top Bar: Back button on left, OK button on right (mobile) / Advanced tab on right (desktop) */}
            <div className="downloader-top-actions">
              <button
                className="btn btn-secondary"
                onClick={resetSearch}
                style={{ padding: '8px 14px', fontSize: '13px' }}
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  className="btn btn-secondary desktop-only-btn"
                  onClick={goToAdvanced}
                  style={{ padding: '8px 14px', fontSize: '13px', color: '#c084fc', borderColor: 'rgba(192, 132, 252, 0.3)' }}
                >
                  <SlidersHorizontal size={14} />
                  <span>{t('navAdvanced')}</span>
                </button>

                <button
                  className="btn btn-primary mobile-ok-btn"
                  onClick={handleStartDownload}
                  disabled={mediaInfo.isPlaylist && playlistSelectedIndexes.length === 0}
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  <Check size={16} />
                  <span>OK ({mediaInfo.isPlaylist ? playlistSelectedIndexes.length : 'Tải ngay'})</span>
                </button>
              </div>
            </div>

            <section className="card preview-card-animated fade-in-up">
              <div className="preview-card-grid">
                {/* 1. Thumbnail, 2. Title, 3. Artist / Uploader */}
                <div className="preview-meta-column">
                  {/* 1. Thumbnail */}
                  <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', background: '#000' }}>
                    <img
                      src={mediaInfo.info.thumbnail || 'https://via.placeholder.com/400x225?text=No+Thumbnail'}
                      alt="Thumbnail"
                      style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }}
                    />
                    {mediaInfo.info.duration && (
                      <span style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.8)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', color: '#fff' }}>
                        {formatDuration(mediaInfo.info.duration)}
                      </span>
                    )}
                  </div>

                  {/* 2. Title */}
                  <h3 style={{ fontSize: '14px', fontWeight: '600', marginTop: '10px', color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {mediaInfo.info.title}
                  </h3>

                  {/* 3. Uploader / Artist */}
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                    {mediaInfo.info.uploader || 'Web Media'}
                  </p>

                  {mediaInfo.isPlaylist && (
                    <div style={{ marginTop: '8px', background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', display: 'inline-block' }}>
                      {t('playlistTitle')} ({t('playlistItemCount', { count: mediaInfo.info.entriesCount || mediaInfo.info.entries?.length || 0 })})
                    </div>
                  )}
                </div>

                {/* 4. Settings Column (Basic 4.1, Advanced 4.2, Playlist 5) */}
                <div className="preview-config-column">
                  {/* 4.1 BASIC DOWNLOAD SETTINGS (Hiển thị) */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#f8fafc' }}>
                        {t('formatHeader')}
                      </h3>
                      {detectedPlatform && (
                        <span style={{ fontSize: '11px', color: '#c084fc', background: 'rgba(192, 132, 252, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                          {detectedPlatform.platformName}
                        </span>
                      )}
                    </div>

                    {/* Mobile Format Select Dropdown */}
                    <div className="mobile-format-select-container">
                      <select
                        className="text-input"
                        style={{ width: '100%', padding: '10px 14px', fontSize: '13px', fontWeight: '600' }}
                        value={formatType}
                        onChange={(e) => updateDraft({ formatType: e.target.value })}
                      >
                        <option value="video">🎬 {t('formatVideo')} (MP4)</option>
                        <option value="audio">🎵 {t('formatAudio')} (MP3/M4A/FLAC)</option>
                        <option value="gif">🖼️ {t('formatGif')}</option>
                        <option value="thumbnail">📷 {t('formatThumbnail')}</option>
                      </select>
                    </div>

                    {/* Format Toggle Group (Desktop) */}
                    <div className="format-toggle-group">
                      <div
                        className={`format-option-card ${formatType === 'video' ? 'selected' : ''}`}
                        onClick={() => updateDraft({ formatType: 'video' })}
                      >
                        <Film size={18} />
                        <span style={{ fontWeight: '600', fontSize: '12px' }}>{t('formatVideo')} (MP4)</span>
                      </div>

                      <div
                        className={`format-option-card ${formatType === 'audio' ? 'selected' : ''}`}
                        onClick={() => updateDraft({ formatType: 'audio' })}
                      >
                        <Music size={18} />
                        <span style={{ fontWeight: '600', fontSize: '12px' }}>{t('formatAudio')}</span>
                      </div>

                      <div
                        className={`format-option-card ${formatType === 'gif' ? 'selected' : ''}`}
                        onClick={() => updateDraft({ formatType: 'gif' })}
                      >
                        <ImageIcon size={18} />
                        <span style={{ fontWeight: '600', fontSize: '12px' }}>{t('formatGif')}</span>
                      </div>

                      <div
                        className={`format-option-card ${formatType === 'thumbnail' ? 'selected' : ''}`}
                        onClick={() => updateDraft({ formatType: 'thumbnail' })}
                      >
                        <ImageIcon size={18} color="#c084fc" />
                        <span style={{ fontWeight: '600', fontSize: '12px' }}>{t('formatThumbnail')}</span>
                      </div>
                    </div>

                    {/* Dynamic Format Tuning Section */}
                    <div style={{ marginTop: '14px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
                      {/* THUMBNAIL ONLY MODE OPTIONS */}
                      {formatType === 'thumbnail' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px' }}>
                          <span style={{ fontSize: '13px', color: '#c084fc', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ImageIcon size={16} color="#c084fc" />
                            {t('formatThumbnail')}
                          </span>
                          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: '1.5' }}>
                            {t('writeThumbnailOpt')}
                          </p>
                        </div>
                      )}

                      {/* VIDEO OPTIONS */}
                      {formatType === 'video' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div className="downloader-options-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                                {t('qualityLabel')}
                              </label>
                              <select
                                className="text-input"
                                style={{ width: '100%', padding: '6px 10px', fontSize: '13px' }}
                                value={videoQuality}
                                onChange={(e) => updateDraft({ videoQuality: e.target.value })}
                              >
                                <option value="best">{t('qualityBest')}</option>
                                <option value="1080p">{t('quality1080p')}</option>
                                <option value="720p">{t('quality720p')}</option>
                                <option value="480p">{t('quality480p')}</option>
                                <option value="360p">360p (SD)</option>
                              </select>
                            </div>

                            <div>
                              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                                {t('fpsLabel')}
                              </label>
                              <select
                                className="text-input"
                                style={{ width: '100%', padding: '6px 10px', fontSize: '13px' }}
                                value={videoFps}
                                onChange={(e) => updateDraft({ videoFps: e.target.value })}
                              >
                                <option value="auto">{t('fpsAuto')}</option>
                                <option value="60">{t('fps60')}</option>
                                <option value="30">{t('fps30')}</option>
                                <option value="24">24 FPS</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                              {t('containerLabel')}
                            </label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {[
                                { id: 'mp4', name: t('containerMp4') },
                                { id: 'mkv', name: t('containerMkv') },
                                { id: 'webm', name: t('containerWebm') }
                              ].map((c) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => updateDraft({ videoContainer: c.id })}
                                  style={{
                                    flex: 1,
                                    padding: '6px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    border: videoContainer === c.id ? '1px solid #8b5cf6' : '1px solid var(--border-color)',
                                    background: videoContainer === c.id ? 'rgba(139, 92, 246, 0.2)' : 'rgba(0,0,0,0.3)',
                                    color: videoContainer === c.id ? '#fff' : '#94a3b8',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {c.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* AUDIO OPTIONS */}
                      {formatType === 'audio' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div className="downloader-options-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                                {t('audioQualityLabel')}
                              </label>
                              <select
                                className="text-input"
                                style={{ width: '100%', padding: '6px 10px', fontSize: '13px' }}
                                value={audioQuality}
                                onChange={(e) => updateDraft({ audioQuality: e.target.value })}
                              >
                                <option value="mp3-320">{t('audioMp3_320')}</option>
                                <option value="mp3-256">{t('audioMp3_256')}</option>
                                <option value="mp3-128">{t('audioMp3_128')}</option>
                                <option value="m4a">{t('audioM4a')}</option>
                                <option value="flac">{t('audioFlac')}</option>
                                <option value="wav">{t('audioWav')}</option>
                              </select>
                            </div>

                            <div>
                              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                                {t('audioSampleRateLabel')}
                              </label>
                              <select
                                className="text-input"
                                style={{ width: '100%', padding: '6px 10px', fontSize: '13px' }}
                                value={audioSampleRate}
                                onChange={(e) => updateDraft({ audioSampleRate: e.target.value })}
                              >
                                <option value="auto">{t('sampleRateAuto')}</option>
                                <option value="48000">{t('sampleRate48k')}</option>
                                <option value="44100">{t('sampleRate44k')}</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* GIF OPTIONS */}
                      {formatType === 'gif' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div className="downloader-gif-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                            <div>
                              <label style={{ fontSize: '12px', color: '#c084fc', display: 'block', marginBottom: '4px' }}>
                                {t('gifFpsLabel')}
                              </label>
                              <select
                                className="text-input"
                                style={{ width: '100%', padding: '6px 10px', fontSize: '12px' }}
                                value={gifFps}
                                onChange={(e) => updateDraft({ gifFps: e.target.value })}
                              >
                                <option value="10">10 FPS</option>
                                <option value="15">15 FPS</option>
                                <option value="20">20 FPS</option>
                                <option value="30">30 FPS</option>
                              </select>
                            </div>

                            <div>
                              <label style={{ fontSize: '12px', color: '#c084fc', display: 'block', marginBottom: '4px' }}>
                                {t('gifResLabel')}
                              </label>
                              <select
                                className="text-input"
                                style={{ width: '100%', padding: '6px 10px', fontSize: '12px' }}
                                value={gifRes}
                                onChange={(e) => updateDraft({ gifRes: e.target.value })}
                              >
                                <option value="480p">480p</option>
                                <option value="360p">360p</option>
                                <option value="240p">240p</option>
                              </select>
                            </div>

                            <div>
                              <label style={{ fontSize: '12px', color: '#c084fc', display: 'block', marginBottom: '4px' }}>
                                {t('gifSpeedLabel')}
                              </label>
                              <select
                                className="text-input"
                                style={{ width: '100%', padding: '6px 10px', fontSize: '12px' }}
                                value={gifSpeed}
                                onChange={(e) => updateDraft({ gifSpeed: e.target.value })}
                              >
                                <option value="1.0">1.0x</option>
                                <option value="1.25">1.25x</option>
                                <option value="1.5">1.5x</option>
                                <option value="2.0">2.0x</option>
                                <option value="0.5">0.5x</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4.2 ADVANCED DOWNLOAD SETTINGS (Có nút Ẩn/Hiện Toggle) */}
                  <div style={{ marginTop: '14px' }}>
                    <button
                      type="button"
                      onClick={() => setShowAdvancedInResult(!showAdvancedInResult)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        padding: '10px 14px',
                        background: 'rgba(30, 41, 59, 0.6)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        color: '#c084fc',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <SlidersHorizontal size={15} />
                        <span>Cài đặt nâng cao (Metadata, Cắt video...)</span>
                      </div>
                      {showAdvancedInResult ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {showAdvancedInResult && (
                      <div className="fade-in-up" style={{ marginTop: '10px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
                        {/* SEPARATE ASSETS EXTRACTION OPTIONS */}
                        <div>
                          <label style={{ fontSize: '12px', color: '#f8fafc', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                            <Sliders size={14} color="#a7f3d0" />
                            <span>{t('metadataOptions')}</span>
                          </label>
                          <div className="metadata-options-grid">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={!!writeThumbnail}
                                onChange={(e) => updateDraft({ writeThumbnail: e.target.checked })}
                              />
                              <span>{t('writeThumbnailOpt')}</span>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={!!advancedOptions.writeSubs}
                                onChange={(e) => {
                                  if (setAdvancedOptions) {
                                    setAdvancedOptions((prev) => ({ ...prev, writeSubs: e.target.checked }));
                                  }
                                }}
                              />
                              <span>{t('writeSubs')}</span>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={!!writeDescription}
                                onChange={(e) => updateDraft({ writeDescription: e.target.checked })}
                              />
                              <span>{t('writeDescriptionOpt')}</span>
                            </label>
                          </div>
                        </div>

                        {/* INLINE MEDIA TRIM SECTION */}
                        {formatType !== 'thumbnail' && (
                          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                            <label style={{ fontSize: '12px', color: '#f8fafc', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                              <Scissors size={14} color="#3b82f6" />
                              <span>{t('trimLabel')}</span>
                            </label>
                            <div className="downloader-trim-grid">
                              <div>
                                <input
                                  type="text"
                                  className="text-input"
                                  style={{ width: '100%', padding: '6px 10px', fontSize: '12px' }}
                                  placeholder={t('trimStart')}
                                  value={trimStart}
                                  onChange={(e) => updateDraft({ trimStart: e.target.value })}
                                />
                              </div>

                              <div>
                                <input
                                  type="text"
                                  className="text-input"
                                  style={{ width: '100%', padding: '6px 10px', fontSize: '12px' }}
                                  placeholder={t('trimEnd')}
                                  value={trimEnd}
                                  onChange={(e) => updateDraft({ trimEnd: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {(advancedOptions.writeSubs || advancedOptions.downloadSections || advancedOptions.cookiesFromBrowser !== 'none' || advancedOptions.customArgs) && (
                          <div style={{ marginTop: '12px', padding: '8px 12px', background: 'rgba(139, 92, 246, 0.12)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.25)', fontSize: '11px', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Terminal size={12} />
                            <span>CLI options active from Advanced Tab.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 5. PLAYLIST INSPECTOR SECTION (nếu có) */}
                  {mediaInfo.isPlaylist && mediaInfo.info.entries && mediaInfo.info.entries.length > 0 && (
                    <PlaylistInspector
                      entries={mediaInfo.info.entries}
                      selectedIndexes={playlistSelectedIndexes}
                      setSelectedIndexes={setPlaylistSelectedIndexes}
                    />
                  )}

                  {/* Bottom Main Download Button */}
                  <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '14px' }}
                      onClick={handleStartDownload}
                      disabled={mediaInfo.isPlaylist && playlistSelectedIndexes.length === 0}
                    >
                      <Download size={18} />
                      <span>
                        {mediaInfo.isPlaylist
                          ? `Download (${playlistSelectedIndexes.length})`
                          : t('startDownload')}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        ))}
    </div>
  );
}
