import React from 'react';
import { Film, Download, ArrowRight, X, Sparkles } from 'lucide-react';

export default function ActiveDraftBar({ mediaDraft, setActiveTab, clearDraft, startDownload, settings, advancedOptions }) {
  if (!mediaDraft || !mediaDraft.mediaInfo) return null;

  const handleQuickDownload = () => {
    const downloadId = Date.now().toString();
    const downloadData = {
      id: downloadId,
      url: mediaDraft.url.trim(),
      formatType: mediaDraft.formatType,
      quality: mediaDraft.formatType === 'video' ? mediaDraft.videoQuality : (mediaDraft.formatType === 'audio' ? mediaDraft.audioQuality : 'gif'),
      destDir: settings.defaultPath,
      isPlaylist: mediaDraft.mediaInfo.isPlaylist,
      playlistTitle: mediaDraft.mediaInfo.isPlaylist ? mediaDraft.mediaInfo.info.title : null,
      playlistItems: mediaDraft.mediaInfo.isPlaylist ? mediaDraft.playlistItems.trim() : null,
      embedMetadata: settings.embedMetadata,
      embedThumbnail: settings.embedThumbnail,

      gifFps: mediaDraft.formatType === 'gif' ? mediaDraft.gifFps : null,
      gifRes: mediaDraft.formatType === 'gif' ? mediaDraft.gifRes : null,

      writeSubs: advancedOptions.writeSubs,
      embedSubs: advancedOptions.embedSubs,
      subLangs: advancedOptions.writeSubs ? advancedOptions.subLangs.trim() : null,
      downloadSections: advancedOptions.downloadSections.trim() || null,
      cookiesFromBrowser: advancedOptions.cookiesFromBrowser !== 'none' ? advancedOptions.cookiesFromBrowser : null,
      rateLimit: advancedOptions.rateLimit.trim() || null,
      customFormat: advancedOptions.customFormat.trim() || null,
      customArgs: advancedOptions.customArgs.trim() || null,

      mediaTitle: mediaDraft.mediaInfo.info.title,
      uploader: mediaDraft.mediaInfo.info.uploader,
      thumbnail: mediaDraft.mediaInfo.info.thumbnail,
      duration: mediaDraft.mediaInfo.info.duration
    };

    startDownload(downloadData);
    clearDraft();
  };

  return (
    <div className="active-draft-bar fade-in-up">
      <div className="draft-bar-left">
        <span className="draft-pulse-dot" />
        <div className="draft-thumb-small">
          <img src={mediaDraft.mediaInfo.info.thumbnail} alt="" />
        </div>
        <div className="draft-info-text">
          <span className="draft-title">{mediaDraft.mediaInfo.info.title}</span>
          <span className="draft-sub">
            Đang lưu nháp cấu hình • {mediaDraft.formatType.toUpperCase()} ({mediaDraft.formatType === 'video' ? mediaDraft.videoQuality : mediaDraft.formatType === 'audio' ? mediaDraft.audioQuality : 'GIF'})
          </span>
        </div>
      </div>

      <div className="draft-bar-right">
        <button
          className="btn-draft-action btn-draft-return"
          onClick={() => setActiveTab('downloader')}
        >
          <span>Quay lại trang tải</span>
          <ArrowRight size={14} />
        </button>

        <button
          className="btn-draft-action btn-draft-download"
          onClick={handleQuickDownload}
        >
          <Download size={14} />
          <span>Tải nhanh ngay</span>
        </button>

        <button
          className="btn-draft-close"
          onClick={clearDraft}
          title="Xóa bản nháp này"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
