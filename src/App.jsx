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
import { LanguageProvider } from './i18n/LanguageContext';

export default function App() {
  const [activeTab, setActiveTab] = useState('downloader');

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
    };

    applyTheme();

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [settings.theme]);

  const updateSettings = (newFields) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newFields };
      localStorage.setItem('media_downloader_settings', JSON.stringify(updated));
      return updated;
    });
  };

  // Downloads History State
  const [downloadsHistory, setDownloadsHistory] = useState(() => {
    const saved = localStorage.getItem('media_downloader_history');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  const saveHistory = (newHistory) => {
    setDownloadsHistory(newHistory);
    localStorage.setItem('media_downloader_history', JSON.stringify(newHistory));
    // Sync to mini window via main process
    if (window.api && window.api.syncPushHistory) {
      window.api.syncPushHistory(newHistory);
    }
  };

  const clearAllHistory = () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử đã tải?')) {
      saveHistory([]);
    }
  };

  const deleteHistoryItem = async (id, filePath) => {
    const updated = downloadsHistory.filter((item) => item.id !== id);
    saveHistory(updated);
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
          saveHistory([historyItem, ...downloadsHistory]);
          return;
        }

        if (result.success) {
          const downloadedFile = result.files && result.files.length > 0 ? result.files[0] : null;

          if (options.isPlaylistItem && options.groupId) {
            setDownloadsHistory((prevHistory) => {
              const existingIndex = prevHistory.findIndex((item) => item.id === options.groupId);
              const trackFile = downloadedFile || result.destDir;

              if (existingIndex >= 0) {
                const existingMaster = { ...prevHistory[existingIndex] };
                const currentFiles = existingMaster.downloadedFiles || [];
                if (trackFile && !currentFiles.includes(trackFile)) {
                  existingMaster.downloadedFiles = [...currentFiles, trackFile];
                }
                const updated = [...prevHistory];
                updated[existingIndex] = existingMaster;
                localStorage.setItem('downloads_history', JSON.stringify(updated));
                return updated;
              } else {
                const masterPlaylistHistory = {
                  id: options.groupId,
                  title: options.playlistTitle || options.mediaTitle || 'Playlist',
                  uploader: options.uploader,
                  thumbnail: options.thumbnail,
                  formatType: options.formatType,
                  filePath: result.destDir,
                  folderPath: result.destDir,
                  isPlaylist: true,
                  entriesCount: options.playlistTotalItems || options.playlistEntries?.length || 1,
                  playlistEntries: options.playlistEntries || [],
                  downloadedFiles: trackFile ? [trackFile] : [],
                  downloadedAt: Date.now()
                };
                const updated = [masterPlaylistHistory, ...prevHistory];
                localStorage.setItem('downloads_history', JSON.stringify(updated));
                return updated;
              }
            });
          } else {
            const historyItem = {
              id: options.id,
              title: options.isPlaylist ? (options.playlistTitle || options.mediaTitle) : (options.mediaTitle || 'Media File'),
              uploader: options.uploader,
              thumbnail: options.thumbnail,
              duration: options.duration,
              formatType: options.formatType,
              filePath: downloadedFile || result.destDir,
              folderPath: result.destDir,
              isPlaylist: options.isPlaylist,
              playlistEntries: options.playlistEntries || null,
              downloadedFiles: result.files || [],
              entriesCount: options.isPlaylist ? (result.files?.length || options.playlistEntries?.length || 1) : 1,
              downloadedAt: Date.now()
            };

            saveHistory([historyItem, ...downloadsHistory]);
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
    if (options.isPlaylist && options.playlistEntries && options.playlistEntries.length > 0) {
      const groupId = options.id || Date.now().toString();
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
      <div className="app-container">
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
      </div>
    </LanguageProvider>
  );
}
