import React, { useState } from 'react';
import {
  Play,
  Pause,
  X,
  Terminal,
  Download,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  ListMusic,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
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
    <div className="relative z-20 w-full max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 my-3 select-none animate-fade-in-up">
      {/* Sleek Under-Taskbar Main Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-sky-200 dark:border-pink-500/30 shadow-light-glow dark:shadow-xl">
        {/* Left: Thumbnail & Title Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 animate-pulse ${
              isFailedOnly ? 'bg-rose-500' : isPaused ? 'bg-amber-500' : isQueued ? 'bg-sky-500' : 'bg-emerald-400'
            }`}
          />
          <div className="w-12 h-9 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-800 shadow-sm">
            {currentActive.thumbnail ? (
              <img src={currentActive.thumbnail} alt="thumb" className="w-full h-full object-cover" />
            ) : (
              <div className="text-pink-400">
                {isFailedOnly ? <AlertTriangle size={15} className="text-rose-400" /> : <Download size={15} />}
              </div>
            )}
          </div>

          <div className="overflow-hidden min-w-0 flex-1">
            <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
              {currentActive.isPlaylistItem
                ? `${currentActive.playlistTitle} • #${currentActive.playlistIndex}. ${currentActive.mediaTitle}`
                : currentActive.playlistTitle || currentActive.mediaTitle || currentActive.url}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap mt-0.5">
              {isFailedOnly ? (
                <span className="text-rose-500 font-bold">{t('downloadFailed')}</span>
              ) : isPaused ? (
                <span className="text-amber-500 font-bold">{t('downloadPaused')}</span>
              ) : isQueued ? (
                <span className="text-sky-500 font-bold">{t('downloadQueued')}</span>
              ) : (
                <span className="text-emerald-500 font-bold">{t('downloadActive', { count: activeDownloads.length })}</span>
              )}
              {failedDownloads.length > 0 && (
                <span className="bg-rose-500/15 border border-rose-400/30 text-rose-600 dark:text-rose-300 px-2 py-0.5 rounded-md text-[10px] font-bold">
                  {t('errorCount', { count: failedDownloads.length })}
                </span>
              )}
              {totalTasksCount > 1 && (
                <span className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md text-[10px]">
                  {t('moreItems', { count: totalTasksCount - 1 })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Live Progress Bar & Info */}
        <div className="flex-1 min-w-[180px] sm:max-w-xs">
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isFailedOnly
                  ? 'bg-rose-500'
                  : 'bg-pink-500'
              }`}
              style={{ width: `${currentActive.percent || 0}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
            <span>{currentActive.percent ? `${currentActive.percent.toFixed(1)}%` : isFailedOnly ? 'Lỗi' : '...'}</span>
            <span>{currentActive.speed || (currentActive.eta ? `${currentActive.eta}` : '')}</span>
          </div>
        </div>

        {/* Right: Actions & Dropdown Toggle */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/30 text-purple-600 dark:text-purple-300 text-xs font-bold transition-all cursor-pointer"
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
        <div className="mt-2 p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-pink-400/30 shadow-xl space-y-2.5 animate-fade-in-up">
          {/* Active Downloads List */}
          {activeDownloads.map((dl) => (
            <div
              key={dl.id}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
            >
              {/* Task Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-hidden max-w-[65%]">
                  <Download size={15} className="text-pink-500 shrink-0" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    {dl.isPlaylistItem ? `${dl.playlistTitle} • #${dl.playlistIndex}. ${dl.mediaTitle}` : dl.playlistTitle || dl.mediaTitle || dl.url}
                  </span>
                  <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                    {dl.formatType?.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-bold text-pink-500">
                    ⚡ ({dl.percent ? dl.percent.toFixed(1) : 0}%)
                  </span>
                  {openLogModal && (
                    <button
                      type="button"
                      onClick={() => openLogModal(dl)}
                      className="p-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                      title={t('viewCliLog')}
                    >
                      <Terminal size={12} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => pauseDownload(dl.id)}
                    className="p-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-amber-600 dark:text-amber-300 transition-colors cursor-pointer"
                    title={t('pause')}
                  >
                    <Pause size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => cancelDownload(dl.id)}
                    className="p-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-600 dark:text-rose-300 transition-colors cursor-pointer"
                    title={t('cancelTask')}
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>

              {/* Individual Live Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-pink-500 rounded-full transition-all duration-300"
                  style={{ width: `${dl.percent || 0}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                <span>{dl.speed || dl.totalSize || '...'}</span>
                <span>{dl.eta || ''}</span>
              </div>
            </div>
          ))}

          {/* Failed Downloads Group */}
          {failedDownloads.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-rose-500/15 border border-rose-400/30 text-xs font-medium"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <AlertTriangle size={15} className="text-rose-500 shrink-0" />
                <div className="overflow-hidden">
                  <div className="font-bold text-rose-600 dark:text-rose-300 truncate">
                    {f.isPlaylistItem ? `${f.playlistTitle} • #${f.playlistIndex}. ${f.mediaTitle}` : f.playlistTitle || f.mediaTitle}
                  </div>
                  <div className="text-[10px] text-rose-500 dark:text-rose-400 truncate">
                    ⚠️ {f.errorMessage || 'Error'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {retryDownload && (
                  <button
                    type="button"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-[11px] shadow-sm cursor-pointer active:scale-95 transition-all"
                    onClick={() => retryDownload(f)}
                    title={t('retry')}
                  >
                    <RotateCcw size={12} />
                    <span>{t('retry')}</span>
                  </button>
                )}
                {removeFailedTask && (
                  <button
                    type="button"
                    className="p-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition-colors cursor-pointer"
                    onClick={() => removeFailedTask(f.id)}
                    title={t('ignore')}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Paused Tasks Group */}
          {pausedDownloads.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-xs font-semibold"
            >
              <span className="text-amber-600 dark:text-amber-300 truncate">
                ⏸️ {p.playlistTitle || p.mediaTitle} ({t('downloadPaused')})
              </span>
              <button
                type="button"
                className="px-2.5 py-1 rounded-lg bg-pink-500 hover:bg-pink-600 dark:bg-pink-400 text-white dark:text-slate-950 font-bold text-[11px] cursor-pointer active:scale-95 transition-all"
                onClick={() => resumeDownload(p)}
              >
                {t('resume')}
              </button>
            </div>
          ))}

          {/* Queued Tasks Group */}
          {downloadQueue.map((q, idx) => (
            <div
              key={q.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border-l-4 border-l-sky-500 border border-slate-200 dark:border-slate-800 text-xs"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <Clock size={13} className="text-slate-400 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                  #{idx + 1}. {q.isPlaylistItem ? `${q.playlistTitle} • #${q.playlistIndex}. ${q.mediaTitle}` : q.playlistTitle || q.mediaTitle}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-slate-400">{t('waiting')}</span>
                <button
                  type="button"
                  className="p-1 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 transition-colors cursor-pointer"
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
