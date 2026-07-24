import React, { useState, useMemo } from 'react';
import { Search, FolderOpen, Trash2, Copy, FileText, ArrowUpDown, Film, Music, Image as ImageIcon, Play, CheckCircle2, Terminal, AlertCircle, X, ChevronDown, ChevronUp, FolderCheck, RefreshCw, FileCode, GripVertical } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

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
        alert(t('logRestoreSuccess', {
          title: taskData.mediaTitle || taskData.playlistTitle,
          count: res.data.missingIndexes ? res.data.missingIndexes.length : '...'
        }));
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
    <div style={{ maxWidth: '950px', margin: '0 auto' }}>
      <section className="card">
        <div className="downloaded-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderCheck size={20} color="#10b981" />
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#f8fafc' }}>
              {t('downloadedTitle')} ({filteredHistory.length})
            </h2>
          </div>

          <div className="downloaded-header-actions" style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              onClick={handleImportLogFileToResume}
              style={{ padding: '6px 12px', fontSize: '12px', color: '#c084fc', borderColor: 'rgba(192, 132, 252, 0.3)' }}
              title={t('importLogBtn')}
            >
              <FileCode size={14} />
              <span className="downloaded-action-btn-text">{t('importLogBtn')}</span>
            </button>

            {downloadsHistory.length > 0 && (
              <button
                className="btn btn-danger"
                onClick={() => {
                  if (confirm(t('confirmClearHistory'))) {
                    clearAllHistory();
                  }
                }}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                <Trash2 size={14} />
                <span className="downloaded-action-btn-text">{t('clearHistoryBtn')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Search, Filter & Sort Controls */}
        <div className="downloaded-search-filter-row" style={{ display: 'flex', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
          {/* Search Bar */}
          <div className="downloaded-search-box" style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="text-input"
              style={{ width: '100%', paddingLeft: '36px', padding: '8px 12px 8px 36px', fontSize: '13px' }}
              placeholder={t('searchHistoryPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="downloaded-filter-types" style={{ display: 'flex', gap: '6px' }}>
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
                className="filter-type-btn"
                onClick={() => setFilterType(f.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  border: filterType === f.id ? '1px solid #8b5cf6' : '1px solid var(--border-color)',
                  background: filterType === f.id ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  color: filterType === f.id ? '#fff' : '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="downloaded-sort-box" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowUpDown size={14} color="#94a3b8" />
            <select
              className="custom-select downloaded-sort-select"
              style={{ fontSize: '12px' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">{t('sortNewest')}</option>
              <option value="oldest">{t('sortOldest')}</option>
              <option value="title-asc">{t('sortTitleAsc')}</option>
              <option value="title-desc">{t('sortTitleDesc')}</option>
            </select>
          </div>
        </div>

        {/* History List Rendering */}
        {filteredHistory.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
            <FolderOpen size={40} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.5 }} />
            <p style={{ fontSize: '14px' }}>{t('noHistory')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredHistory.map((item) => {
              const isExpanded = expandedFolders[item.id];
              const displayThumb = item.thumbnail || (item.playlistEntries && item.playlistEntries[0] ? item.playlistEntries[0].thumbnail : '') || 'https://via.placeholder.com/160x90?text=Media';

              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  style={{
                    background: item.isCancelled ? 'rgba(239, 68, 68, 0.08)' : 'rgba(15, 23, 42, 0.65)',
                    border: item.isCancelled ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '14px',
                    transition: 'border-color 0.2s ease',
                    cursor: 'grab'
                  }}
                  title={t('dragHint')}
                >
                  <div className="downloaded-item-card" style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div className="downloaded-item-main-info" style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minWidth: 0 }}>
                      {/* Drag Handle Icon */}
                      <div style={{ color: '#475569', cursor: 'grab', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                        <GripVertical size={16} />
                      </div>

                      {/* Single Cover Image Thumbnail */}
                      <div style={{ width: '80px', height: '50px', borderRadius: '8px', overflow: 'hidden', background: '#000', position: 'relative', flexShrink: 0 }}>
                        <img
                          src={displayThumb}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                        <span style={{ position: 'absolute', bottom: '2px', right: '2px', background: 'rgba(0,0,0,0.85)', color: '#fff', fontSize: '9px', fontWeight: '700', padding: '1px 5px', borderRadius: '3px', textTransform: 'uppercase' }}>
                          {item.isPlaylist ? 'PLAYLIST' : item.formatType}
                        </span>
                      </div>

                      {/* Meta Info */}
                      <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </h4>

                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span>{item.uploader || 'Web Media'}</span>
                          <span>•</span>
                          <span>{formatDate(item.downloadedAt)}</span>

                          {item.isPlaylist && (
                            <span style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', padding: '1px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>
                              📁 Playlist ({t('itemsCount', { count: item.entriesCount || item.playlistEntries?.length || 1 })})
                            </span>
                          )}

                          {item.isCancelled && (
                            <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '1px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>
                              {t('cancelledStatus')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="downloaded-item-actions" style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                        {item.originalOptions && (
                          <button
                            className="btn btn-primary"
                            style={{ padding: '5px 8px', fontSize: '11px' }}
                            onClick={() => resumeDownload(item.originalOptions)}
                            title={t('importLogBtn')}
                          >
                            <RefreshCw size={12} />
                            <span className="downloaded-action-btn-text">{t('resume')}</span>
                          </button>
                        )}

                        <button
                          className="btn btn-secondary"
                          style={{ padding: '5px 8px', fontSize: '11px' }}
                          onClick={() => handleOpenFolder(item.folderPath || item.filePath)}
                          title={t('openFolder')}
                        >
                          <FolderOpen size={13} />
                          <span className="downloaded-action-btn-text">{t('openFolder')}</span>
                        </button>

                        {!item.isPlaylist && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '5px 8px', fontSize: '11px' }}
                            onClick={() => handleOpenFile(item.filePath)}
                            title={t('openFile')}
                          >
                            <Play size={13} />
                            <span className="downloaded-action-btn-text">{t('openFile')}</span>
                          </button>
                        )}

                        {item.logFilePath && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '5px 8px', fontSize: '11px' }}
                            onClick={() => handleOpenFile(item.logFilePath)}
                            title="Log file"
                          >
                            <FileText size={13} />
                            <span className="downloaded-action-btn-text">.log</span>
                          </button>
                        )}

                        <button
                          className="btn btn-danger"
                          style={{ padding: '5px 8px', fontSize: '11px' }}
                          onClick={() => deleteHistoryItem(item.id, item.filePath)}
                          title={t('deleteItem')}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {item.isPlaylist && (
                        <button
                          onClick={() => toggleExpandFolder(item.id)}
                          style={{ background: 'transparent', border: 'none', color: '#c084fc', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}
                        >
                          <span>{isExpanded ? t('collapseBtn') : t('detailBtn')}</span>
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      )}
                    </div>

                  {/* EXPANDABLE PLAYLIST TRACK ITEMS DRAWER */}
                  {item.isPlaylist && isExpanded && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#c084fc', marginBottom: '8px' }}>
                        {t('playlistTitle')}:
                      </div>

                      {item.playlistEntries && item.playlistEntries.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto', background: '#090d16', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          {item.playlistEntries.map((entry, idx) => {
                            const trackFilePath = item.downloadedFiles && item.downloadedFiles[idx] ? item.downloadedFiles[idx] : null;

                            return (
                              <div
                                key={idx}
                                className="playlist-child-track-row"
                                draggable
                                onDragStart={(e) => handleTrackDragStart(e, trackFilePath, item.folderPath)}
                                style={{
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  background: 'rgba(255,255,255,0.03)',
                                  border: '1px solid rgba(255,255,255,0.04)',
                                  cursor: 'grab'
                                }}
                                title={t('dragHint')}
                              >
                                <div style={{ color: '#475569', cursor: 'grab', display: 'flex', justifyContent: 'center' }}>
                                  <GripVertical size={14} />
                                </div>

                                <div style={{ width: '32px', height: '32px', borderRadius: '4px', overflow: 'hidden', background: '#1e293b' }}>
                                  <img src={entry.thumbnail || item.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>

                                <div style={{ overflow: 'hidden' }}>
                                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    #{idx + 1}. {entry.title || 'Track'}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {entry.uploader || item.uploader || 'Web'}
                                  </div>
                                </div>

                                <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                                  {formatDuration(entry.duration)}
                                </div>

                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                  <button
                                    className="btn btn-secondary"
                                    style={{ padding: '3px 6px', fontSize: '10px' }}
                                    onClick={() => (trackFilePath ? handleOpenFile(trackFilePath) : handleOpenFolder(item.folderPath))}
                                    title={t('openFile')}
                                  >
                                    <Play size={11} />
                                  </button>

                                  <button
                                    className="btn btn-secondary"
                                    style={{ padding: '3px 6px', fontSize: '10px' }}
                                    onClick={() => handleCopyFile(trackFilePath || item.folderPath)}
                                    title={t('copyPath')}
                                  >
                                    <Copy size={11} />
                                  </button>

                                  {trackFilePath && (
                                    <button
                                      className="btn btn-danger"
                                      style={{ padding: '3px 6px', fontSize: '10px' }}
                                      onClick={() => handleDeleteIndividualFile(trackFilePath)}
                                      title={t('deleteItem')}
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                          Folder: <code style={{ color: '#a7f3d0' }}>{item.folderPath}</code>
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
