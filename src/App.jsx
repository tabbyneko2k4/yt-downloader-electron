import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import FooterDisclaimer from './components/FooterDisclaimer';
import ActiveDraftBar from './components/ActiveDraftBar';
import DownloaderTab from './components/DownloaderTab';
import AdvancedTab from './components/AdvancedTab';
import DownloadedTab from './components/DownloadedTab';
import SettingsTab from './components/SettingsTab';
import LogModal from './components/LogModal';
import DownloadQueueManager from './components/DownloadQueueManager';
import CloseModal from './components/CloseModal';
import { LanguageProvider } from './i18n/LanguageContext';

export default function App() {
  const [activeTab, setActiveTab] = useState('downloader');
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  // Settings State
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('media_downloader_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      language: 'en',
      theme: 'system',
      defaultPath: '',
      embedMetadata: true,
      embedThumbnail: true,
      defaultCookieBrowser: 'none',
      defaultCustomArgs: '',
      maxConcurrentDownloads: 3,
      playlistDragMode: 'folder' // 'folder' | 'files'
    };
  });

  // Persistent Media Draft State
  const [mediaDraft, setMediaDraft] = useState({
    url: '',
    mediaInfo: null,
    formatType: 'video',
    videoQuality: 'best',
    videoFps: 'auto',
    videoContainer: 'mp4',
    audioQuality: 'mp3-320',
    audioSampleRate: 'auto',
    gifFps: '15',
    gifRes: '480p',
    gifSpeed: '1.0',
    trimStart: '',
    trimEnd: '',
    playlistItems: '',
    writeThumbnail: false,
    writeDescription: false
  });

  const [failedDownloads, setFailedDownloads] = useState([]);

  // Clear draft
  const clearDraft = () => {
    setMediaDraft({
      url: '',
      mediaInfo: null,
      formatType: 'video',
      videoQuality: 'best',
      videoFps: 'auto',
      videoContainer: 'mp4',
      audioQuality: 'mp3-320',
      audioSampleRate: 'auto',
      gifFps: '15',
      gifRes: '480p',
      gifSpeed: '1.0',
      trimStart: '',
      trimEnd: '',
      playlistItems: '',
      writeThumbnail: false,
      writeDescription: false
    });
  };

  // Advanced Options State
  const [advancedOptions, setAdvancedOptions] = useState(() => {
    return {
      writeSubs: false,
      writeThumbnail: false,
      writeDescription: false,
      embedSubs: false,
      subLangs: 'vi,en',
      downloadSections: '',
      cookiesFromBrowser: settings.defaultCookieBrowser || 'none',
      rateLimit: '',
      customFormat: '',
      customArgs: settings.defaultCustomArgs || ''
    };
  });

  useEffect(() => {
    if (!settings.defaultPath && window.api && window.api.getDownloadsPath) {
      window.api.getDownloadsPath().then((path) => {
        if (path) {
          setSettings((prev) => ({ ...prev, defaultPath: path }));
        }
      });
    }
  }, []);

  // Dynamically apply Theme (dark, light, or system OS mode)
  useEffect(() => {
    const themeMode = settings.theme || 'system';
    const applyTheme = () => {
      let resolved = themeMode;
      if (themeMode === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', resolved);
      document.documentElement.classList.toggle('dark', resolved === 'dark');
    };

    applyTheme();

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [settings.theme]);

  // Sync settings with main process & mini window
  useEffect(() => {
    if (window.api && window.api.syncPushSettings) {
      window.api.syncPushSettings(settings);
    }
  }, [settings]);

  const updateSettings = (newFields) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newFields };
      localStorage.setItem('media_downloader_settings', JSON.stringify(updated));
      if (window.api && window.api.syncPushSettings) {
        window.api.syncPushSettings(updated);
      }
      return updated;
    });
  };

  // Downloads History State backed by User Documents JSON Database
  const [downloadsHistory, setDownloadsHistory] = useState([]);

  useEffect(() => {
    if (window.api && window.api.loadDownloadsDb) {
      window.api.loadDownloadsDb().then((data) => {
        if (Array.isArray(data)) {
          setDownloadsHistory(data);
        }
      });
    } else {
      const saved = localStorage.getItem('media_downloader_history');
      if (saved) {
        try { setDownloadsHistory(JSON.parse(saved)); } catch (e) {}
      }
    }
  }, []);

  useEffect(() => {
    if (!window.api || !window.api.onSyncDownloadsDb) return;
    const unsub = window.api.onSyncDownloadsDb((dbItems) => {
      if (Array.isArray(dbItems)) {
        setDownloadsHistory(dbItems);
      }
    });
    return () => unsub();
  }, []);

  const saveHistory = async (newHistory) => {
    setDownloadsHistory(newHistory);
    localStorage.setItem('media_downloader_history', JSON.stringify(newHistory));
    if (window.api && window.api.saveDownloadsDb) {
      await window.api.saveDownloadsDb(newHistory);
    }
    if (window.api && window.api.syncPushHistory) {
      window.api.syncPushHistory(newHistory);
    }
  };

  const clearAllHistory = async () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử đã tải?')) {
      if (window.api && window.api.clearDownloadsDb) {
        const updated = await window.api.clearDownloadsDb();
        setDownloadsHistory(updated);
      } else {
        saveHistory([]);
      }
    }
  };

  const deleteHistoryItem = async (id, filePath) => {
    if (window.api && window.api.deleteDownloadDbItem) {
      const updated = await window.api.deleteDownloadDbItem(id);
      setDownloadsHistory(updated);
    } else {
      const updated = downloadsHistory.filter((item) => item.id !== id);
      saveHistory(updated);
    }
  };


  // Queue & Downloads Management States
  const [activeDownloads, setActiveDownloads] = useState([]);
  const [downloadQueue, setDownloadQueue] = useState([]);
  const [pausedDownloads, setPausedDownloads] = useState([]);
  const [logModalItem, setLogModalItem] = useState(null);

  useEffect(() => {
    if (!window.api) return;

    const unsubProgress = window.api.onDownloadProgress((data) => {
      setActiveDownloads((prev) =>
        prev.map((dl) => {
          if (dl.id === data.id) {
            return {
              ...dl,
              percent: data.percent,
              speed: data.speed,
              totalSize: data.totalSize,
              eta: data.eta,
              logFilePath: data.logFilePath || dl.logFilePath,
              logs: (dl.logs || '') + (data.logLine ? data.logLine + '\n' : '')
            };
          }
          return dl;
        })
      );
    });

    const unsubItemChange = window.api.onDownloadItemChange && window.api.onDownloadItemChange((data) => {
      setActiveDownloads((prev) =>
        prev.map((dl) => {
          if (dl.id === data.id) {
            return {
              ...dl,
              currentItem: data.currentItem,
              totalItems: data.totalItems || dl.totalItems
            };
          }
          return dl;
        })
      );
    });

    const unsubLog = window.api.onDownloadLog((data) => {
      setActiveDownloads((prev) =>
        prev.map((dl) => {
          if (dl.id === data.id) {
            return {
              ...dl,
              logFilePath: data.logFilePath || dl.logFilePath,
              logs: (dl.logs || '') + (data.logLine ? data.logLine + '\n' : ''),
              currentTrackTitle: data.currentTrackTitle || dl.currentTrackTitle
            };
          }
          return dl;
        })
      );
    });

    return () => {
      if (unsubProgress) unsubProgress();
      if (unsubItemChange) unsubItemChange();
      if (unsubLog) unsubLog();
    };
  }, []);

  // Listen for mini window requesting a history push & sync updates
  useEffect(() => {
    if (!window.api) return;
    const unsubPush = window.api.onRequestPushHistory ? window.api.onRequestPushHistory(() => {
      if (window.api.syncPushHistory) {
        const saved = localStorage.getItem('media_downloader_history');
        const hist = saved ? JSON.parse(saved) : [];
        window.api.syncPushHistory(hist);
      }
    }) : null;

    const unsubSync = window.api.onSyncHistory ? window.api.onSyncHistory((hist) => {
      if (Array.isArray(hist)) {
        setDownloadsHistory(hist);
        localStorage.setItem('media_downloader_history', JSON.stringify(hist));
      }
    }) : null;

    // Push history on first load
    if (window.api.syncPushHistory) {
      const saved = localStorage.getItem('media_downloader_history');
      const hist = saved ? JSON.parse(saved) : [];
      window.api.syncPushHistory(hist);
    }
    return () => {
      if (unsubPush) unsubPush();
      if (unsubSync) unsubSync();
    };
  }, []);

  // Listen for download requests from mini window (relay into queue)
  useEffect(() => {
    if (!window.api || !window.api.onMiniDownloadRequest) return;
    const unsub = window.api.onMiniDownloadRequest((options) => {
      startDownload(options);
    });
    return () => { if (unsub) unsub(); };
  }, []);

  // Listen for tab navigation commands (e.g. notification click)
  useEffect(() => {
    if (!window.api || !window.api.onNavigateTab) return;
    const unsub = window.api.onNavigateTab((tabKey) => {
      if (tabKey) {
        setActiveTab(tabKey);
      }
    });
    return () => { if (unsub) unsub(); };
  }, []);

  // Listen for prompt-close-dialog from main process
  useEffect(() => {
    if (!window.api || !window.api.onPromptCloseDialog) return;
    const unsub = window.api.onPromptCloseDialog(() => {
      setIsCloseModalOpen(true);
    });
    return () => { if (unsub) unsub(); };
  }, []);

  // Push mediaDraft to main process whenever draft changes
  useEffect(() => {
    if (window.api && window.api.syncPushDraft) {
      window.api.syncPushDraft(mediaDraft);
    }
  }, [mediaDraft]);

  // Listen for draft sync updates (e.g. from MiniApp)
  useEffect(() => {
    if (!window.api || !window.api.onSyncDraft) return;
    const unsub = window.api.onSyncDraft((draft) => {
      if (draft && typeof draft === 'object') {
        setMediaDraft((prev) => ({
          ...prev,
          url: draft.url !== undefined ? draft.url : prev.url,
          mediaInfo: draft.mediaInfo !== undefined ? draft.mediaInfo : prev.mediaInfo,
          formatType: draft.formatType || prev.formatType,
          videoQuality: draft.quality || draft.videoQuality || prev.videoQuality,
          audioQuality: draft.quality || draft.audioQuality || prev.audioQuality,
          playlistItems: draft.playlistItems || (draft.playlistSelectedIndexes ? draft.playlistSelectedIndexes.join(',') : prev.playlistItems)
        }));
        if (draft.url || draft.mediaInfo) {
          setActiveTab('downloader');
        }
      }
    });
    return () => { if (unsub) unsub(); };
  }, []);

  // Process next queue task automatically
  useEffect(() => {
    const maxConcurrent = settings.maxConcurrentDownloads || 3;
    if (activeDownloads.length < maxConcurrent && downloadQueue.length > 0) {
      const nextTask = downloadQueue[0];
      setDownloadQueue((prev) => prev.slice(1));
      executeDownloadTask(nextTask);
    }
  }, [activeDownloads, downloadQueue, settings.maxConcurrentDownloads]);

  const executeDownloadTask = async (options) => {
    const newDownload = {
      ...options,
      percent: 0,
      speed: '',
      totalSize: '',
      eta: '',
      currentItem: options.isPlaylist ? 1 : null,
      totalItems: options.isPlaylist ? (options.playlistEntries?.length || null) : null,
      logs: 'Đang khởi chạy tiến trình tải...\n'
    };

    setActiveDownloads((prev) => [newDownload, ...prev]);

    try {
      if (window.api && window.api.downloadVideo) {
        const result = await window.api.downloadVideo(options);
        setActiveDownloads((prev) => prev.filter((d) => d.id !== options.id));

        if (result.paused) {
          setPausedDownloads((prev) => [{ ...newDownload, ...result }, ...prev]);
          return;
        }

        if (result.cancelled) {
          const historyItem = {
            id: options.id,
            title: (options.playlistTitle || options.mediaTitle || 'Media File') + ' (⚠️ Đã hủy dở chừng)',
            uploader: options.uploader,
            thumbnail: options.thumbnail,
            duration: options.duration,
            formatType: options.formatType,
            sourceUrl: options.url,
            filePath: result.destDir,
            folderPath: result.destDir,
            isPlaylist: options.isPlaylist,
            playlistEntries: options.playlistEntries || null,
            downloadedFiles: result.files || [],
            isCancelled: true,
            originalOptions: options,
            logFilePath: result.logFilePath,
            downloadedAt: Date.now()
          };
          if (window.api && window.api.addDownloadDbItem) {
            const updated = await window.api.addDownloadDbItem(historyItem);
            setDownloadsHistory(updated);
          } else {
            saveHistory([historyItem, ...downloadsHistory]);
          }
          return;
        }

        if (result.success) {
          const downloadedFile = result.files && result.files.length > 0 ? result.files[0] : null;

          if (options.isPlaylistItem && options.groupId) {
            let updatedHistory;
            const itemPayload = {
              ...options,
              filePath: downloadedFile || result.destDir,
              downloadedFiles: downloadedFile ? [downloadedFile] : []
            };

            if (window.api && window.api.addDownloadDbItem) {
              updatedHistory = await window.api.addDownloadDbItem(itemPayload);
              setDownloadsHistory(updatedHistory);
            } else {
              const freshDb = JSON.parse(localStorage.getItem('media_downloader_history') || '[]');
              const trackFile = downloadedFile || result.destDir;
              const currentItemChild = {
                id: options.id || `${options.groupId}_item_${Date.now()}`,
                title: options.mediaTitle || options.title || 'Track Item',
                uploader: options.uploader || '',
                duration: options.duration || 0,
                thumbnail: options.thumbnail || '',
                filePath: trackFile,
                sourceUrl: options.url,
                formatType: options.formatType,
                status: 'completed',
                downloadedAt: Date.now()
              };
              const parentIdx = freshDb.findIndex(i => i.id === options.groupId);
              if (parentIdx >= 0) {
                const parent = { ...freshDb[parentIdx], isPlaylist: true };
                const currentFiles = parent.downloadedFiles || [];
                if (trackFile && !currentFiles.includes(trackFile)) parent.downloadedFiles = [...currentFiles, trackFile];
                const currentItems = parent.playlist_items || parent.playlistEntries || [];
                if (!currentItems.some(it => it.filePath === trackFile || it.title === currentItemChild.title)) {
                  parent.playlist_items = [...currentItems, currentItemChild];
                  parent.playlistEntries = parent.playlist_items;
                }
                freshDb[parentIdx] = parent;
              } else {
                freshDb.unshift({
                  id: options.groupId,
                  title: options.playlistTitle || options.mediaTitle || 'Playlist',
                  uploader: options.uploader,
                  thumbnail: options.thumbnail,
                  formatType: options.formatType,
                  sourceUrl: options.playlistSourceUrl || options.url,
                  filePath: result.destDir,
                  folderPath: result.destDir,
                  isPlaylist: true,
                  entriesCount: options.playlistTotalItems || options.playlistEntries?.length || 1,
                  playlist_items: [currentItemChild],
                  playlistEntries: [currentItemChild],
                  downloadedFiles: trackFile ? [trackFile] : [],
                  downloadedAt: Date.now()
                });
              }
              saveHistory(freshDb);
            }
          } else {
            // Standard item or bulk playlist download
            const rawEntries = options.playlistEntries || [];
            const processedPlaylistItems = options.isPlaylist
              ? (result.files || []).map((f, i) => {
                const entry = rawEntries[i] || {};
                return {
                  id: entry.id || `${options.id}_sub_${i}`,
                  title: entry.title || `Track ${i + 1}`,
                  uploader: entry.uploader || options.uploader || '',
                  duration: entry.duration || 0,
                  thumbnail: entry.thumbnail || options.thumbnail || '',
                  filePath: f,
                  sourceUrl: entry.url || options.url,
                  formatType: options.formatType,
                  status: 'completed',
                  downloadedAt: Date.now()
                };
              })
              : null;

            const historyItem = {
              id: options.id,
              title: options.isPlaylist ? (options.playlistTitle || options.mediaTitle) : (options.mediaTitle || 'Media File'),
              uploader: options.uploader,
              thumbnail: options.thumbnail,
              duration: options.duration,
              formatType: options.formatType,
              sourceUrl: options.url,
              filePath: downloadedFile || result.destDir,
              folderPath: result.destDir,
              isPlaylist: options.isPlaylist,
              playlist_items: processedPlaylistItems || options.playlistEntries || null,
              playlistEntries: processedPlaylistItems || options.playlistEntries || null,
              downloadedFiles: result.files || [],
              entriesCount: options.isPlaylist ? (result.files?.length || options.playlistEntries?.length || 1) : 1,
              downloadedAt: Date.now()
            };

            if (window.api && window.api.addDownloadDbItem) {
              const updated = await window.api.addDownloadDbItem(historyItem);
              setDownloadsHistory(updated);
            } else {
              saveHistory([historyItem, ...downloadsHistory]);
            }
          }
        }

      }
    } catch (err) {
      setActiveDownloads((prev) => prev.filter((d) => d.id !== options.id));
      const failedItem = {
        ...options,
        isFailed: true,
        errorMessage: err.message || 'Quá trình tải thất bại (yt-dlp)',
        failedAt: Date.now()
      };
      setFailedDownloads((prev) => [failedItem, ...prev]);
    }
  };

  const retryDownload = (failedTask) => {
    setFailedDownloads((prev) => prev.filter((d) => d.id !== failedTask.id));
    startDownload(failedTask);
  };

  const removeFailedTask = (id) => {
    setFailedDownloads((prev) => prev.filter((d) => d.id !== id));
  };

  const startDownload = (options) => {
    // Check Duplicate Detection (only for root downloads, not sub-playlist items)
    if (!options.isPlaylistItem) {
      const duplicatePolicy = settings.duplicateAction || 'ask';
      const targetUrl = options.url;
      const targetTitle = options.playlistTitle || options.mediaTitle;

      const existingMatch = downloadsHistory.find(
        (h) => (targetUrl && (h.sourceUrl === targetUrl || h.url === targetUrl)) || (targetTitle && h.title === targetTitle)
      );

      if (existingMatch) {
        if (duplicatePolicy === 'ask') {
          const choice = confirm(
            `Mục này đã tồn tại trong lịch sử database:\n"${existingMatch.title}"\n\n- Nhấn OK để GHI ĐÈ (Overwrite)\n- Nhấn Cancel để PHÂN CÁCH BẢNG / TẠO MỤC MỚI (Separate Entry)`
          );
          if (choice) {
            // Ghi đè: Xóa bản ghi cũ trong db trước
            deleteHistoryItem(existingMatch.id, existingMatch.filePath);
          }
        } else if (duplicatePolicy === 'overwrite') {
          deleteHistoryItem(existingMatch.id, existingMatch.filePath);
        }
        // nếu policy === 'separate', giữ nguyên bản ghi cũ và thêm bản ghi mới
      }
    }

    if (options.isPlaylist && options.playlistEntries && options.playlistEntries.length > 0) {
      const groupId = options.id || Date.now().toString();

      const baseFolder = options.destDir || settings.defaultPath || 'C:\\Users\\1\\Downloads';
      const folderName = (options.playlistTitle || options.mediaTitle || 'Playlist').replace(/[\\/:*?"<>|]/g, '_').trim();
      const playlistFolderPath = `${baseFolder}\\Media Download\\${folderName}`;

      // Immediately register Master Playlist entry to DB so sub-items always find parent
      const masterPlaylistEntry = {
        id: groupId,
        title: options.playlistTitle || options.mediaTitle || 'Playlist',
        uploader: options.uploader || '',
        thumbnail: options.thumbnail || '',
        formatType: options.formatType || 'video',
        sourceUrl: options.playlistSourceUrl || options.url,
        filePath: playlistFolderPath,
        folderPath: playlistFolderPath,
        playlistDir: playlistFolderPath,
        isPlaylist: true,
        isPlaylistItem: false,
        entriesCount: options.playlistEntries.length,
        playlist_items: [],
        playlistEntries: [],
        downloadedFiles: [],
        downloadedAt: Date.now()
      };

      if (window.api && window.api.addDownloadDbItem) {
        window.api.addDownloadDbItem(masterPlaylistEntry).then((updated) => {
          setDownloadsHistory(updated);
        });
      } else {
        saveHistory([masterPlaylistEntry, ...downloadsHistory]);
      }

      const expandedTasks = options.playlistEntries.map((entry, idx) => {
        const itemNum = idx + 1;
        return {
          ...options,
          id: `${groupId}_item_${itemNum}`,
          groupId: groupId,
          playlistTitle: options.playlistTitle || options.mediaTitle,
          mediaTitle: entry.title || `Bài #${itemNum}`,
          uploader: entry.uploader || options.uploader,
          thumbnail: entry.thumbnail || options.thumbnail,
          duration: entry.duration,
          url: entry.url || options.url,
          playlistItems: String(itemNum),
          isPlaylist: false,
          isPlaylistItem: true,
          playlistIndex: itemNum,
          playlistTotalItems: options.playlistEntries.length,
          playlistEntries: options.playlistEntries
        };
      });

      // Expand playlist tasks into parallel queue
      setDownloadQueue((prev) => [...prev, ...expandedTasks]);
      return;
    }

    const maxConcurrent = settings.maxConcurrentDownloads || 3;
    if (activeDownloads.length < maxConcurrent) {
      executeDownloadTask(options);
    } else {
      setDownloadQueue((prev) => [...prev, options]);
    }
  };

  const pauseDownload = async (id) => {
    if (window.api && window.api.pauseDownload) {
      await window.api.pauseDownload(id);
    }
  };

  const resumeDownload = (taskItem) => {
    setPausedDownloads((prev) => prev.filter((d) => d.id !== taskItem.id));
    startDownload(taskItem);
  };

  const cancelDownload = async (id) => {
    if (window.api && window.api.cancelDownload) {
      await window.api.cancelDownload(id);
    }
    setActiveDownloads((prev) => prev.filter((d) => d.id !== id));
    setPausedDownloads((prev) => prev.filter((d) => d.id !== id));
  };

  const cancelQueuedTask = (id) => {
    setDownloadQueue((prev) => prev.filter((d) => d.id !== id));
  };

  // Reorder Queue Items
  const moveQueueItem = (fromIndex, toIndex, action) => {
    setDownloadQueue((prev) => {
      const updated = [...prev];
      if (action === 'top') {
        const item = updated.splice(fromIndex, 1)[0];
        updated.unshift(item);
      } else if (action === 'up' && fromIndex > 0) {
        const item = updated.splice(fromIndex, 1)[0];
        updated.splice(fromIndex - 1, 0, item);
      } else if (action === 'down' && fromIndex < updated.length - 1) {
        const item = updated.splice(fromIndex, 1)[0];
        updated.splice(fromIndex + 1, 0, item);
      } else if (action === 'reorder') {
        const item = updated.splice(fromIndex, 1)[0];
        updated.splice(toIndex, 0, item);
      }
      return updated;
    });
  };

  return (
    <LanguageProvider language={settings.language || 'en'} onLanguageChange={(lang) => updateSettings({ language: lang })}>
      <div className="app-container relative overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
        {/* Ambient background glow - Pink & Blue Neon Gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(236,72,153,0.10)_0%,transparent_50%),radial-gradient(circle_at_85%_85%,rgba(59,130,246,0.10)_0%,transparent_50%)] dark:bg-[radial-gradient(circle_at_15%_10%,rgba(236,72,153,0.18)_0%,transparent_50%),radial-gradient(circle_at_85%_85%,rgba(59,130,246,0.18)_0%,transparent_50%)] pointer-events-none z-0 transform-gpu" />

        {/* Top Header & Tab Navigation */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          downloadsCount={downloadsHistory.length}
          activeDownloads={activeDownloads}
          downloadQueue={downloadQueue}
          settings={settings}
          updateSettings={updateSettings}
        />

        {/* Under-Taskbar Download Status Bar */}
        {(activeDownloads.length > 0 || downloadQueue.length > 0 || pausedDownloads.length > 0 || failedDownloads.length > 0) && (
          <DownloadQueueManager
            activeDownloads={activeDownloads}
            downloadQueue={downloadQueue}
            pausedDownloads={pausedDownloads}
            failedDownloads={failedDownloads}
            pauseDownload={pauseDownload}
            resumeDownload={resumeDownload}
            cancelDownload={cancelDownload}
            cancelQueuedTask={cancelQueuedTask}
            retryDownload={retryDownload}
            removeFailedTask={removeFailedTask}
            moveQueueItem={moveQueueItem}
            openLogModal={(item) => setLogModalItem(item)}
          />
        )}

        {/* Under-Taskbar Active Draft Bar */}
        {activeTab !== 'downloader' && (
          <ActiveDraftBar
            mediaDraft={mediaDraft}
            setActiveTab={setActiveTab}
            clearDraft={clearDraft}
            startDownload={startDownload}
            settings={settings}
            advancedOptions={advancedOptions}
          />
        )}

        {/* Main Tab Viewport */}
        <main className="tab-content-container">
          <div key={activeTab} className="tab-pane-animate">
            {activeTab === 'downloader' && (
              <DownloaderTab
                settings={settings}
                advancedOptions={advancedOptions}
                setAdvancedOptions={setAdvancedOptions}
                activeDownloads={activeDownloads}
                startDownload={startDownload}
                cancelDownload={cancelDownload}
                openLogModal={(item) => setLogModalItem(item)}
                goToAdvanced={() => setActiveTab('advanced')}
                mediaDraft={mediaDraft}
                setMediaDraft={setMediaDraft}
              />
            )}

            {activeTab === 'advanced' && (
              <AdvancedTab
                advancedOptions={advancedOptions}
                setAdvancedOptions={setAdvancedOptions}
              />
            )}

            {activeTab === 'downloads' && (
              <DownloadedTab
                downloadsHistory={downloadsHistory}
                activeDownloads={activeDownloads}
                cancelDownload={cancelDownload}
                clearAllHistory={clearAllHistory}
                deleteHistoryItem={deleteHistoryItem}
                resumeDownload={resumeDownload}
                settings={settings}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsTab
                settings={settings}
                updateSettings={updateSettings}
              />
            )}
          </div>
        </main>

        {/* Sticky Bottom Disclaimer Bar */}
        {settings.showFooterDisclaimer !== false && (
          <FooterDisclaimer onClose={() => updateSettings({ showFooterDisclaimer: false })} />
        )}

        {/* CLI Output Log Modal */}
        {logModalItem && (
          <LogModal
            title={logModalItem.mediaTitle}
            logs={logModalItem.logs}
            logFilePath={logModalItem.logFilePath}
            onClose={() => setLogModalItem(null)}
          />
        )}

        {/* Exit / Minimize Confirmation Modal */}
        <CloseModal
          isOpen={isCloseModalOpen}
          onClose={() => setIsCloseModalOpen(false)}
          settings={settings}
          updateSettings={updateSettings}
        />
      </div>
    </LanguageProvider>
  );
}
