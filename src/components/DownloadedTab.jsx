import React, { useState, useMemo } from 'react';
import {
  Search,
  FolderOpen,
  Trash2,
  Copy,
  FileText,
  ArrowUpDown,
  Film,
  Music,
  Image as ImageIcon,
  Play,
  CheckCircle2,
  Terminal,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  FolderCheck,
  RefreshCw,
  FileCode,
  GripVertical,
  Globe,
  Subtitles
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import Listbox from './Listbox';

export default function DownloadedTab({
  downloadsHistory,
  activeDownloads,
  cancelDownload,
  clearAllHistory,
  deleteHistoryItem,
  resumeDownload,
  settings
}) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'video' | 'audio' | 'gif' | 'playlist'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'title-asc' | 'title-desc'
  const [expandedFolders, setExpandedFolders] = useState({});

  // Filter & Sort Completed History
  const filteredHistory = useMemo(() => {
    let result = [...downloadsHistory];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          (item.title && item.title.toLowerCase().includes(term)) ||
          (item.uploader && item.uploader.toLowerCase().includes(term)) ||
          (item.filePath && item.filePath.toLowerCase().includes(term))
      );
    }

    if (filterType === 'video') {
      result = result.filter((item) => item.formatType === 'video');
    } else if (filterType === 'audio') {
      result = result.filter((item) => item.formatType === 'audio');
    } else if (filterType === 'gif') {
      result = result.filter((item) => item.formatType === 'gif');
    } else if (filterType === 'playlist') {
      result = result.filter((item) => item.isPlaylist);
    }

    result.sort((a, b) => {
      if (sortBy === 'oldest') return a.downloadedAt - b.downloadedAt;
      if (sortBy === 'title-asc') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'title-desc') return (b.title || '').localeCompare(a.title || '');
      return b.downloadedAt - a.downloadedAt; // newest default
    });

    return result;
  }, [downloadsHistory, searchTerm, filterType, sortBy]);

  const toggleExpandFolder = (id) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleOpenFolder = (folderPath) => {
    if (window.api && window.api.openFolder) {
      window.api.openFolder(folderPath);
    }
  };

  const handleOpenFile = (filePath) => {
    if (window.api && window.api.openFile) {
      window.api.openFile(filePath);
    }
  };

  const handleCopyFile = (filePath) => {
    if (window.api && window.api.copyFile) {
      window.api.copyFile(filePath);
      alert(t('copiedPathAlert'));
    }
  };

  const handleDeleteIndividualFile = (filePath) => {
    if (confirm(t('confirmDeleteFile'))) {
      if (window.api && window.api.deleteFile) {
        window.api.deleteFile(filePath);
        alert(t('deletedFileAlert'));
      }
    }
  };

  // Immediate Native File Drag Handler
  const handleDragStart = (e, item) => {
    e.preventDefault();

    const targetPath = item.filePath || item.folderPath;
    if (window.api && window.api.startDrag && targetPath) {
      if (item.isPlaylist) {
        const mode = settings?.playlistDragMode || 'folder';
        if (mode === 'files' && item.downloadedFiles && item.downloadedFiles.length > 0) {
          window.api.startDrag(item.downloadedFiles);
        } else {
          window.api.startDrag(item.folderPath || item.filePath);
        }
      } else {
        window.api.startDrag(item.filePath || item.folderPath);
      }
    }
  };

  const handleTrackDragStart = (e, trackFilePath, fallbackFolderPath) => {
    e.stopPropagation();
    e.preventDefault();
    const targetPath = trackFilePath || fallbackFolderPath;
    if (window.api && window.api.startDrag && targetPath) {
      window.api.startDrag(targetPath);
    }
  };

  // Import Log File & Resume Handler
  const handleImportLogFileToResume = async () => {
    try {
      if (!window.api || !window.api.selectLogFile) return;
      const logFilePath = await window.api.selectLogFile();
      if (!logFilePath) return;

      const res = await window.api.readLogFile(logFilePath);
      if (res.success && res.data) {
        const taskData = res.data.options || res.data;
        if (res.data.missingIndexes && res.data.missingIndexes.length > 0) {
          taskData.playlistItems = res.data.missingIndexes.join(',');
        }
        alert(
          t('logRestoreSuccess', {
            title: taskData.mediaTitle || taskData.playlistTitle,
            count: res.data.missingIndexes ? res.data.missingIndexes.length : '...'
          })
        );
        resumeDownload(taskData);
      }
    } catch (err) {
      alert(t('logRestoreFailed', { error: err.message }));
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative z-10 w-full max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 text-slate-800 dark:text-slate-100 font-sans select-none animate-fade-in-up">
      {/* Sticky Top Toolbar Card */}
      <section className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-sky-200 dark:border-pink-500/20 shadow-light-glow dark:shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          {/* Left */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-600 dark:text-emerald-400 shrink-0">
              <FolderCheck size={20} />
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 truncate">
              {t("downloadedTitle")} ({filteredHistory.length})
            </h2>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Open Folder */}
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-sky-600 dark:text-sky-300 text-xs font-bold transition-all cursor-pointer active:scale-95 whitespace-nowrap min-w-0"
              onClick={async () => {
                let baseDir = settings?.defaultPath;
                if (!baseDir && window.api?.getDownloadsPath) {
                  baseDir = await window.api.getDownloadsPath();
                }

                let targetPath = baseDir || "";

                if (targetPath && !targetPath.includes("Media Download")) {
                  targetPath =
                    targetPath.replace(/[/\\]$/, "") + "/Media Download";
                }

                handleOpenFolder(targetPath || "");
              }}
              title={t("openDownloadFolder")}
            >
              <FolderOpen size={14} className="shrink-0" />
              <span className="hidden sm:inline-block max-w-[100px] md:max-w-none truncate">
                {t("openDownloadFolder")}
              </span>
            </button>

            {/* Import Log */}
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/30 text-purple-600 dark:text-purple-300 text-xs font-semibold transition-all cursor-pointer active:scale-95 whitespace-nowrap min-w-0"
              onClick={handleImportLogFileToResume}
              title={t("importLogBtn")}
            >
              <FileCode size={14} className="shrink-0" />
              <span className="hidden sm:inline-block max-w-[100px] md:max-w-none truncate">
                {t("importLogBtn")}
              </span>
            </button>

            {/* Clear History */}
            {downloadsHistory.length > 0 && (
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-all cursor-pointer active:scale-95 whitespace-nowrap min-w-0"
                onClick={() => {
                  if (confirm(t("confirmClearHistory"))) {
                    clearAllHistory();
                  }
                }}
                title={t("clearHistoryBtn")}
              >
                <Trash2 size={14} className="shrink-0" />
                <span className="hidden sm:inline-block max-w-[100px] md:max-w-none truncate">
                  {t("clearHistoryBtn")}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Search, Filter & Sort Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
              placeholder={t('searchHistoryPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Type Filter Buttons & Sort Dropdown */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: t('filterAll') },
                { id: 'video', label: t('filterVideo') },
                { id: 'audio', label: t('filterAudio') },
                { id: 'gif', label: t('filterGif') },
                { id: 'playlist', label: t('filterPlaylist') }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterType(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${filterType === f.id
                    ? 'bg-gradient-to-r from-sky-500/20 to-pink-500/20 border-pink-400 text-pink-600 dark:text-pink-200 shadow-sm font-bold scale-105'
                    : 'bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 ml-auto md:ml-0">
              <ArrowUpDown size={14} className="text-slate-400 shrink-0" />
              <Listbox
                className="w-36 sm:w-40"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">{t('sortNewest')}</option>
                <option value="oldest">{t('sortOldest')}</option>
                <option value="title-asc">{t('sortTitleAsc')}</option>
                <option value="title-desc">{t('sortTitleDesc')}</option>
              </Listbox>
            </div>
          </div>
        </div>
      </section>

      {/* History List Container */}
      <section className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-sky-200 dark:border-pink-500/20 shadow-light-glow dark:shadow-xl">
        {filteredHistory.length === 0 ? (
          <div className="py-12 px-4 text-center text-slate-400 space-y-3 animate-fade-in-up">
            <FolderOpen size={44} className="mx-auto text-slate-400 opacity-40" />
            <p className="text-sm font-medium">{t('noHistory')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((item) => {
              const isExpanded = expandedFolders[item.id];
              const displayThumb =
                item.thumbnail ||
                (item.playlistEntries && item.playlistEntries[0] ? item.playlistEntries[0].thumbnail : '') ||
                'https://via.placeholder.com/160x90?text=Media';

              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  className={`group rounded-2xl border transition-all duration-200 cursor-grab active:cursor-grabbing overflow-hidden p-3.5 space-y-3 shadow-sm hover:shadow-md ${item.isCancelled
                    ? 'bg-rose-500/10 border-rose-400/30'
                    : 'bg-slate-50/80 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800/80 hover:border-pink-400/50'
                    }`}
                  title={t('dragHint')}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
                    {/* Info Column */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Drag Handle Icon */}
                      <div className="text-slate-400 hover:text-pink-500 cursor-grab flex items-center justify-center shrink-0 transition-colors">
                        <GripVertical size={16} />
                      </div>

                      {/* Cover Thumbnail Image */}
                      <div className="w-20 h-12 rounded-xl overflow-hidden bg-slate-950 relative shrink-0 shadow-sm">
                        <img
                          src={displayThumb}
                          alt=""
                          className="w-full h-full object-cover block group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-slate-950/85 text-[9px] font-bold text-slate-100 uppercase backdrop-blur-sm border border-slate-800">
                          {item.isPlaylist ? 'PLAYLIST' : item.formatType}
                        </span>
                      </div>

                      {/* Title & Metadata */}
                      <div className="overflow-hidden flex-1 min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-pink-500 dark:group-hover:text-sky-300 transition-colors">
                          {item.title}
                        </h4>

                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                          <span>{item.uploader || t('webMedia')}</span>
                          <span>•</span>
                          <span>{formatDate(item.downloadedAt)}</span>

                          {item.isPlaylist && (
                            <span className="bg-purple-500/15 border border-purple-400/30 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                              📁 Playlist ({t('itemsCount', { count: item.entriesCount || item.playlistEntries?.length || 1 })})
                            </span>
                          )}

                          {item.isCancelled && (
                            <span className="bg-rose-500/20 text-rose-600 dark:text-rose-300 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                              {t('cancelledStatus')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons Column */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                      {!item.isPlaylist && (
                        <button
                          type="button"
                          className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-600 dark:text-emerald-400 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
                          onClick={() => handleOpenFile(item.filePath)}
                          title={t('openFile')}
                        >
                          <Play size={14} className="fill-current" />
                        </button>
                      )}

                      <button
                        type="button"
                        className="p-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-sky-600 dark:text-sky-400 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
                        onClick={() => handleOpenFolder(item.folderPath || item.filePath)}
                        title={t('openFolder')}
                      >
                        <FolderOpen size={14} />
                      </button>

                      {item.originalOptions && (
                        <button
                          type="button"
                          className="p-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/30 text-purple-600 dark:text-purple-400 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
                          onClick={() => resumeDownload(item.originalOptions)}
                          title={t('resume')}
                        >
                          <RefreshCw size={14} />
                        </button>
                      )}

                      {item.logFilePath && (
                        <button
                          type="button"
                          className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-amber-600 dark:text-amber-400 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
                          onClick={() => handleOpenFile(item.logFilePath)}
                          title={t('viewLogFile')}
                        >
                          <FileText size={14} />
                        </button>
                      )}

                      {item.isPlaylist && (
                        <button
                          type="button"
                          onClick={() => toggleExpandFolder(item.id)}
                          className="p-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/30 text-purple-600 dark:text-purple-300 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
                          title={isExpanded ? t('collapseBtn') : t('detailBtn')}
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      )}

                      <button
                        type="button"
                        className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 text-rose-600 dark:text-rose-400 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
                        onClick={() => deleteHistoryItem(item.id, item.filePath)}
                        title={t('deleteItem')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Rich JSON Database Metadata Section */}
                  <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-800/70 text-[11px] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                    {/* Source URL (Tải ở đâu) */}
                    <div className="flex items-center gap-1.5 overflow-hidden text-slate-600 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                      <Globe size={13} className="text-sky-500 shrink-0" />
                      <span className="truncate flex-1 font-mono text-[10px]" title={item.sourceUrl || item.url || 'Web Direct'}>
                        {item.sourceUrl || item.url ? (item.sourceUrl || item.url) : t('webDirect')}
                      </span>
                      {(item.sourceUrl || item.url) && (
                        <button
                          type="button"
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-sky-400 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(item.sourceUrl || item.url);
                            alert(t('copiedSourceLink'));
                          }}
                          title={t('copySourceLink')}
                        >
                          <Copy size={11} />
                        </button>
                      )}
                    </div>

                    {/* File / Folder Path (Đường dẫn tệp/Playlist) */}
                    <div className="flex items-center gap-1.5 overflow-hidden text-slate-600 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                      <FolderOpen size={13} className="text-emerald-500 shrink-0" />
                      <span className="truncate flex-1 font-mono text-[10px]" title={item.playlistDir || item.folderPath || item.filePath}>
                        {item.isPlaylist ? (item.playlistDir || item.folderPath || t('playlistFolder')) : (item.filePath || t('filePath'))}
                      </span>
                      <button
                        type="button"
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-emerald-400 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenFolder(item.playlistDir || item.folderPath || item.filePath);
                        }}
                        title={t('openFolderTitle')}
                      >
                        <FolderOpen size={11} />
                      </button>
                    </div>

                    {/* Subtitle File Status & Path */}
                    <div className="flex items-center justify-between gap-1.5 text-slate-600 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Subtitles size={13} className={item.hasSub || (item.subPaths && item.subPaths.length > 0) ? "text-purple-500" : "text-slate-400 opacity-50"} />
                        <span className="font-semibold text-[11px] truncate">
                          {item.hasSub || (item.subPaths && item.subPaths.length > 0)
                            ? `${t('hasSub')} (${item.subPaths?.length || 1})`
                            : t('noSub')}
                        </span>
                      </div>
                      {(item.hasSub || (item.subPaths && item.subPaths.length > 0)) && (
                        <button
                          type="button"
                          className="px-1.5 py-0.5 text-[10px] font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-300 hover:bg-purple-500/25 rounded transition-colors shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            const subFile = item.subPaths && item.subPaths[0] ? item.subPaths[0] : (item.folderPath || item.filePath);
                            handleOpenFile(subFile);
                          }}
                          title={item.subPaths && item.subPaths[0] ? item.subPaths[0] : t('openSub')}
                        >
                          {t('openSub')}
                        </button>
                      )}
                    </div>

                    {/* Thumbnail File Status & Path */}
                    <div className="flex items-center justify-between gap-1.5 text-slate-600 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <ImageIcon size={13} className={item.hasThumbnail || item.thumbnailPath ? "text-pink-500" : "text-slate-400 opacity-50"} />
                        <span className="font-semibold text-[11px] truncate">
                          {item.hasThumbnail || item.thumbnailPath ? t('hasThumbnail') : t('noThumbnail')}
                        </span>
                      </div>
                      {(item.hasThumbnail || item.thumbnailPath) && (
                        <button
                          type="button"
                          className="px-1.5 py-0.5 text-[10px] font-semibold bg-pink-500/15 text-pink-600 dark:text-pink-300 hover:bg-pink-500/25 rounded transition-colors shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenFile(item.thumbnailPath || item.thumbnail);
                          }}
                          title={item.thumbnailPath || t('hasThumbnail')}
                        >
                          {t('viewImage')}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* EXPANDABLE PLAYLIST TRACK ITEMS DRAWER */}
                  {item.isPlaylist && isExpanded && (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 animate-fade-in-up">
                      {item.playlistEntries && item.playlistEntries.length > 0 ? (
                        <div className="max-h-60 overflow-y-auto bg-slate-100/90 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 px-2 py-1">
                            <span>📁 {t('playlistTitle')}</span>
                            <span className="text-[11px] opacity-75">
                              {item.playlistEntries.length} {t('tracks')}
                            </span>
                          </div>
                          {item.playlistEntries.map((entry, idx) => {
                            const trackFilePath =
                              item.downloadedFiles && item.downloadedFiles[idx] ? item.downloadedFiles[idx] : null;

                            return (
                              <div
                                key={idx}
                                draggable
                                onDragStart={(e) => handleTrackDragStart(e, trackFilePath, item.folderPath)}
                                className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 hover:border-pink-400/40 transition-colors cursor-grab"
                                title={t('dragHint')}
                              >
                                <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                                  <div className="text-slate-400 hover:text-pink-500 cursor-grab flex items-center justify-center shrink-0">
                                    <GripVertical size={14} />
                                  </div>

                                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-950 shrink-0">
                                    <img
                                      src={entry.thumbnail || item.thumbnail}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  </div>

                                  <div className="overflow-hidden flex-1 min-w-0">
                                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                                      #{idx + 1}. {entry.title || 'Track'}
                                    </div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                      {entry.uploader || item.uploader || 'Web'}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono shrink-0">
                                  {formatDuration(entry.duration)}
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                                    onClick={() =>
                                      trackFilePath ? handleOpenFile(trackFilePath) : handleOpenFolder(item.folderPath)
                                    }
                                    title={t('openFile')}
                                  >
                                    <Play size={12} />
                                  </button>

                                  <button
                                    type="button"
                                    className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                                    onClick={() => handleCopyFile(trackFilePath || item.folderPath)}
                                    title={t('copyPath')}
                                  >
                                    <Copy size={12} />
                                  </button>

                                  {trackFilePath && (
                                    <button
                                      type="button"
                                      className="p-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                                      onClick={() => handleDeleteIndividualFile(trackFilePath)}
                                      title={t('deleteItem')}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
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
            })}
          </div>
        )}
      </section>
    </div>
  );
}
