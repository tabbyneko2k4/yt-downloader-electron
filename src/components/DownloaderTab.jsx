import React, { useState, useEffect } from 'react';
import { Search, Film, Music, Image as ImageIcon, Download, Play, AlertTriangle, Terminal, Clock, Clipboard, ArrowLeft, Globe, SlidersHorizontal, Scissors, Sliders, Volume2, Gauge, CheckCircle2, ChevronDown, ChevronUp, PauseCircle, Loader2, Sparkles, FileText, X, Zap, Layers, Cpu } from 'lucide-react';
import PlaylistInspector from './PlaylistInspector';
import { detectFormatFromUrl } from '../utils/formatDetector';

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const [playlistSelectedIndexes, setPlaylistSelectedIndexes] = useState([]);
  const [expandedActiveTasks, setExpandedActiveTasks] = useState({});
  const [detectedPlatform, setDetectedPlatform] = useState(null);

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

  // Analyze URL handler
  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setIsAnalyzing(true);
    setAnalyzeError('');
    applyAutoFormatRule(url.trim());

    try {
      if (window.api && window.api.getVideoInfo) {
        const res = await window.api.getVideoInfo(url.trim());
        if (res.success) {
          updateDraft({ mediaInfo: res });
          if (res.isPlaylist && res.info.entries) {
            const allIdx = res.info.entries.map((_, i) => i + 1);
            setPlaylistSelectedIndexes(allIdx);
          }
        } else {
          setAnalyzeError('Không thể lấy thông tin media. Vui lòng kiểm tra lại URL.');
        }
      } else {
        // Fallback mockup
        updateDraft({
          mediaInfo: {
            success: true,
            isPlaylist: false,
            info: {
              title: 'Sample Video - Demo Media Downloader',
              uploader: 'Demo Channel',
              duration: 215,
              thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80',
              webpage_url: url
            }
          }
        });
      }
    } catch (err) {
      setAnalyzeError(err.message || 'Lỗi khi phân tích liên kết.');
    } finally {
      setIsAnalyzing(false);
    }
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
      const duration = 20 + (i % 8) * 4;
      const delay = -((i * 4.3) % 30);
      const opacity = 0.04 + ((i % 5) * 0.015);
      const fontSize = 10 + (i % 3);

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
    { name: 'YouTube', cls: 'youtube', hint: 'https://youtube.com/watch?v=...' },
    { name: 'TikTok', cls: 'tiktok', hint: 'https://tiktok.com/@user/video/...' },
    { name: 'Facebook', cls: 'facebook', hint: 'https://facebook.com/watch/...' },
    { name: 'SoundCloud', cls: 'soundcloud', hint: 'https://soundcloud.com/artist/track' },
    { name: 'Instagram', cls: 'instagram', hint: 'https://instagram.com/reel/...' },
    { name: 'Twitter / X', cls: 'twitter', hint: 'https://x.com/user/status/...' }
  ];

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
          <h1 className="center-app-title">Media Downloader</h1>
          <div className="google-search-bar">
            <Search className="search-icon-left" size={20} />
            <input
              type="text"
              className="google-search-input"
              placeholder="Dán URL Youtube, TikTok, Facebook, SoundCloud vào đây..."
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
              title="Dán từ Clipboard"
            >
              <Clipboard size={16} />
            </button>

            <button
              className="btn-analyze-pill"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !url.trim()}
            >
              {isAnalyzing ? (
                <>
                  <Clock size={16} className="spin" />
                  <span>Phân tích...</span>
                </>
              ) : (
                <>
                  <Search size={16} />
                  <span>Phân tích</span>
                </>
              )}
            </button>
          </div>

          {detectedPlatform && (
            <div style={{ marginTop: '14px', fontSize: '12px', color: '#c084fc', background: 'rgba(192, 132, 252, 0.12)', border: '1px solid rgba(192, 132, 252, 0.3)', padding: '6px 14px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px' }} className="fade-in-up">
              <Sparkles size={14} color="#c084fc" />
              <span>Tự động nhận diện nguồn <strong>{detectedPlatform.platformName}</strong> → Định dạng <strong>{detectedPlatform.formatType === 'video' ? 'Video (MP4)' : 'Audio (MP3)'}</strong></span>
            </div>
          )}

          {isAnalyzing && (
            <div className="analyzing-shimmer-card fade-in-up">
              <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc', fontSize: '13px', fontWeight: '600' }}>
                  <Loader2 size={16} className="spin" />
                  <span>Đang kết nối & giải mã URL phương tiện...</span>
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

          {/* Quick Supported Platforms Badges */}
          <div className="supported-badges-row">
            {quickPlatforms.map((p) => (
              <span
                key={p.name}
                className={`site-pill-badge ${p.cls}`}
                onClick={() => {
                  if (!url) updateDraft({ url: p.hint });
                }}
                title={`Nhấp để dùng mẫu liên kết ${p.name}`}
              >
                <Globe size={13} />
                {p.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Result Card State */}
      {mediaInfo && (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <button
              className="btn btn-secondary"
              onClick={resetSearch}
              style={{ padding: '8px 14px', fontSize: '13px' }}
            >
              <ArrowLeft size={14} />
              <span>Nhập liên kết khác</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={goToAdvanced}
              style={{ padding: '8px 14px', fontSize: '13px', color: '#c084fc', borderColor: 'rgba(192, 132, 252, 0.3)' }}
            >
              <SlidersHorizontal size={14} />
              <span>Cấu hình CLI Nâng cao</span>
            </button>
          </div>

          <section className="card preview-card-animated fade-in-up">
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px' }}>
              {/* Thumbnail & Meta */}
              <div>
                <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', background: '#000' }}>
                  <img
                    src={mediaInfo.info.thumbnail || 'https://via.placeholder.com/400x225?text=No+Thumbnail'}
                    alt="Thumbnail"
                    style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }}
                  />
                  {mediaInfo.info.duration && (
                    <span style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.8)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', color: '#fff' }}>
                      {formatDuration(mediaInfo.info.duration)}
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginTop: '10px', color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {mediaInfo.info.title}
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  {mediaInfo.info.uploader || 'Nguồn web'}
                </p>
                {mediaInfo.isPlaylist && (
                  <div style={{ marginTop: '8px', background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', display: 'inline-block' }}>
                    Playlist ({mediaInfo.info.entriesCount} mục)
                  </div>
                )}
              </div>

              {/* Download Configuration */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#f8fafc' }}>
                    Cấu hình định dạng tải xuống
                  </h3>
                  {detectedPlatform && (
                    <span style={{ fontSize: '11px', color: '#c084fc', background: 'rgba(192, 132, 252, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                      Tự động theo {detectedPlatform.platformName}
                    </span>
                  )}
                </div>

                {/* Format Toggle Group */}
                <div className="format-toggle-group" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  <div
                    className={`format-option-card ${formatType === 'video' ? 'selected' : ''}`}
                    onClick={() => updateDraft({ formatType: 'video' })}
                  >
                    <Film size={18} />
                    <span style={{ fontWeight: '600', fontSize: '12px' }}>Video (MP4)</span>
                  </div>

                  <div
                    className={`format-option-card ${formatType === 'audio' ? 'selected' : ''}`}
                    onClick={() => updateDraft({ formatType: 'audio' })}
                  >
                    <Music size={18} />
                    <span style={{ fontWeight: '600', fontSize: '12px' }}>Audio (Âm thanh)</span>
                  </div>

                  <div
                    className={`format-option-card ${formatType === 'gif' ? 'selected' : ''}`}
                    onClick={() => updateDraft({ formatType: 'gif' })}
                  >
                    <ImageIcon size={18} />
                    <span style={{ fontWeight: '600', fontSize: '12px' }}>GIF (Ảnh động)</span>
                  </div>

                  <div
                    className={`format-option-card ${formatType === 'thumbnail' ? 'selected' : ''}`}
                    onClick={() => updateDraft({ formatType: 'thumbnail' })}
                  >
                    <ImageIcon size={18} color="#c084fc" />
                    <span style={{ fontWeight: '600', fontSize: '12px' }}>Chỉ Ảnh bìa</span>
                  </div>
                </div>

                {/* Dynamic Rich Format Tuning Section */}
                <div style={{ marginTop: '16px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
                  
                  {/* THUMBNAIL ONLY MODE OPTIONS */}
                  {formatType === 'thumbnail' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px' }}>
                      <span style={{ fontSize: '13px', color: '#c084fc', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ImageIcon size={16} color="#c084fc" />
                        Chế độ Chỉ tải Ảnh bìa (Thumbnail / Artwork Only)
                      </span>
                      <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: '1.5' }}>
                        Hệ thống sẽ bỏ qua luồng video/âm thanh và chỉ tải về tệp hình ảnh bìa chất lượng gốc cao nhất dưới dạng <code>.jpg</code> vào thư mục lưu trữ.
                      </p>
                    </div>
                  )}

                  {/* VIDEO OPTIONS */}
                  {formatType === 'video' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                            Độ phân giải / Chất lượng
                          </label>
                          <select
                            className="text-input"
                            style={{ width: '100%', padding: '6px 10px', fontSize: '13px' }}
                            value={videoQuality}
                            onChange={(e) => updateDraft({ videoQuality: e.target.value })}
                          >
                            <option value="best">Tốt nhất (4K/2K/1080p)</option>
                            <option value="1080p">Full HD 1080p</option>
                            <option value="720p">HD 720p</option>
                            <option value="480p">SD 480p</option>
                            <option value="360p">Low 360p</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                            Tốc độ khung hình (FPS)
                          </label>
                          <select
                            className="text-input"
                            style={{ width: '100%', padding: '6px 10px', fontSize: '13px' }}
                            value={videoFps}
                            onChange={(e) => updateDraft({ videoFps: e.target.value })}
                          >
                            <option value="auto">Tự động chọn FPS cao nhất</option>
                            <option value="60">60 FPS (Khung hình mượt)</option>
                            <option value="30">30 FPS (Tiêu chuẩn)</option>
                            <option value="24">24 FPS (Cinematic)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                          Định dạng Container Video
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {[
                            { id: 'mp4', name: 'MP4 (Phổ biến)' },
                            { id: 'mkv', name: 'MKV (Đa luồng sub)' },
                            { id: 'webm', name: 'WEBM (Nhẹ)' }
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
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                            Định dạng & Bitrate Âm thanh
                          </label>
                          <select
                            className="text-input"
                            style={{ width: '100%', padding: '6px 10px', fontSize: '13px' }}
                            value={audioQuality}
                            onChange={(e) => updateDraft({ audioQuality: e.target.value })}
                          >
                            <option value="mp3-320">MP3 320 kbps (Chất lượng cao nhất)</option>
                            <option value="mp3-192">MP3 192 kbps (Tiêu chuẩn)</option>
                            <option value="wav">WAV (Lossless không nén)</option>
                            <option value="flac">FLAC (Lossless)</option>
                            <option value="m4a">M4A (AAC Audio)</option>
                            <option value="opus">OPUS (Web Audio)</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                            Tần số lấy mẫu (Sample Rate)
                          </label>
                          <select
                            className="text-input"
                            style={{ width: '100%', padding: '6px 10px', fontSize: '13px' }}
                            value={audioSampleRate}
                            onChange={(e) => updateDraft({ audioSampleRate: e.target.value })}
                          >
                            <option value="auto">Tự động theo file gốc</option>
                            <option value="48000">48.0 kHz (Chất lượng Studio)</option>
                            <option value="44100">44.1 kHz (Chuẩn CD Audio)</option>
                            <option value="22050">22.05 kHz (Dung lượng siêu nhẹ)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* GIF OPTIONS */}
                  {formatType === 'gif' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '12px', color: '#c084fc', display: 'block', marginBottom: '4px' }}>
                            Tốc độ khung hình (FPS)
                          </label>
                          <select
                            className="text-input"
                            style={{ width: '100%', padding: '6px 10px', fontSize: '12px' }}
                            value={gifFps}
                            onChange={(e) => updateDraft({ gifFps: e.target.value })}
                          >
                            <option value="10">10 FPS (Dung lượng nhỏ)</option>
                            <option value="15">15 FPS (Cân bằng khuyên dùng)</option>
                            <option value="20">20 FPS (Mượt mà)</option>
                            <option value="30">30 FPS (Chất lượng cao)</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', color: '#c084fc', display: 'block', marginBottom: '4px' }}>
                            Độ phân giải GIF
                          </label>
                          <select
                            className="text-input"
                            style={{ width: '100%', padding: '6px 10px', fontSize: '12px' }}
                            value={gifRes}
                            onChange={(e) => updateDraft({ gifRes: e.target.value })}
                          >
                            <option value="480p">480p (Tiêu chuẩn)</option>
                            <option value="360p">360p (Vừa phải)</option>
                            <option value="240p">240p (Nhỏ gọn)</option>
                            <option value="160p">160p (Siêu nhẹ)</option>
                            <option value="original">Kích thước gốc</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', color: '#c084fc', display: 'block', marginBottom: '4px' }}>
                            Tốc độ phát GIF
                          </label>
                          <select
                            className="text-input"
                            style={{ width: '100%', padding: '6px 10px', fontSize: '12px' }}
                            value={gifSpeed}
                            onChange={(e) => updateDraft({ gifSpeed: e.target.value })}
                          >
                            <option value="1.0">1.0x (Tốc độ gốc)</option>
                            <option value="1.25">1.25x (Nhanh nhẹ)</option>
                            <option value="1.5">1.5x (Nhanh)</option>
                            <option value="2.0">2.0x (Tốc độ gấp đôi)</option>
                            <option value="0.5">0.5x (Chậm / Slow Motion)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SEPARATE ASSETS EXTRACTION OPTIONS (TÁCH LẺ ẢNH BÌA, PHỤ ĐỀ, MÔ TẢ) */}
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                    <label style={{ fontSize: '12px', color: '#f8fafc', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <Sliders size={14} color="#a7f3d0" />
                      <span>Tách lẻ tệp đính kèm (Extract Separate Assets)</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={!!writeThumbnail}
                          onChange={(e) => updateDraft({ writeThumbnail: e.target.checked })}
                        />
                        <span>Tách lẻ Ảnh bìa (.jpg)</span>
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
                        <span>Tách lẻ Phụ đề (.vtt)</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={!!writeDescription}
                          onChange={(e) => updateDraft({ writeDescription: e.target.checked })}
                        />
                        <span>Tách lẻ Mô tả (.txt)</span>
                      </label>
                    </div>
                  </div>

                  {/* INLINE VIDEO / AUDIO / GIF TRIM SECTION */}
                  {formatType !== 'thumbnail' && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                      <label style={{ fontSize: '12px', color: '#f8fafc', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Scissors size={14} color="#3b82f6" />
                        <span>Cắt khoảng thời gian tệp (Trim Media Segment)</span>
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Thời điểm bắt đầu (Từ):</span>
                          <input
                            type="text"
                            className="text-input"
                            style={{ width: '100%', padding: '6px 10px', fontSize: '12px' }}
                            placeholder="VD: 00:00:05"
                            value={trimStart}
                            onChange={(e) => updateDraft({ trimStart: e.target.value })}
                          />
                        </div>

                        <div>
                          <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Thời điểm kết thúc (Đến):</span>
                          <input
                            type="text"
                            className="text-input"
                            style={{ width: '100%', padding: '6px 10px', fontSize: '12px' }}
                            placeholder="VD: 00:00:25"
                            value={trimEnd}
                            onChange={(e) => updateDraft({ trimEnd: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* PLAYLIST INSPECTOR SECTION */}
                {mediaInfo.isPlaylist && mediaInfo.info.entries && mediaInfo.info.entries.length > 0 && (
                  <PlaylistInspector
                    entries={mediaInfo.info.entries}
                    selectedIndexes={playlistSelectedIndexes}
                    setSelectedIndexes={setPlaylistSelectedIndexes}
                  />
                )}

                {(advancedOptions.writeSubs || advancedOptions.downloadSections || advancedOptions.cookiesFromBrowser !== 'none' || advancedOptions.customArgs) && (
                  <div style={{ marginTop: '12px', padding: '8px 12px', background: 'rgba(139, 92, 246, 0.12)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.25)', fontSize: '11px', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Terminal size={12} />
                    <span>Đang áp dụng tùy chỉnh CLI từ Tab Nâng cao.</span>
                  </div>
                )}

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
                        ? `Bắt đầu tải ${playlistSelectedIndexes.length} bài đã chọn`
                        : (formatType === 'thumbnail' ? 'Tải ảnh bìa ngay' : 'Bắt đầu tải xuống ngay')}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

    </div>
  );
}
