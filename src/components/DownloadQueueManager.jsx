import React, { useState } from 'react';
import { Play, Pause, X, Terminal, Download, Loader2, ChevronDown, ChevronUp, CheckCircle2, Clock, ListMusic, RotateCcw, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

export default function DownloadQueueManager({
  activeDownloads,
  downloadQueue,
  pausedDownloads,
  failedDownloads = [],
  pauseDownload,
  resumeDownload,
  cancelDownload,
  cancelQueuedTask,
  retryDownload,
  removeFailedTask,
  openLogModal
}) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  if (activeDownloads.length === 0 && downloadQueue.length === 0 && pausedDownloads.length === 0 && failedDownloads.length === 0) {
    return null;
  }

  const currentActive = activeDownloads[0] || pausedDownloads[0] || downloadQueue[0] || failedDownloads[0];
  const isPaused = activeDownloads.length === 0 && pausedDownloads.length > 0;
  const isQueued = activeDownloads.length === 0 && pausedDownloads.length === 0 && downloadQueue.length > 0;
  const isFailedOnly = activeDownloads.length === 0 && pausedDownloads.length === 0 && downloadQueue.length === 0 && failedDownloads.length > 0;

  const totalTasksCount = activeDownloads.length + downloadQueue.length + pausedDownloads.length + failedDownloads.length;

  return (
    <div className="under-taskbar-wrapper">
      {/* Sleek Under-Taskbar Main Bar */}
      <div className="under-taskbar-dl-bar fade-in-up">
        {/* Left: Thumbnail & Title Info */}
        <div className="under-taskbar-dl-left">
          <span className="draft-pulse-dot" style={{ backgroundColor: isFailedOnly ? '#ef4444' : undefined }} />
          <div className="draft-thumb-small">
            {currentActive.thumbnail ? (
              <img src={currentActive.thumbnail} alt="thumb" />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', color: isFailedOnly ? '#fca5a5' : '#c084fc' }}>
                {isFailedOnly ? <AlertTriangle size={14} /> : <Download size={14} />}
              </div>
            )}
          </div>

          <div style={{ overflow: 'hidden' }}>
            <div className="under-taskbar-dl-title">
              {currentActive.isPlaylistItem ? `${currentActive.playlistTitle} • #${currentActive.playlistIndex}. ${currentActive.mediaTitle}` : (currentActive.playlistTitle || currentActive.mediaTitle || currentActive.url)}
            </div>
            <div className="under-taskbar-dl-sub">
              {isFailedOnly ? (
                <span style={{ color: '#ef4444' }}>{t('downloadFailed')}</span>
              ) : isPaused ? (
                <span style={{ color: '#f59e0b' }}>{t('downloadPaused')}</span>
              ) : isQueued ? (
                <span style={{ color: '#3b82f6' }}>{t('downloadQueued')}</span>
              ) : (
                <span>{t('downloadActive', { count: activeDownloads.length })}</span>
              )}
              {failedDownloads.length > 0 && (
                <span style={{ color: '#fca5a5', background: 'rgba(239, 68, 68, 0.2)', padding: '1px 6px', borderRadius: '8px', fontSize: '10px' }}>
                  {t('errorCount', { count: failedDownloads.length })}
                </span>
              )}
              {totalTasksCount > 1 && (
                <span style={{ color: '#94a3b8', background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: '8px' }}>
                  {t('moreItems', { count: totalTasksCount - 1 })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Live Progress Bar & Info */}
        <div className="under-taskbar-progress-container">
          <div style={{ flex: 1 }}>
            <div className="progress-bar-track" style={{ height: '7px' }}>
              <div className="progress-bar-fill" style={{ width: `${currentActive.percent || 0}%`, background: isFailedOnly ? '#ef4444' : undefined }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
              <span>{currentActive.percent ? `${currentActive.percent.toFixed(1)}%` : (isFailedOnly ? 'Failed' : '...')}</span>
              <span>{currentActive.speed || (currentActive.eta ? `${currentActive.eta}` : '')}</span>
            </div>
          </div>
        </div>

        {/* Right: Actions & Dropdown Toggle */}
        <div className="under-taskbar-actions">
          {/* Dropdown Toggle Button */}
          <button
            type="button"
            className="btn-toggle-drawer"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? t('collapseBtn') : t('detailBtn')}
          >
            <span>{isExpanded ? t('collapseBtn') : t('detailBtn')}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded Accordion Drawer */}
      {isExpanded && (
        <div className="under-taskbar-details-drawer fade-in-up">
          {/* Active Downloads List */}
          {activeDownloads.map((dl) => (
            <div key={dl.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(30, 41, 59, 0.45)', borderRadius: '10px', padding: '10px 12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              {/* Task Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', maxWidth: '65%' }}>
                  <Download size={15} color="#ec4899" />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {dl.isPlaylistItem ? `${dl.playlistTitle} • #${dl.playlistIndex}. ${dl.mediaTitle}` : (dl.playlistTitle || dl.mediaTitle || dl.url)}
                  </span>
                  <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', color: '#94a3b8', padding: '1px 6px', borderRadius: '4px' }}>
                    {dl.formatType?.toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#ec4899' }}>
                    ⚡ ({dl.percent ? dl.percent.toFixed(1) : 0}%)
                  </span>
                  {openLogModal && (
                    <button
                      onClick={() => openLogModal(dl)}
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-color)', color: '#94a3b8', padding: '3px 6px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}
                      title={t('viewCliLog')}
                    >
                      <Terminal size={11} />
                    </button>
                  )}
                  <button
                    onClick={() => pauseDownload(dl.id)}
                    style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', padding: '3px 6px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}
                    title={t('pause')}
                  >
                    <Pause size={11} />
                  </button>
                  <button
                    onClick={() => cancelDownload(dl.id)}
                    style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '3px 6px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}
                    title={t('cancelTask')}
                  >
                    <X size={11} />
                  </button>
                </div>
              </div>

              {/* Individual Live Progress Bar */}
              <div className="progress-bar-track" style={{ height: '5px' }}>
                <div className="progress-bar-fill" style={{ width: `${dl.percent || 0}%` }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                <span>{dl.speed || dl.totalSize || '...'}</span>
                <span>{dl.eta || ''}</span>
              </div>
            </div>
          ))}

          {/* Failed Downloads Group */}
          {failedDownloads.map((f) => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <AlertTriangle size={14} color="#ef4444" />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#fca5a5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {f.isPlaylistItem ? `${f.playlistTitle} • #${f.playlistIndex}. ${f.mediaTitle}` : (f.playlistTitle || f.mediaTitle)}
                  </div>
                  <div style={{ fontSize: '10px', color: '#ef4444' }}>
                    ⚠️ {f.errorMessage || 'Error'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {retryDownload && (
                  <button
                    className="btn btn-primary"
                    style={{ padding: '3px 8px', fontSize: '11px', background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => retryDownload(f)}
                    title={t('retry')}
                  >
                    <RotateCcw size={12} />
                    <span>{t('retry')}</span>
                  </button>
                )}
                {removeFailedTask && (
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '3px 6px', fontSize: '10px' }}
                    onClick={() => removeFailedTask(f.id)}
                    title={t('ignore')}
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Paused Tasks Group */}
          {pausedDownloads.map((p) => (
            <div key={p.id} className="dl-parent-item" style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}>
              <span style={{ color: '#f59e0b', fontSize: '12px' }}>⏸️ {p.playlistTitle || p.mediaTitle} ({t('downloadPaused')})</span>
              <button
                className="btn btn-primary"
                style={{ padding: '2px 8px', fontSize: '11px' }}
                onClick={() => resumeDownload(p)}
              >
                {t('resume')}
              </button>
            </div>
          ))}

          {/* Queued Tasks Group */}
          {downloadQueue.map((q, idx) => (
            <div key={q.id} className="dl-child-playlist-item" style={{ opacity: 0.7, margin: 0, borderRadius: '8px', borderLeft: '2px solid #3b82f6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <Clock size={13} color="#64748b" />
                <span style={{ fontSize: '12px', color: '#cbd5e1', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  #{idx + 1}. {q.isPlaylistItem ? `${q.playlistTitle} • #${q.playlistIndex}. ${q.mediaTitle}` : (q.playlistTitle || q.mediaTitle)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{t('waiting')}</span>
                <button
                  className="btn btn-danger"
                  style={{ padding: '2px 6px', fontSize: '10px' }}
                  onClick={() => cancelQueuedTask(q.id)}
                  title={t('cancelTask')}
                >
                  <X size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
