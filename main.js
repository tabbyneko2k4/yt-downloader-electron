const { app, BrowserWindow, ipcMain, dialog, shell, nativeImage } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Cấu hình thư mục dữ liệu cục bộ để tránh lỗi "Access is denied" khi truy cập cache
let userDataPath;
if (app.isPackaged) {
  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    userDataPath = path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'electron_user_data');
  } else {
    // Sử dụng thư mục mặc định của hệ thống khi được cài đặt qua bộ cài (NSIS)
    userDataPath = path.join(app.getPath('appData'), app.name || 'YT-DLP Premium Downloader');
  }
} else {
  userDataPath = path.join(__dirname, 'electron_user_data');
}
app.setPath('userData', userDataPath);

// Valid 32x32 RGBA PNG Buffer for Native Drag Icon
const validPngBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAACJSURBVFiF7dJBDsAgCATA+P+/toemTaqRzQB72EvWbGa2vScCgABwAD+APAEwB6gD1ADsAIeAHeAQMAe4BFwCnAJyQAk4BRSBCiABFEACxIB5QAYoAZlAZ0ABpIALUAMkgAzIBzqDBPABj8ArgARQAiZBBlgCYgB3gD0gBuQAyIDvAAdA/d4BDtY5QeQ1Y1UAAAAASUVORK5CYII=',
  'base64'
);

// Tạo icon kéo thả mặc định để tương thích đa nền tảng (đặc biệt là macOS)
const dragIconPath = path.join(userDataPath, 'drag-icon.png');
try {
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  if (!fs.existsSync(dragIconPath)) {
    fs.writeFileSync(dragIconPath, validPngBuffer);
  }
} catch (e) {
  console.error('Failed to create drag icon:', e);
}

let binDir;
if (app.isPackaged) {
  binDir = path.join(path.dirname(process.execPath), 'bin');
} else {
  binDir = path.join(__dirname, 'bin');
}

function findBinaryInWinGetPackages(binaryName) {
  if (process.platform !== 'win32') return null;
  const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || 'C:\\Users\\1', 'AppData', 'Local');
  const packagesDir = path.join(localAppData, 'Microsoft', 'WinGet', 'Packages');
  
  if (!fs.existsSync(packagesDir)) return null;

  try {
    const pkgFolders = fs.readdirSync(packagesDir);
    for (const folder of pkgFolders) {
      const fullFolder = path.join(packagesDir, folder);
      try {
        const stat = fs.statSync(fullFolder);
        if (stat.isDirectory()) {
          // Direct check inside package folder
          const directFile = path.join(fullFolder, binaryName);
          if (fs.existsSync(directFile)) return directFile;

          // Check bin/ subfolder
          const binFile = path.join(fullFolder, 'bin', binaryName);
          if (fs.existsSync(binFile)) return binFile;

          // Sub-folder search (e.g., Gyan.FFmpeg/ffmpeg-8.1.2-full_build/bin/ffmpeg.exe)
          const subEntries = fs.readdirSync(fullFolder);
          for (const sub of subEntries) {
            const subPath = path.join(fullFolder, sub);
            try {
              if (fs.statSync(subPath).isDirectory()) {
                const subBinFile = path.join(subPath, 'bin', binaryName);
                if (fs.existsSync(subBinFile)) return subBinFile;
                const subDirectFile = path.join(subPath, binaryName);
                if (fs.existsSync(subDirectFile)) return subDirectFile;
              }
            } catch (e) {}
          }
        }
      } catch (e) {}
    }
  } catch (e) {}
  return null;
}

function getExtraBinSearchPaths() {
  if (process.platform !== 'win32') return [];
  const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || 'C:\\Users\\1', 'AppData', 'Local');
  const wingetLinks = path.join(localAppData, 'Microsoft', 'WinGet', 'Links');
  const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
  const ffmpegWinGet = findBinaryInWinGetPackages('ffmpeg.exe');
  const ytDlpWinGet = findBinaryInWinGetPackages('yt-dlp.exe');
  
  const paths = [
    wingetLinks,
    path.join(localAppData, 'Programs', 'yt-dlp'),
    path.join(programFiles, 'yt-dlp')
  ];

  if (ffmpegWinGet) paths.push(path.dirname(ffmpegWinGet));
  if (ytDlpWinGet) paths.push(path.dirname(ytDlpWinGet));

  return paths;
}

function getBinPaths() {
  const isWin = process.platform === 'win32';
  return {
    ytDlp: path.join(binDir, isWin ? 'yt-dlp.exe' : 'yt-dlp'),
    ffmpeg: path.join(binDir, isWin ? 'ffmpeg.exe' : 'ffmpeg'),
    ffprobe: path.join(binDir, isWin ? 'ffprobe.exe' : 'ffprobe')
  };
}

function getYtDlpCommand() {
  const paths = getBinPaths();
  if (fs.existsSync(paths.ytDlp)) return paths.ytDlp;

  const winGetPkg = findBinaryInWinGetPackages('yt-dlp.exe');
  if (winGetPkg) return winGetPkg;

  const extraPaths = getExtraBinSearchPaths();
  for (const dir of extraPaths) {
    const candidate = path.join(dir, 'yt-dlp.exe');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return 'yt-dlp';
}

function getSpawnEnv() {
  const extraPaths = [binDir, ...getExtraBinSearchPaths()];
  const pathSeparator = process.platform === 'win32' ? ';' : ':';
  return {
    ...process.env,
    PATH: `${extraPaths.join(pathSeparator)}${pathSeparator}${process.env.PATH || ''}`,
    PYTHONIOENCODING: 'utf-8',
    LANG: 'en_US.UTF-8'
  };
}


app.disableHardwareAcceleration();
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-gpu-sandbox');

let mainWindow;
const activeDownloads = new Map();
const cancelledDownloads = new Set();
const pausedDownloads = new Set();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1050,
    height: 780,
    minWidth: 850,
    minHeight: 650,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    show: false
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  const distPath = path.join(__dirname, 'dist-react', 'index.html');

  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else if (fs.existsSync(distPath)) {
    mainWindow.loadFile(distPath);
  } else {
    mainWindow.loadFile('index.html');
  }

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

// Window Control IPC Handlers
ipcMain.handle('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('window:close', () => {
  if (mainWindow) mainWindow.close();
});

// Helpers
function sanitizeFolderName(name) {
  if (!name) return 'Playlist';
  return name.replace(/[\\/:*?"<>|]/g, '_').trim();
}

function stripAnsi(str) {
  return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

function parseCliArgs(argsString) {
  if (!argsString || typeof argsString !== 'string') return [];
  const regex = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|([^\s"']+)/g;
  const matches = [];
  let match;
  while ((match = regex.exec(argsString)) !== null) {
    matches.push(match[1] || match[2] || match[3]);
  }
  return matches;
}

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

ipcMain.handle('app:get-downloads-path', () => {
  return app.getPath('downloads');
});

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

        data.tracks = data.tracks.map(t => {
          if (!t.title) {
            const details = batchMap.get(t.id);
            if (details) {
              return { ...t, ...details };
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

ipcMain.handle('yt-dlp:get-info', async (event, url) => {
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
    const ytDlpCmd = getYtDlpCommand();
    const env = getSpawnEnv();
    const child = spawn(ytDlpCmd, ['--flat-playlist', '--dump-single-json', url], { env });
    
    let stdoutData = '';
    let stderrData = '';

    child.stdout.on('data', (data) => { stdoutData += data.toString(); });
    child.stderr.on('data', (data) => { stderrData += data.toString(); });

    child.on('close', (code) => {
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
                duration: info.duration,
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

    child.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(new Error('Không tìm thấy yt-dlp trên hệ thống. Hãy đảm bảo bạn đã cài đặt đầy đủ các thư viện.'));
      } else {
        reject(err);
      }
    });
  });
});

function parseProgress(line) {
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

// Get app user data logs directory to avoid cluttering media folders
function getLogsDir() {
  const appLogsDir = path.join(app.getPath('userData'), 'logs');
  try {
    if (!fs.existsSync(appLogsDir)) {
      fs.mkdirSync(appLogsDir, { recursive: true });
    }
  } catch (e) {}
  return appLogsDir;
}

// Write/Update Task Log JSON Manifest file
function saveTaskLogManifest(destDir, options, status, extraData = {}) {
  try {
    const logsDir = getLogsDir();
    const taskLogFileName = `download_${sanitizeFolderName(options.playlistTitle || options.mediaTitle)}_${options.id}.task.json`;
    const taskLogFilePath = path.join(logsDir, taskLogFileName);

    const manifestData = {
      id: options.id,
      url: options.url,
      mediaTitle: options.mediaTitle,
      uploader: options.uploader,
      thumbnail: options.thumbnail,
      duration: options.duration,
      formatType: options.formatType,
      quality: options.quality,
      isPlaylist: options.isPlaylist,
      playlistTitle: options.playlistTitle,
      playlistItems: options.playlistItems,
      playlistEntries: options.playlistEntries,
      destDir,
      status,
      downloadedIndexes: extraData.downloadedIndexes || [],
      missingIndexes: extraData.missingIndexes || [],
      downloadedFiles: extraData.downloadedFiles || [],
      options,
      updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(taskLogFilePath, JSON.stringify(manifestData, null, 2), 'utf-8');
    return taskLogFilePath;
  } catch (e) {
    console.error('Failed to save task log manifest:', e);
    return null;
  }
}

// Download Handler supporting Task Log Manifest & Resumable Resume
ipcMain.handle('yt-dlp:download', async (event, options) => {
  const {
    id, url, formatType, quality, destDir, isPlaylist, playlistTitle, playlistItems,
    embedMetadata, embedThumbnail, writeThumbnail, writeDescription,
    videoFps, videoContainer, audioSampleRate, gifFps, gifRes, gifSpeed,
    trimStart, trimEnd,
    writeSubs, embedSubs, subLangs, downloadSections,
    cookiesFromBrowser, rateLimit, customFormat, customArgs,
    playlistEntries
  } = options;

  if (activeDownloads.has(id)) {
    throw new Error('Tiến trình tải này đang được thực hiện.');
  }

  return new Promise((resolve, reject) => {
    const args = ['--continue'];
    
    const baseDest = path.join(destDir, 'Media Download');
    try {
      if (!fs.existsSync(baseDest)) {
        fs.mkdirSync(baseDest, { recursive: true });
      }
    } catch (err) {
      console.error('Failed to create base directory:', err);
    }

    let finalDestDir = baseDest;

    if (isPlaylist || options.isPlaylistItem || playlistTitle) {
      const folderName = sanitizeFolderName(playlistTitle || options.mediaTitle);
      finalDestDir = path.join(baseDest, folderName);
      try {
        if (!fs.existsSync(finalDestDir)) {
          fs.mkdirSync(finalDestDir, { recursive: true });
        }
      } catch (err) {
        console.error('Failed to create playlist directory:', err);
      }
      args.push('-o', path.join(finalDestDir, '%(title)s.%(ext)s'));
      if (playlistItems) {
        args.push('--playlist-items', playlistItems);
      }
    } else {
      args.push('--no-playlist');
      args.push('-o', path.join(finalDestDir, '%(title)s.%(ext)s'));
    }

    // Video / Format options
    if (formatType === 'thumbnail') {
      args.push('--skip-download', '--write-thumbnail', '--convert-thumbnails', 'jpg');
    } else if (customFormat && customFormat.trim()) {
      args.push('-f', customFormat.trim());
    } else if (formatType === 'video') {
      let formatSelector = 'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best';
      if (quality && quality !== 'best') {
        const height = quality.replace('p', '');
        formatSelector = `bv*[height<=${height}][ext=mp4]+ba[ext=m4a]/b[height<=${height}][ext=mp4]/best`;
      }
      if (videoFps && videoFps !== 'auto') {
        formatSelector = `bv*[fps<=${videoFps}]+ba/best`;
      }
      args.push('-f', formatSelector);

      if (videoContainer && videoContainer !== 'mp4') {
        args.push('--remux-video', videoContainer);
      }
    } else if (formatType === 'audio') {
      args.push('-x');
      if (quality === 'mp3-320') {
        args.push('--audio-format', 'mp3', '--audio-quality', '0');
      } else if (quality === 'mp3-192') {
        args.push('--audio-format', 'mp3', '--audio-quality', '5');
      } else if (quality === 'wav') {
        args.push('--audio-format', 'wav');
      } else if (quality === 'm4a') {
        args.push('--audio-format', 'm4a');
      } else if (quality === 'flac') {
        args.push('--audio-format', 'flac');
      } else if (quality === 'opus') {
        args.push('--audio-format', 'opus');
      } else {
        args.push('--audio-format', 'mp3');
      }

      if (audioSampleRate && audioSampleRate !== 'auto') {
        args.push('--postprocessor-args', `ExtractAudio+ffmpeg:-ar ${audioSampleRate}`);
      }
    } else if (formatType === 'gif') {
      args.push('--recode-video', 'gif');
      if (gifRes && gifRes !== 'original') {
        const height = gifRes.replace('p', '');
        args.push('-f', `bv*[height<=${height}]+ba/b[height<=${height}]/best`);
      }

      const ffmpegFilters = [];
      if (gifFps) ffmpegFilters.push(`-r ${gifFps}`);
      if (gifSpeed && parseFloat(gifSpeed) !== 1.0) {
        const ptsMult = (1.0 / parseFloat(gifSpeed)).toFixed(2);
        ffmpegFilters.push(`-filter:v setpts=${ptsMult}*PTS`);
      }

      if (ffmpegFilters.length > 0) {
        args.push('--postprocessor-args', `VideoConvertor:${ffmpegFilters.join(' ')}`);
      }
    }

    // Separate assets options (when not thumbnail mode)
    if (writeThumbnail && formatType !== 'thumbnail') {
      args.push('--write-thumbnail', '--convert-thumbnails', 'jpg');
    }
    if (writeDescription) {
      args.push('--write-description');
    }

    // Trim range handling
    if (trimStart || trimEnd) {
      const start = trimStart || '00:00:00';
      const end = trimEnd || '';
      args.push('--download-sections', `*${start}-${end}`);
    } else if (downloadSections && downloadSections.trim()) {
      args.push('--download-sections', downloadSections.trim());
    }

    // Subtitles
    if (writeSubs) {
      args.push('--write-subs');
      if (subLangs) {
        args.push('--sub-langs', subLangs);
      }
    }
    if (embedSubs) {
      args.push('--embed-subs');
    }

    if (rateLimit && rateLimit.trim()) {
      args.push('--rate-limit', rateLimit.trim());
    }

    if (cookiesFromBrowser && cookiesFromBrowser !== 'none') {
      args.push('--cookies-from-browser', cookiesFromBrowser);
    }

    if (embedMetadata && formatType !== 'gif' && formatType !== 'thumbnail') {
      args.push('--embed-metadata');
    }
    if (embedThumbnail && formatType !== 'gif' && formatType !== 'thumbnail') {
      args.push('--embed-thumbnail');
      args.push('--convert-thumbnails', 'jpg');
    }

    if (customArgs && customArgs.trim()) {
      const parsedExtraArgs = parseCliArgs(customArgs.trim());
      args.push(...parsedExtraArgs);
    }

    args.push(url);

    // Create Persistent Task Log Manifest JSON file on Disk
    const taskLogFilePath = saveTaskLogManifest(finalDestDir, options, 'in_progress');

    // Create standard text .log file
    const logsDir = getLogsDir();
    const logFileName = `download_${sanitizeFolderName(playlistTitle || options.mediaTitle)}_${id}.log`;
    const logFilePath = path.join(logsDir, logFileName);
    
    const writeLogLine = (text) => {
      try {
        fs.appendFileSync(logFilePath, `${new Date().toISOString()} ${text}\n`);
      } catch (e) {}
    };

    writeLogLine(`[START] Command: yt-dlp ${args.join(' ')}`);

    const ytDlpCmd = getYtDlpCommand();
    const env = getSpawnEnv();

    const downloadProcess = spawn(ytDlpCmd, args, { env });
    activeDownloads.set(id, downloadProcess);

    let logs = '';
    let currentItemIdx = 1;
    const downloadedItemIndexes = new Set();
    const totalItemsCount = playlistEntries ? playlistEntries.length : 1;

    downloadProcess.stdout.on('data', (data) => {
      const text = data.toString();
      logs += text;
      writeLogLine(text.trim());

      const lines = text.split(/[\r\n]+/);
      for (const line of lines) {
        if (!line.trim()) continue;

        const itemMatch = line.match(/\[download\]\s+Downloading\s+(?:item|video)?\s*(\d+)\s+of\s+(\d+)/i);
        if (itemMatch) {
          currentItemIdx = parseInt(itemMatch[1], 10);
          if (currentItemIdx > 1) {
            downloadedItemIndexes.add(currentItemIdx - 1);
          }
          mainWindow.webContents.send('download-item-change', {
            id,
            currentItem: currentItemIdx,
            totalItems: parseInt(itemMatch[2], 10)
          });
        }

        const destMatch = line.match(/\[download\] Destination: (.+)$/);
        if (destMatch) {
          const destName = path.basename(destMatch[1].trim());
          mainWindow.webContents.send('download-log', {
            id,
            logLine: line.trim(),
            currentTrackTitle: destName
          });
        }

        const progress = parseProgress(line);
        if (progress) {
          mainWindow.webContents.send('download-progress', { id, ...progress, logLine: line.trim(), logFilePath });
        } else {
          mainWindow.webContents.send('download-log', { id, logLine: line.trim(), logFilePath });
        }
      }
    });

    downloadProcess.stderr.on('data', (data) => {
      const text = data.toString();
      logs += text;
      writeLogLine(`[STDERR] ${text.trim()}`);
      mainWindow.webContents.send('download-log', { id, logLine: `[Error Log] ${text.trim()}`, logFilePath });
    });

    downloadProcess.on('close', (code) => {
      activeDownloads.delete(id);

      const downloadedArr = Array.from(downloadedItemIndexes);
      const missingArr = [];
      for (let i = 1; i <= totalItemsCount; i++) {
        if (!downloadedItemIndexes.has(i)) {
          missingArr.push(i);
        }
      }

      if (pausedDownloads.has(id)) {
        pausedDownloads.delete(id);
        writeLogLine('[STATUS] Download Paused by user');
        saveTaskLogManifest(finalDestDir, options, 'paused', {
          downloadedIndexes: downloadedArr,
          missingIndexes: missingArr
        });
        resolve({ success: false, paused: true, destDir: finalDestDir, logFilePath, taskLogFilePath, logs });
        return;
      }

      if (cancelledDownloads.has(id)) {
        cancelledDownloads.delete(id);
        writeLogLine('[STATUS] Download Cancelled by user');
        saveTaskLogManifest(finalDestDir, options, 'cancelled', {
          downloadedIndexes: downloadedArr,
          missingIndexes: missingArr
        });
        resolve({ success: false, cancelled: true, destDir: finalDestDir, logFilePath, taskLogFilePath, logs });
        return;
      }

      if (code === 0) {
        writeLogLine('[STATUS] Download Finished Successfully');
        const destinationPaths = [];
        const lines = logs.split(/[\r\n]+/);
        
        const patterns = [
          /(?:[Dd]estination:\s+)(.+)$/,
          /(?:[Mm]erging\s+formats\s+into\s+)(.+)$/,
          /(?:[Aa]dding\s+metadata\s+to\s+)(.+)$/,
          /(?:[Aa]dding\s+thumbnail\s+to\s+)(.+)$/,
          /(?:[Cc]orrecting\s+container\s+of\s+)(.+)$/,
          /(?:[Ff]ixup[Mm]4a\]\s+Correcting\s+container\s+of\s+)(.+)$/,
          /(?:[Vv]ideoConvertor\]\s+Converting\s+video\s+to\s+)(.+)$/
        ];

        for (const line of lines) {
          const cleanLine = stripAnsi(line);
          for (const pattern of patterns) {
            const match = cleanLine.match(pattern);
            if (match) {
              let filePath = match[1].trim();
              if (filePath.startsWith('"') && filePath.endsWith('"')) filePath = filePath.slice(1, -1);
              if (filePath.startsWith("'") && filePath.endsWith("'")) filePath = filePath.slice(1, -1);
              filePath = filePath.replace(/[\r\n]/g, '').trim();
              const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(finalDestDir, filePath);
              if (!destinationPaths.includes(absolutePath)) {
                destinationPaths.push(absolutePath);
              }
            }
          }
        }
        
        // Scan folder for files if missing or incomplete
        try {
          const filesInDir = fs.readdirSync(finalDestDir);
          const allMediaFiles = filesInDir
            .filter(f => !f.endsWith('.log') && !f.endsWith('.json'))
            .map(f => path.join(finalDestDir, f));
          if (allMediaFiles.length > 0) {
            destinationPaths.push(...allMediaFiles);
          }
        } catch (e) {}

        const uniqueFiles = Array.from(new Set(destinationPaths)).filter(fp => {
          try { return fs.existsSync(fp) && fs.statSync(fp).isFile(); } catch (e) { return false; }
        });

        const allIndexes = [];
        for (let i = 1; i <= totalItemsCount; i++) allIndexes.push(i);

        saveTaskLogManifest(finalDestDir, options, 'completed', {
          downloadedIndexes: allIndexes,
          missingIndexes: [],
          downloadedFiles: uniqueFiles
        });

        resolve({ success: true, destDir: finalDestDir, files: uniqueFiles, logFilePath, taskLogFilePath, logs });
      } else {
        writeLogLine(`[ERROR] Process exited with code ${code}`);
        saveTaskLogManifest(finalDestDir, options, 'error');
        reject(new Error(`Quá trình tải kết thúc với mã lỗi ${code}`));
      }
    });

    downloadProcess.on('error', (err) => {
      activeDownloads.delete(id);
      if (cancelledDownloads.has(id) || pausedDownloads.has(id)) {
        cancelledDownloads.delete(id);
        pausedDownloads.delete(id);
        resolve({ success: false, cancelled: true, logFilePath, taskLogFilePath });
      } else {
        reject(err);
      }
    });
  });
});

// Xử lý sự kiện kéo thả tệp tin từ ứng dụng ra hệ thống
ipcMain.on('ondragstart', (event, filePath) => {
  if (!filePath) return;
  try {
    const icon = fs.existsSync(dragIconPath) ? dragIconPath : nativeImage.createFromBuffer(validPngBuffer);
    if (Array.isArray(filePath)) {
      const validFiles = filePath
        .map(f => (typeof f === 'string' ? path.resolve(f) : null))
        .filter(f => f && fs.existsSync(f));

      if (validFiles.length > 0) {
        event.sender.startDrag({
          files: validFiles,
          icon: icon
        });
      } else {
        console.warn('No valid existing files for drag start array:', filePath);
      }
    } else if (typeof filePath === 'string') {
      const resolvedPath = path.resolve(filePath);
      if (fs.existsSync(resolvedPath)) {
        event.sender.startDrag({
          file: resolvedPath,
          icon: icon
        });
      } else {
        console.warn(`File/Folder does not exist for drag start: ${resolvedPath}`);
      }
    }
  } catch (err) {
    console.error('Error starting drag:', err);
  }
});

// IPC Handler to Select & Read Task Log JSON File for Resuming
ipcMain.handle('dialog:select-log-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Task Log Manifest & Log Files', extensions: ['json', 'log'] }
    ],
    title: 'Chọn File Log / Manifest để Khôi phục & Tải tiếp'
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle('yt-dlp:read-log-file', async (event, filePath) => {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error('Không tìm thấy file log.');
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  if (filePath.endsWith('.json')) {
    try {
      const data = JSON.parse(content);
      return { success: true, data };
    } catch (e) {
      throw new Error(`File JSON bị lỗi định dạng: ${e.message}`);
    }
  } else {
    const jsonMatch = content.match(/\{[\s\S]*"url"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[0]);
        return { success: true, data };
      } catch (e) {}
    }
    throw new Error('File .log không chứa thông tin cấu hình task khôi phục.');
  }
});

ipcMain.handle('yt-dlp:pause', async (event, id) => {
  pausedDownloads.add(id);
  const downloadProcess = activeDownloads.get(id);
  if (downloadProcess) {
    if (process.platform === 'win32') {
      const { exec } = require('child_process');
      exec(`taskkill /pid ${downloadProcess.pid} /T /F`, (err) => {
        if (err) {
          try { downloadProcess.kill('SIGKILL'); } catch (e) {}
        }
      });
    } else {
      try {
        downloadProcess.kill('SIGTERM');
      } catch (e) {
        try { downloadProcess.kill('SIGKILL'); } catch (e2) {}
      }
    }
    activeDownloads.delete(id);
    return true;
  }
  return false;
});

ipcMain.handle('yt-dlp:cancel', async (event, id) => {
  cancelledDownloads.add(id);
  const downloadProcess = activeDownloads.get(id);
  if (downloadProcess) {
    if (process.platform === 'win32') {
      const { exec } = require('child_process');
      exec(`taskkill /pid ${downloadProcess.pid} /T /F`, (err) => {
        if (err) {
          try { downloadProcess.kill('SIGKILL'); } catch (e) {}
        }
      });
    } else {
      try {
        downloadProcess.kill('SIGTERM');
      } catch (e) {
        try { downloadProcess.kill('SIGKILL'); } catch (e2) {}
      }
    }
    activeDownloads.delete(id);
    return true;
  }
  return false;
});

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

ipcMain.handle('shell:open-file', async (event, filePath) => {
  if (!filePath) return false;
  try {
    await shell.openPath(filePath);
    return true;
  } catch (e) {
    console.error('Failed to open file:', e);
    return false;
  }
});

ipcMain.handle('clipboard:copy-file', async (event, filePath) => {
  if (!filePath) return false;
  try {
    if (!fs.existsSync(filePath)) return false;
    const absolutePath = path.resolve(filePath);
    
    if (process.platform === 'win32') {
      const buffer = Buffer.concat([
        Buffer.from(absolutePath, 'ucs2'),
        Buffer.from([0, 0])
      ]);
      const { clipboard } = require('electron');
      clipboard.writeBuffer('FileNameW', buffer);
    } else {
      const { clipboard } = require('electron');
      clipboard.writeText(absolutePath);
    }
    return true;
  } catch (e) {
    console.error('Failed to copy file:', e);
    return false;
  }
});

ipcMain.handle('file:delete', async (event, filePath) => {
  if (!filePath) return false;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Failed to delete file:', e);
    return false;
  }
});
