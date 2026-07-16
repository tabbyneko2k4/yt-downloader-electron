const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');


// Vô hiệu hóa tăng tốc phần cứng để tránh lỗi GPU trên môi trường VM/Sandbox/Remote
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-gpu-sandbox');

let mainWindow;
const activeDownloads = new Map();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f172a',
      symbolColor: '#94a3b8',
      height: 40
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    show: false
  });

  mainWindow.loadFile('index.html');

  // Show window when it is ready to avoid flashing
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // Clean up any running downloads on exit
  for (const [id, downloadProcess] of activeDownloads.entries()) {
    try {
      if (process.platform === 'win32') {
        const { exec } = require('child_process');
        exec(`taskkill /pid ${downloadProcess.pid} /T /F`);
      } else {
        downloadProcess.kill('SIGTERM');
      }
    } catch (e) {
      console.error(`Failed to kill process ${id}:`, e);
    }
  }
  if (process.platform !== 'darwin') app.quit();
});

// Helper: Sanitize folder name
function sanitizeFolderName(name) {
  if (!name) return 'Playlist';
  return name.replace(/[\\/:*?"<>|]/g, '_').trim();
}

// IPC Handler: Choose Destination Folder
ipcMain.handle('dialog:select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Chọn thư mục lưu tệp'
  });
  if (result.canceled) {
    return null;
  } else {
    return result.filePaths[0];
  }
});

// IPC Handler: Get System Downloads Path
ipcMain.handle('app:get-downloads-path', () => {
  return app.getPath('downloads');
});

// Helper: Get SoundCloud Client ID dynamically & resolve SoundCloud playlist
let soundcloudClientId = null;

async function getSoundcloudClientId() {
  if (soundcloudClientId) return soundcloudClientId;

  try {
    const response = await fetch('https://soundcloud.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await response.text();
    const scriptUrls = [];
    const scriptRegex = /<script[^>]+src=["'](https:\/\/a-v2\.sndcdn\.com\/assets\/[^"']+\.js)["']/g;
    let match;
    while ((match = scriptRegex.exec(html)) !== null) {
      scriptUrls.push(match[1]);
    }

    for (const url of scriptUrls.slice().reverse()) {
      try {
        const scriptRes = await fetch(url);
        const scriptText = await scriptRes.text();
        const idRegex = /client_id\s*:\s*["']([a-zA-Z0-9]{32})["']/i;
        const idMatch = idRegex.exec(scriptText);
        if (idMatch) {
          soundcloudClientId = idMatch[1];
          return soundcloudClientId;
        }
      } catch (e) {
        console.error(`Error reading SoundCloud script: ${url}`, e.message);
      }
    }
  } catch (e) {
    console.error('Failed to get SoundCloud client ID:', e.message);
  }
  return null;
}

async function fetchSoundcloudPlaylist(url, retry = true) {
  const clientId = await getSoundcloudClientId();
  if (!clientId) {
    throw new Error('Không thể lấy SoundCloud Client ID.');
  }

  const resolveUrl = `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(url)}&client_id=${clientId}`;
  const response = await fetch(resolveUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  if (response.status === 401 && retry) {
    soundcloudClientId = null;
    return fetchSoundcloudPlaylist(url, false);
  }

  if (!response.ok) {
    throw new Error(`SoundCloud API returned status ${response.status}`);
  }

  const data = await response.json();
  if (data.kind !== 'playlist') {
    throw new Error('URL không phải là một playlist/set SoundCloud.');
  }

  // SoundCloud API resolve only embeds full metadata for the first 5 tracks.
  // The rest are returned as stubs and must be fetched in batches via the /tracks endpoint.
  if (data.tracks && data.tracks.length > 0) {
    const unpopulated = data.tracks.filter(t => !t.title);
    if (unpopulated.length > 0) {
      const chunkSize = 50;
      const unpopulatedIds = unpopulated.map(t => t.id);
      const batchPromises = [];

      for (let i = 0; i < unpopulatedIds.length; i += chunkSize) {
        const chunk = unpopulatedIds.slice(i, i + chunkSize);
        const idsString = chunk.join(',');
        const batchUrl = `https://api-v2.soundcloud.com/tracks?ids=${idsString}&client_id=${clientId}`;

        batchPromises.push(
          fetch(batchUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          }).then(res => res.ok ? res.json() : [])
        );
      }

      try {
        const batchesResults = await Promise.all(batchPromises);
        const allBatchData = batchesResults.flat();
        const batchMap = new Map(allBatchData.map(t => [t.id, t]));

        // Merge batch data back into original tracks list in order
        data.tracks = data.tracks.map(t => {
          if (!t.title) {
            const details = batchMap.get(t.id);
            if (details) {
              return {
                ...t,
                ...details
              };
            }
          }
          return t;
        });
      } catch (err) {
        console.error('Failed to fetch SoundCloud batch tracks:', err.message);
      }
    }
  }

  return {
    success: true,
    isPlaylist: true,
    info: {
      title: data.title,
      uploader: data.user ? data.user.username : 'N/A',
      webpage_url: data.permalink_url || url,
      entriesCount: data.tracks ? data.tracks.length : 0,
      thumbnail: data.artwork_url || (data.tracks && data.tracks[0] ? (data.tracks[0].artwork_url || data.tracks[0].user?.avatar_url || '') : ''),
      entries: data.tracks ? data.tracks.map(t => ({
        title: t.title || 'Bài hát không tên',
        uploader: t.user ? t.user.username : 'N/A',
        duration: t.duration ? Math.round(t.duration / 1000) : null,
        url: t.permalink_url,
        thumbnail: t.artwork_url || (t.user ? t.user.avatar_url : '')
      })) : []
    }
  };
}

// IPC Handler: Get Video/Playlist Metadata
ipcMain.handle('yt-dlp:get-info', async (event, url) => {
  // Check if it's a SoundCloud playlist/set
  const isSoundcloudPlaylist = url.includes('soundcloud.com') && url.includes('/sets/');
  if (isSoundcloudPlaylist) {
    try {
      const playlistData = await fetchSoundcloudPlaylist(url);
      return playlistData;
    } catch (err) {
      console.error('Failed to resolve SoundCloud playlist via API, falling back to yt-dlp:', err.message);
    }
  }

  return new Promise((resolve, reject) => {
    // Run yt-dlp --flat-playlist --dump-single-json to support playlists/sets
    const process = spawn('yt-dlp', ['--flat-playlist', '--dump-single-json', url]);
    
    let stdoutData = '';
    let stderrData = '';

    process.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        try {
          const info = JSON.parse(stdoutData);
          const isPlaylist = info._type === 'playlist';
          
          if (isPlaylist) {
            resolve({
              success: true,
              isPlaylist: true,
              info: {
                title: info.title,
                uploader: info.uploader || info.channel || 'N/A',
                webpage_url: info.webpage_url || url,
                entriesCount: info.entries ? info.entries.length : 0,
                thumbnail: info.thumbnail || (info.entries && info.entries[0] ? (info.entries[0].thumbnail || (info.entries[0].thumbnails && info.entries[0].thumbnails[0] ? info.entries[0].thumbnails[0].url : '')) : ''),
                entries: info.entries ? info.entries.map(e => {
                  let title = e.title;
                  if (!title && e.url) {
                    const urlParts = e.url.split('/');
                    const trackSlug = urlParts[urlParts.length - 1];
                    const username = urlParts[urlParts.length - 2];
                    if (trackSlug && username) {
                      const cleanSlug = decodeURIComponent(trackSlug).replace(/[-_]/g, ' ');
                      const cleanUser = decodeURIComponent(username).replace(/[-_]/g, ' ');
                      title = `${cleanUser} - ${cleanSlug}`;
                    } else if (trackSlug) {
                      title = decodeURIComponent(trackSlug).replace(/[-_]/g, ' ');
                    } else {
                      title = e.url;
                    }
                  }
                  return {
                    title: title || 'Bài hát không tên',
                    uploader: e.uploader || e.channel || 'N/A',
                    duration: e.duration,
                    url: e.url,
                    thumbnail: e.thumbnail || (e.thumbnails && e.thumbnails[0] ? e.thumbnails[0].url : '')
                  };
                }) : []
              }
            });
          } else {
            resolve({
              success: true,
              isPlaylist: false,
              info: {
                title: info.title,
                thumbnail: info.thumbnail,
                duration: info.duration, // in seconds
                uploader: info.uploader || info.channel,
                webpage_url: info.webpage_url || url,
                formats: info.formats ? info.formats.map(f => ({
                  format_id: f.format_id,
                  ext: f.ext,
                  resolution: f.resolution,
                  filesize: f.filesize || f.filesize_approx,
                  fps: f.fps,
                  vcodec: f.vcodec,
                  acodec: f.acodec
                })) : []
              }
            });
          }
        } catch (e) {
          reject(new Error(`Failed to parse yt-dlp output: ${e.message}`));
        }
      } else {
        const errorMsg = stderrData.trim() || `Process exited with code ${code}`;
        reject(new Error(errorMsg));
      }
    });

    process.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(new Error('Không tìm thấy yt-dlp trên hệ thống. Hãy đảm bảo bạn đã cài đặt yt-dlp và cấu hình biến môi trường PATH.'));
      } else {
        reject(err);
      }
    });
  });
});

// Helper: Parse yt-dlp stdout progress lines
// Example line: [download]  12.3% of  45.67MiB at  2.34MiB/s ETA 00:20
// Or: [download]  12.3% of ~45.67MiB at  2.34MiB/s ETA 00:20 (approximate)
function parseProgress(line) {
  // Check if it's a download status line
  if (!line.includes('[download]')) return null;

  const percentMatch = line.match(/(\d+(?:\.\d+)?)%/);
  const sizeMatch = line.match(/of\s+([~\d\.]+[a-zA-Z]+)/);
  const speedMatch = line.match(/at\s+([^\s]+)/);
  const etaMatch = line.match(/ETA\s+([^\s]+)/);

  if (percentMatch) {
    return {
      percent: parseFloat(percentMatch[1]),
      totalSize: sizeMatch ? sizeMatch[1] : 'N/A',
      speed: speedMatch ? speedMatch[1] : 'N/A',
      eta: etaMatch ? etaMatch[1] : 'N/A'
    };
  }
  return null;
}

// IPC Handler: Download Video/Audio
ipcMain.handle('yt-dlp:download', async (event, { id, url, formatType, quality, destDir, isPlaylist, playlistTitle, playlistItems, embedMetadata, embedThumbnail }) => {
  if (activeDownloads.has(id)) {
    throw new Error('Tiến trình tải này đang được thực hiện.');
  }

  return new Promise((resolve, reject) => {
    const args = [];
    
    // Create base YT-DLP Download directory
    const baseDest = path.join(destDir, 'YT-DLP Download');
    try {
      if (!fs.existsSync(baseDest)) {
        fs.mkdirSync(baseDest, { recursive: true });
      }
    } catch (err) {
      console.error('Failed to create base directory:', err);
    }

    let finalDestDir = baseDest;

    // Output path template & playlist configuration
    if (isPlaylist) {
      const folderName = sanitizeFolderName(playlistTitle);
      finalDestDir = path.join(baseDest, folderName);
      try {
        if (!fs.existsSync(finalDestDir)) {
          fs.mkdirSync(finalDestDir, { recursive: true });
        }
      } catch (err) {
        console.error('Failed to create playlist directory:', err);
      }
      const outputTemplate = path.join(finalDestDir, '%(title)s.%(ext)s');
      args.push('-o', outputTemplate);

      if (playlistItems) {
        args.push('--playlist-items', playlistItems);
      }
    } else {
      args.push('--no-playlist');
      const outputTemplate = path.join(finalDestDir, '%(title)s.%(ext)s');
      args.push('-o', outputTemplate);
    }

    // Format selection logic
    if (formatType === 'video') {
      if (quality === 'best') {
        args.push('-f', 'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best');
      } else {
        // e.g., quality = '1080p', '720p', '480p'
        const height = quality.replace('p', '');
        args.push('-f', `bv*[height<=${height}][ext=mp4]+ba[ext=m4a]/b[height<=${height}][ext=mp4]/best`);
      }
    } else if (formatType === 'audio') {
      args.push('-x'); // extract audio
      if (quality === 'mp3-320') {
        args.push('--audio-format', 'mp3', '--audio-quality', '0');
      } else if (quality === 'mp3-192') {
        args.push('--audio-format', 'mp3', '--audio-quality', '5');
      } else if (quality === 'wav') {
        args.push('--audio-format', 'wav');
      } else if (quality === 'm4a') {
        args.push('--audio-format', 'm4a');
      } else {
        args.push('--audio-format', 'mp3');
      }
    }

    // Add metadata embedding options
    if (embedMetadata) {
      args.push('--embed-metadata');
    }
    if (embedThumbnail) {
      args.push('--embed-thumbnail');
      args.push('--convert-thumbnails', 'jpg');
    }

    args.push(url);

    console.log(`Starting download for ${id} with command: yt-dlp ${args.join(' ')}`);
    const downloadProcess = spawn('yt-dlp', args);
    activeDownloads.set(id, downloadProcess);

    let logs = '';

    downloadProcess.stdout.on('data', (data) => {
      const text = data.toString();
      logs += text;

      // Split lines to find progress or playlist changes
      const lines = text.split(/[\r\n]+/);
      for (const line of lines) {
        if (!line.trim()) continue;

        // Parse playlist item change
        const itemMatch = line.match(/\[download\] Downloading item (\d+) of (\d+)/);
        if (itemMatch) {
          mainWindow.webContents.send('download-item-change', {
            id,
            currentItem: parseInt(itemMatch[1], 10),
            totalItems: parseInt(itemMatch[2], 10)
          });
        }

        const progress = parseProgress(line);
        if (progress) {
          mainWindow.webContents.send('download-progress', { id, ...progress, logLine: line.trim() });
        } else {
          mainWindow.webContents.send('download-log', { id, logLine: line.trim() });
        }
      }
    });

    downloadProcess.stderr.on('data', (data) => {
      const text = data.toString();
      logs += text;
      mainWindow.webContents.send('download-log', { id, logLine: `[Error Log] ${text.trim()}` });
    });

    downloadProcess.on('close', (code) => {
      activeDownloads.delete(id);
      if (code === 0) {
        resolve({ success: true, destDir: finalDestDir, logs });
      } else {
        reject(new Error(`Quá trình tải kết thúc với mã lỗi ${code}`));
      }
    });

    downloadProcess.on('error', (err) => {
      activeDownloads.delete(id);
      reject(err);
    });
  });
});

// IPC Handler: Cancel Download
ipcMain.handle('yt-dlp:cancel', async (event, id) => {
  const downloadProcess = activeDownloads.get(id);
  if (downloadProcess) {
    if (process.platform === 'win32') {
      const { exec } = require('child_process');
      exec(`taskkill /pid ${downloadProcess.pid} /T /F`, (err) => {
        if (err) {
          console.error(`Failed to kill process tree for download ${id}:`, err);
          try {
            downloadProcess.kill('SIGKILL');
          } catch (e) {}
        }
      });
    } else {
      try {
        downloadProcess.kill('SIGTERM');
      } catch (e) {
        try {
          downloadProcess.kill('SIGKILL');
        } catch (e2) {}
      }
    }
    activeDownloads.delete(id);
    return true;
  }
  return false;
});

// IPC Handler: Open folder
ipcMain.handle('shell:open-folder', async (event, dirPath) => {
  if (!dirPath) return false;
  try {
    await shell.openPath(dirPath);
    return true;
  } catch (e) {
    console.error('Failed to open folder:', e);
    return false;
  }
});
