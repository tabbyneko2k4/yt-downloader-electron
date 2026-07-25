/**
 * Shared Download Logic Helper
 * Used by Main App (DownloaderTab, AdvancedTab), Mini Window, and Chrome Extension
 */

/**
 * Extracts maximum height / resolution from mediaInfo formats array
 */
export function extractMaxResolution(mediaInfo) {
  if (!mediaInfo || !mediaInfo.info) return null;

  const info = mediaInfo.info;
  let maxHeight = 0;

  if (Array.isArray(info.formats) && info.formats.length > 0) {
    info.formats.forEach((f) => {
      if (f && typeof f.height === 'number' && f.height > maxHeight) {
        maxHeight = f.height;
      }
    });
  }

  if (maxHeight === 0 && typeof info.height === 'number' && info.height > 0) {
    maxHeight = info.height;
  }

  return maxHeight > 0 ? maxHeight : null;
}

const ALL_RESOLUTIONS = [
  { value: '2160p', label: '2160p (4K)', numHeight: 2160 },
  { value: '1440p', label: '1440p (2K)', numHeight: 1440 },
  { value: '1080p', label: '1080p (FHD)', numHeight: 1080 },
  { value: '720p', label: '720p (HD)', numHeight: 720 },
  { value: '480p', label: '480p (SD)', numHeight: 480 },
  { value: '360p', label: '360p', numHeight: 360 },
  { value: '240p', label: '240p', numHeight: 240 },
  { value: '144p', label: '144p', numHeight: 144 }
];

/**
 * Generates grouped resolution options based on mediaInfo max native resolution.
 */
export function getResolutionOptions(mediaInfo) {
  const maxRes = extractMaxResolution(mediaInfo);

  if (!maxRes) {
    return [
      {
        group: 'Độ phân giải video',
        options: [
          { value: 'best', label: '✨ Tốt nhất (Tự động)' },
          ...ALL_RESOLUTIONS.map(r => ({ value: r.value, label: r.label }))
        ]
      }
    ];
  }

  const nativeOptions = ALL_RESOLUTIONS.filter(r => r.numHeight <= maxRes);
  const higherOptions = ALL_RESOLUTIONS.filter(r => r.numHeight > maxRes);

  const result = [
    {
      group: `Gốc hỗ trợ tối đa (${maxRes}p)`,
      options: [
        { value: 'best', label: `✨ Tốt nhất (Tự động - ${maxRes}p)` },
        ...nativeOptions.map(r => ({ value: r.value, label: r.label }))
      ]
    }
  ];

  if (higherOptions.length > 0) {
    result.push({
      group: '─── Chất lượng cao hơn / Upscale ───',
      options: higherOptions.map(r => ({ value: r.value, label: `${r.label} (Upscale)` }))
    });
  }

  return result;
}

/**
 * Generates audio quality & bitrate options.
 */
export function getAudioQualityOptions() {
  return [
    {
      group: 'Định dạng MP3 (Chất lượng Bitrate)',
      options: [
        { value: 'mp3-320', label: '🎵 320 kbps (MP3 Cao nhất)' },
        { value: 'mp3-256', label: '🎵 256 kbps (MP3 High)' },
        { value: 'mp3-192', label: '🎵 192 kbps (MP3 Tiêu chuẩn)' },
        { value: 'mp3-128', label: '🎵 128 kbps (MP3 Tiết kiệm)' }
      ]
    },
    {
      group: 'Định dạng âm thanh khác',
      options: [
        { value: 'flac', label: '🎼 FLAC (Lossless Chất lượng cao)' },
        { value: 'wav', label: '🎼 WAV (Uncompressed Raw)' },
        { value: 'm4a', label: '🎼 M4A (AAC Audio)' },
        { value: 'opus', label: '🎼 OPUS (Audio Web)' }
      ]
    }
  ];
}

/**
 * Generates subtitle language options based on fetched mediaInfo.
 */
export function getSubtitleOptions(mediaInfo) {
  const manualSubs = mediaInfo?.info?.subtitles || [];
  const autoSubs = mediaInfo?.info?.automatic_captions || [];

  if (manualSubs.length === 0 && autoSubs.length === 0) {
    return [
      {
        group: 'Ngôn ngữ phổ biến',
        options: [
          { value: 'vi', label: '🇻🇳 Tiếng Việt (vi)' },
          { value: 'en', label: '🇺🇸 English (en)' },
          { value: 'ja', label: '🇯🇵 Japanese (ja)' },
          { value: 'ko', label: '🇰🇷 Korean (ko)' },
          { value: 'zh-Hans', label: '🇨🇳 Tiếng Trung (zh-Hans)' },
          { value: 'es', label: '🇪🇸 Tây Ban Nha (es)' },
          { value: 'fr', label: '🇫🇷 Tiếng Pháp (fr)' },
          { value: 'de', label: '🇩🇪 Tiếng Đức (de)' }
        ]
      }
    ];
  }

  const result = [];
  if (manualSubs.length > 0) {
    result.push({
      group: `Phụ đề chính thức từ video (${manualSubs.length})`,
      options: manualSubs.map((s) => ({
        value: s.code,
        label: `💬 ${s.name} (${s.code})`
      }))
    });
  }

  if (autoSubs.length > 0) {
    result.push({
      group: `Phụ đề tự động (${autoSubs.length})`,
      options: autoSubs.map((s) => ({
        value: s.code,
        label: `🤖 ${s.name}`
      }))
    });
  }

  return result;
}


/**
 * Standardized Download Options Builder
 * Creates consistent download options object for yt-dlp IPC or HTTP bridge
 */
export function buildDownloadOptions({
  id,
  url,
  formatType = 'video',
  videoQuality = 'best',
  audioQuality = 'mp3-320',
  quality,
  destDir,
  mediaInfo,
  playlistSelectedIndexes = [],
  advancedOptions = {},
  mediaDraft = {}
}) {
  const downloadId = id || (Date.now().toString() + '_' + Math.random().toString(36).substr(2, 4));
  const cleanUrl = (url || mediaDraft.url || '').trim();

  const isPlaylist = !!(mediaInfo && mediaInfo.isPlaylist);
  const selectedEntries = isPlaylist && mediaInfo.info && mediaInfo.info.entries
    ? mediaInfo.info.entries.filter((_, idx) => playlistSelectedIndexes.includes(idx + 1))
    : null;

  const effectiveQuality = quality || (formatType === 'video' ? videoQuality : (formatType === 'audio' ? audioQuality : (formatType === 'gif' ? 'gif' : 'thumbnail')));

  return {
    id: downloadId,
    url: cleanUrl,
    formatType,
    quality: effectiveQuality,
    destDir: destDir || advancedOptions.destDir || null,

    // Playlist info
    isPlaylist,
    playlistTitle: isPlaylist ? mediaInfo?.info?.title : null,
    playlistItems: isPlaylist && playlistSelectedIndexes.length > 0 ? playlistSelectedIndexes.join(',') : null,
    playlistEntries: selectedEntries,

    // Metadata & Embeds
    embedMetadata: mediaDraft.embedMetadata !== undefined ? mediaDraft.embedMetadata : true,
    embedThumbnail: mediaDraft.embedThumbnail !== undefined ? mediaDraft.embedThumbnail : true,
    writeThumbnail: !!mediaDraft.writeThumbnail,
    writeDescription: !!mediaDraft.writeDescription,

    // Video/Audio params
    videoFps: mediaDraft.videoFps || 'auto',
    videoContainer: mediaDraft.videoContainer || 'mp4',
    audioSampleRate: mediaDraft.audioSampleRate || 'auto',

    // GIF params
    gifFps: formatType === 'gif' ? (mediaDraft.gifFps || '15') : null,
    gifRes: formatType === 'gif' ? (mediaDraft.gifRes || '480p') : null,
    gifSpeed: formatType === 'gif' ? (mediaDraft.gifSpeed || '1.0') : null,

    // Trimming params
    trimStart: (mediaDraft.trimStart || '').trim(),
    trimEnd: (mediaDraft.trimEnd || '').trim(),

    // Advanced options
    writeSubs: !!advancedOptions.writeSubs,
    embedSubs: !!advancedOptions.embedSubs,
    subLangs: advancedOptions.writeSubs ? (advancedOptions.subLangs || 'vi,en').trim() : null,
    downloadSections: (advancedOptions.downloadSections || '').trim() || null,
    cookiesFromBrowser: advancedOptions.cookiesFromBrowser && advancedOptions.cookiesFromBrowser !== 'none' ? advancedOptions.cookiesFromBrowser : null,
    rateLimit: (advancedOptions.rateLimit || '').trim() || null,
    customFormat: (advancedOptions.customFormat || '').trim() || null,
    customArgs: (advancedOptions.customArgs || '').trim() || null,

    // Media metadata display
    mediaTitle: mediaInfo?.info?.title || mediaDraft.title || 'Media File',
    uploader: mediaInfo?.info?.uploader || mediaDraft.uploader || 'N/A',
    thumbnail: mediaInfo?.info?.thumbnail || mediaDraft.thumbnail || '',
    duration: mediaInfo?.info?.duration || mediaDraft.duration || null
  };
}
