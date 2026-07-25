const { app, BrowserWindow, ipcMain, dialog, shell, nativeImage, Tray, Notification } = require('electron');

// Vô hiệu hóa GPU acceleration & GPU sub-process để tránh lỗi crash GPU helper (exit_code=-1073741515 / 0xC0000135 DLL Not Found)
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-gpu-rasterization');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('in-process-gpu');

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
            } catch (e) { }
          }
        }
      } catch (e) { }
    }
  } catch (e) { }
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



let mainWindow;
let tray = null;
let miniWindow = null;
let cachedDraft = null;
let cachedHistory = null;
let isQuitting = false;
const activeDownloads = new Map();
const cancelledDownloads = new Set();
const pausedDownloads = new Set();

app.on('before-quit', () => {
  isQuitting = true;
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 880,
    height: 720,
    minWidth: 400,
    minHeight: 520,
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

  mainWindow.on('close', (e) => {
    if (isQuitting) return;

    const { dontAskClose, closeAction } = currentSettings || {};

    if (dontAskClose) {
      if (closeAction === 'minimize') {
        e.preventDefault();
        mainWindow.hide();
        if (!tray) createTray();
        return;
      } else if (closeAction === 'exit') {
        isQuitting = true;
        return;
      }
    }

    e.preventDefault();
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send('prompt-close-dialog');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createMiniWindow() {
  const { screen } = require('electron');
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  const winW = 360;
  const winH = 560;
  const margin = 12;
  miniWindow = new BrowserWindow({
    width: winW,
    height: winH,
    x: sw - winW - margin,
    y: sh - winH - margin,
    minWidth: 300,
    minHeight: 400,
    frame: false,
    transparent: false,
    backgroundColor: '#0b0f19',
    titleBarStyle: 'hidden',
    alwaysOnTop: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    show: false
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  const miniDistPath = path.join(__dirname, 'dist-react', 'mini.html');
  const miniPath = path.join(__dirname, 'mini.html');

  if (devUrl) {
    miniWindow.loadURL(`${devUrl}/mini.html`);
  } else if (fs.existsSync(miniDistPath)) {
    miniWindow.loadFile(miniDistPath);
  } else if (fs.existsSync(miniPath)) {
    miniWindow.loadFile(miniPath);
  } else {
    miniWindow.loadFile('index.html');
  }

  miniWindow.once('ready-to-show', () => miniWindow.show());
  miniWindow.on('closed', () => { miniWindow = null; });
}

function createTray() {
  const iconPath = 'C:\\Users\\1\\.gemini\\antigravity-ide\\brain\\a626b701-239b-4406-87e0-4379625520b9\\tray_icon_1784924763103.png';
  tray = new Tray(iconPath);
  tray.setToolTip('YT Downloader');
  tray.on('click', () => {
    if (!miniWindow) {
      createMiniWindow();
    } else {
      miniWindow.show();
    }
  });
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.restore();
    }
  });
}


app.whenReady().then(() => {
  loadDownloadsDb();
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.yt.downloader');
  }
  createWindow();
  createTray();
  startLocalHttpBridge();

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
  if (mainWindow) {
    mainWindow.hide();
    if (!tray) createTray();
  }
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

ipcMain.handle('app:quit-app', () => {
  isQuitting = true;
  app.quit();
});

ipcMain.handle('window:hide', () => {
  if (mainWindow) {
    mainWindow.hide();
    if (!tray) createTray();
  }
});

// Mini Window IPC Handlers
ipcMain.handle('mini:close', () => {
  if (miniWindow) miniWindow.close();
});

ipcMain.handle('mini:show-main', (_event, draft) => {
  if (draft) {
    cachedDraft = draft;
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('sync:draft', cachedDraft);
    }
  }
  if (miniWindow && !miniWindow.isDestroyed()) {
    miniWindow.hide();
  }
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

// Draft State Sync IPC Handlers
ipcMain.handle('sync:push-draft', (event, draft) => {
  cachedDraft = draft;
  const senderWebContents = event.sender;
  if (miniWindow && !miniWindow.isDestroyed() && senderWebContents !== miniWindow.webContents) {
    miniWindow.webContents.send('sync:draft', cachedDraft);
  }
  if (mainWindow && !mainWindow.isDestroyed() && senderWebContents !== mainWindow.webContents) {
    mainWindow.webContents.send('sync:draft', cachedDraft);
  }
  return true;
});

ipcMain.handle('sync:get-draft', () => {
  return cachedDraft;
});

ipcMain.handle('mini:get-active-downloads', () => {
  return Array.from(activeDownloads.keys());
});

// History sync: main renderer pushes history to main process so mini can read it
ipcMain.handle('sync:push-history', (_event, history) => {
  cachedHistory = history || [];
  if (miniWindow && miniWindow.webContents) miniWindow.webContents.send('sync:history', cachedHistory);
  if (mainWindow && mainWindow.webContents) mainWindow.webContents.send('sync:history', cachedHistory);
});

ipcMain.handle('sync:get-history', () => {
  return cachedHistory;
});

// Mini window requests history from main renderer (relayed via main process)
ipcMain.handle('mini:request-history', async () => {
  if (mainWindow) {
    // Ask main renderer to push its current history
    mainWindow.webContents.send('request:push-history');
    // Give it a moment then return cached
    await new Promise(r => setTimeout(r, 150));
  }
  return cachedHistory;
});

// Active download metadata store (rich info for mini window)
const activeDownloadsMeta = new Map(); // id -> { title, uploader, thumbnail, formatType, percent, speed, eta, totalItems, currentItem }

ipcMain.handle('mini:get-downloads-meta', () => {
  return Array.from(activeDownloadsMeta.entries()).map(([id, meta]) => ({ id, ...meta }));
});

// When mini triggers a download, relay to main renderer queue system
ipcMain.handle('mini:start-download', (event, options) => {
  // Relay to main window to handle via its queue system
  if (mainWindow) {
    mainWindow.webContents.send('mini:download-request', options);
  }
});

// Helper to download thumbnail locally for Toast Notification icon
async function downloadThumbnailTemp(url) {
  if (!url || typeof url !== 'string') return null;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (fs.existsSync(url)) return url;
    return null;
  }
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const tempPath = path.join(userDataPath, `thumb_notif_${Date.now()}.jpg`);
    fs.writeFileSync(tempPath, buffer);
    setTimeout(() => {
      try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (e) {}
    }, 15000);
    return tempPath;
  } catch (err) {
    console.error('Failed to fetch notification thumbnail:', err.message);
    return null;
  }
}

// Active App Settings state in main process
let currentSettings = {
  language: 'en',
  theme: 'system'
};

// Notification localization templates
const NOTIF_TRANSLATIONS = {
  en: {
    appName: 'Media Downloader',
    successTitle: 'Download Completed ✅',
    errorTitle: 'Download Failed ❌',
    mediaTitleDefault: 'Media File',
    uploaderDefault: 'Unknown Artist',
    statusSuccess: 'Completed (100%)',
    statusError: 'Failed',
    labelTitle: '🎬 Title',
    labelArtist: '👤 Artist',
    labelStatus: '📌 Status',
    errCodeStatus: (code) => `Error (Error code ${code})`,
    errMessageStatus: (msg) => `Error: ${msg}`
  },
  vi: {
    appName: 'Media Downloader',
    successTitle: 'Tải xuống hoàn tất ✅',
    errorTitle: 'Tải xuống thất bại ❌',
    mediaTitleDefault: 'Tệp Media',
    uploaderDefault: 'Không rõ nghệ sĩ',
    statusSuccess: 'Hoàn tất (100%)',
    statusError: 'Thất bại',
    labelTitle: '🎬 Tiêu đề',
    labelArtist: '👤 Nghệ sĩ',
    labelStatus: '📌 Trạng thái',
    errCodeStatus: (code) => `Lỗi (Mã lỗi ${code})`,
    errMessageStatus: (msg) => `Lỗi: ${msg}`
  },
  zh: {
    appName: 'Media Downloader',
    successTitle: '下载完成 ✅',
    errorTitle: '下载失败 ❌',
    mediaTitleDefault: '媒体文件',
    uploaderDefault: '未知艺术家',
    statusSuccess: '已完成 (100%)',
    statusError: '失败',
    labelTitle: '🎬 标题',
    labelArtist: '👤 艺术家',
    labelStatus: '📌 状态',
    errCodeStatus: (code) => `错误 (错误码 ${code})`,
    errMessageStatus: (msg) => `错误: ${msg}`
  },
  'zh-TW': {
    appName: 'Media Downloader',
    successTitle: '下載完成 ✅',
    errorTitle: '下載失敗 ❌',
    mediaTitleDefault: '媒體檔案',
    uploaderDefault: '未知藝術家',
    statusSuccess: '已完成 (100%)',
    statusError: '失敗',
    labelTitle: '🎬 標題',
    labelArtist: '👤 藝術家',
    labelStatus: '📌 狀態',
    errCodeStatus: (code) => `錯誤 (錯誤碼 ${code})`,
    errMessageStatus: (msg) => `錯誤: ${msg}`
  },
  ja: {
    appName: 'Media Downloader',
    successTitle: 'ダウンロード完了 ✅',
    errorTitle: 'ダウンロード失敗 ❌',
    mediaTitleDefault: 'メディアファイル',
    uploaderDefault: '不明なアーティスト',
    statusSuccess: '完了 (100%)',
    statusError: '失敗',
    labelTitle: '🎬 タイトル',
    labelArtist: '👤 アーティスト',
    labelStatus: '📌 ステータス',
    errCodeStatus: (code) => `エラー (エラーコード ${code})`,
    errMessageStatus: (msg) => `エラー: ${msg}`
  }
};

// Desktop Notification System with App Name, Title, Uploader, Status & Thumbnail
async function showDownloadNotification({
  title,
  status,
  mediaTitle,
  uploader,
  thumbnail,
  isError = false,
  tab = 'downloads',
  body: customBody
}) {
  try {
    if (Notification && Notification.isSupported()) {
      let iconFilePath = null;
      if (thumbnail) {
        iconFilePath = await downloadThumbnailTemp(thumbnail);
      }

      const defaultAppIcon = path.join(__dirname, 'icon', 'icon.png');
      if (!iconFilePath && fs.existsSync(defaultAppIcon)) {
        iconFilePath = defaultAppIcon;
      }

      const langKey = currentSettings.language || 'en';
      const dict = NOTIF_TRANSLATIONS[langKey] || NOTIF_TRANSLATIONS.en;

      const appName = dict.appName;
      const notifTitle = title
        ? `${appName} • ${title}`
        : `${appName} • ${isError ? dict.errorTitle : dict.successTitle}`;

      const nameStr = mediaTitle || dict.mediaTitleDefault;
      const uploaderStr = uploader || dict.uploaderDefault;
      const statusStr = status || (isError ? dict.statusError : dict.statusSuccess);

      const notifBody = customBody || `${dict.labelTitle}: ${nameStr}\n${dict.labelArtist}: ${uploaderStr}\n${dict.labelStatus}: ${statusStr}`;

      const notification = new Notification({
        title: notifTitle,
        body: notifBody,
        icon: iconFilePath || undefined
      });

      notification.on('click', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('navigate-to-tab', tab);
        }
      });

      notification.show();
    }
  } catch (err) {
    console.error('Failed to show notification:', err);
  }
}

ipcMain.handle('show-notification', async (_event, options) => {
  if (options && typeof options === 'object') {
    await showDownloadNotification(options);
  }
});

// IPC Handler to sync settings between processes
ipcMain.handle('sync:push-settings', (_event, settings) => {
  if (settings && typeof settings === 'object') {
    currentSettings = { ...currentSettings, ...settings };
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('sync:settings', currentSettings);
    }
    if (miniWindow && !miniWindow.isDestroyed()) {
      miniWindow.webContents.send('sync:settings', currentSettings);
    }
  }
  return true;
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

  // Lấy URL sạch (bỏ query params như ?si=... nhưng giữ nguyên secret token /s-...)
  // Secret set URL: soundcloud.com/user/sets/name/s-TOKEN
  // Cần trích xuất URL cơ bản không có các tracking params
  let cleanUrl = url.split('?')[0]; // bỏ query string (?si=..., utm_source=...)

  // Trích xuất secret_token nếu có trong path (dạng /s-XXXXX)
  const secretTokenMatch = cleanUrl.match(/\/s-([a-zA-Z0-9]+)$/);
  const secretToken = secretTokenMatch ? secretTokenMatch[1] : null;

  // Xây dựng resolve URL, truyền thêm secret_token nếu có
  let resolveUrl = `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(cleanUrl)}&client_id=${clientId}`;
  if (secretToken) {
    resolveUrl += `&secret_token=s-${secretToken}`;
  }

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

  // Hàm lấy thumbnail tốt nhất từ artwork_url (đổi -large thành -t500x500)
  function upgradeThumbnail(url) {
    if (!url) return '';
    return url.replace(/-large\.jpg$/, '-t500x500.jpg').replace(/-large\.png$/, '-t500x500.png');
  }

  // Lấy thumbnail playlist: ưu tiên artwork_url của playlist,
  // nếu không có thì lấy từ track đầu tiên có ảnh
  let playlistThumbnail = upgradeThumbnail(data.artwork_url);
  if (!playlistThumbnail && data.tracks && data.tracks.length > 0) {
    for (const track of data.tracks) {
      const t = upgradeThumbnail(track.artwork_url) || upgradeThumbnail(track.user?.avatar_url);
      if (t) { playlistThumbnail = t; break; }
    }
  }
  // Fallback: avatar của chủ playlist
  if (!playlistThumbnail && data.user) {
    playlistThumbnail = upgradeThumbnail(data.user.avatar_url);
  }

  return {
    success: true,
    isPlaylist: true,
    info: {
      title: data.title,
      uploader: data.user ? data.user.username : 'N/A',
      webpage_url: data.permalink_url || cleanUrl,
      entriesCount: data.tracks ? data.tracks.length : 0,
      thumbnail: playlistThumbnail,
      entries: data.tracks ? data.tracks.map(t => ({
        title: t.title || 'Bài hát không tên',
        uploader: t.user ? t.user.username : 'N/A',
        duration: t.duration ? Math.round(t.duration / 1000) : null,
        url: t.permalink_url,
        thumbnail: upgradeThumbnail(t.artwork_url) || upgradeThumbnail(t.user?.avatar_url) || ''
      })) : []
    }
  };
}

async function getVideoInfoInternal(url) {
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

    console.log('\n[DEBUG YT-DLP INFO EXEC]:', `${ytDlpCmd} --flat-playlist --dump-single-json "${url}"\n`);

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
            const isSearch = !!(info.extractor && info.extractor.includes('search')) || url.startsWith('ytsearch') || url.startsWith('scsearch');
            resolve({
              success: true,
              isPlaylist: true,
              isSearch: isSearch,
              searchQuery: isSearch ? url.replace(/^(ytsearch|scsearch)\d*:/, '') : null,
              searchPlatform: url.startsWith('scsearch') ? 'soundcloud' : (url.startsWith('ytsearch') ? 'youtube' : null),
              info: {
                title: info.title,
                uploader: info.uploader || info.channel || 'N/A',
                webpage_url: info.webpage_url || url,
                entriesCount: info.entries ? info.entries.length : 0,
                thumbnail: info.thumbnail || (info.entries && info.entries[0] ? (info.entries[0].thumbnail || (info.entries[0].thumbnails && info.entries[0].thumbnails.length > 0 ? info.entries[0].thumbnails[info.entries[0].thumbnails.length - 1].url : '')) : ''),
                entries: info.entries ? info.entries.map(e => {
                  let title = e.title;
                  if (!title && (e.webpage_url || e.url)) {
                    const targetUrl = e.webpage_url || e.url;
                    const urlParts = targetUrl.split('/');
                    const trackSlug = urlParts[urlParts.length - 1];
                    const username = urlParts[urlParts.length - 2];
                    if (trackSlug && username) {
                      const cleanSlug = decodeURIComponent(trackSlug).replace(/[-_]/g, ' ');
                      const cleanUser = decodeURIComponent(username).replace(/[-_]/g, ' ');
                      title = `${cleanUser} - ${cleanSlug}`;
                    } else if (trackSlug) {
                      title = decodeURIComponent(trackSlug).replace(/[-_]/g, ' ');
                    } else {
                      title = targetUrl;
                    }
                  }
                  const thumbUrl = e.thumbnail || (e.thumbnails && e.thumbnails.length > 0 ? (e.thumbnails[e.thumbnails.length - 1].url || e.thumbnails[0].url) : '');
                  return {
                    title: title || 'Bài hát không tên',
                    uploader: e.uploader || e.channel || 'N/A',
                    duration: e.duration,
                    url: e.webpage_url || e.url,
                    thumbnail: thumbUrl
                  };
                }) : []
              }
            });
          } else {
            const subtitlesList = [];
            if (info.subtitles && typeof info.subtitles === 'object') {
              Object.keys(info.subtitles).forEach((langCode) => {
                const langArr = info.subtitles[langCode];
                const name = (langArr && langArr[0] && langArr[0].name) ? langArr[0].name : langCode;
                subtitlesList.push({ code: langCode, name: name, isAuto: false });
              });
            }
            const autoCaptionsList = [];
            if (info.automatic_captions && typeof info.automatic_captions === 'object') {
              Object.keys(info.automatic_captions).forEach((langCode) => {
                const langArr = info.automatic_captions[langCode];
                const name = (langArr && langArr[0] && langArr[0].name) ? langArr[0].name : langCode;
                autoCaptionsList.push({ code: langCode, name: name, isAuto: true });
              });
            }

            resolve({
              success: true,
              isPlaylist: false,
              info: {
                title: info.title,
                thumbnail: info.thumbnail,
                duration: info.duration,
                uploader: info.uploader || info.channel,
                webpage_url: info.webpage_url || url,
                subtitles: subtitlesList,
                automatic_captions: autoCaptionsList,
                formats: info.formats ? info.formats.map(f => ({
                  format_id: f.format_id,
                  ext: f.ext,
                  resolution: f.resolution,
                  filesize: f.filesize || f.filesize_approx,
                  fps: f.fps,
                  vcodec: f.vcodec,
                  acodec: f.acodec,
                  height: f.height,
                  width: f.width,
                  abr: f.abr,
                  tbr: f.tbr,
                  format_note: f.format_note
                })) : [],
                height: info.height,
                width: info.width
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
}

ipcMain.handle('yt-dlp:get-info', async (event, url) => {
  return getVideoInfoInternal(url);
});

// Local HTTP Bridge Server cho Chrome Extension (Port 38472)
function startLocalHttpBridge() {
  const http = require('http');
  const PORT = 38472;

  const server = http.createServer((req, res) => {
    // Cross-Origin Resource Sharing (CORS) cho Chrome Extensions
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const host = req.headers.host || `127.0.0.1:${PORT}`;
    const urlObj = new URL(req.url, `http://${host}`);

    if (req.method === 'GET' && urlObj.pathname === '/api/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'online',
        app: 'YT-DLP Premium Downloader',
        version: app.getVersion ? app.getVersion() : '1.0.0',
        settings: currentSettings
      }));
      return;
    }

    if (req.method === 'POST' && urlObj.pathname === '/api/open-app') {
      if (!mainWindow || mainWindow.isDestroyed()) {
        createWindow();
      } else {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Desktop app opened' }));
      return;
    }

    if (req.method === 'POST' && urlObj.pathname === '/api/extract') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body || '{}');
          if (!payload.url) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing url parameter' }));
            return;
          }
          const result = await getVideoInfoInternal(payload.url);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message || 'Failed to extract video info' }));
        }
      });
      return;
    }

    if (req.method === 'POST' && urlObj.pathname === '/api/download') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const downloadOptions = JSON.parse(body || '{}');
          if (!downloadOptions || !downloadOptions.url) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Download options missing URL' }));
            return;
          }

          const defaultDest = (currentSettings && currentSettings.defaultPath) ? currentSettings.defaultPath : (app.getPath('downloads') || path.join(process.env.USERPROFILE || 'C:\\Users\\1', 'Downloads'));
          const normalizedOptions = {
            id: downloadOptions.id || `dl_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            url: downloadOptions.url,
            formatType: downloadOptions.formatType || downloadOptions.downloadType || 'video',
            quality: downloadOptions.quality || 'best',
            audioFormat: downloadOptions.audioFormat || 'mp3',
            destDir: downloadOptions.destDir || defaultDest,
            mediaTitle: downloadOptions.mediaTitle || downloadOptions.title || 'Video từ Chrome Extension',
            uploader: downloadOptions.uploader || 'N/A',
            thumbnail: downloadOptions.thumbnail || '',
            embedMetadata: downloadOptions.embedMetadata !== undefined ? downloadOptions.embedMetadata : (currentSettings ? currentSettings.embedMetadata : true),
            embedThumbnail: downloadOptions.embedThumbnail !== undefined ? downloadOptions.embedThumbnail : (currentSettings ? currentSettings.embedThumbnail : true)
          };

          // Gửi request về MainWindow để thêm vào hàng đợi tải
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('mini:download-request', normalizedOptions);
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Download queued successfully' }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message || 'Failed to initiate download' }));
        }
      });
      return;
    }

    if (req.method === 'GET' && urlObj.pathname === '/api/progress') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      const activeList = Array.from(activeDownloadsMeta.entries()).map(([id, meta]) => ({ id, ...meta }));
      if (cachedHistory === null) {
        cachedHistory = loadDownloadsDb();
      }
      res.end(JSON.stringify({
        activeDownloads: activeList,
        history: cachedHistory || []
      }));
      return;
    }

    if (req.method === 'POST' && urlObj.pathname === '/api/control') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const { id, action } = JSON.parse(body || '{}');
          if (!id || !action) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing id or action' }));
            return;
          }

          if (action === 'cancel') {
            cancelledDownloads.add(id);
            const proc = activeDownloads.get(id);
            if (proc) {
              if (process.platform === 'win32') {
                const { exec } = require('child_process');
                exec(`taskkill /pid ${proc.pid} /T /F`);
              } else {
                try { proc.kill('SIGTERM'); } catch (e) { }
              }
              activeDownloads.delete(id);
            }
            activeDownloadsMeta.delete(id);
          } else if (action === 'pause') {
            pausedDownloads.add(id);
            const proc = activeDownloads.get(id);
            if (proc) {
              if (process.platform === 'win32') {
                const { exec } = require('child_process');
                exec(`taskkill /pid ${proc.pid} /T /F`);
              } else {
                try { proc.kill('SIGTERM'); } catch (e) { }
              }
              activeDownloads.delete(id);
            }
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    if (req.method === 'POST' && urlObj.pathname === '/api/file-action') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const { action, filePath, id, history: newHistory } = JSON.parse(body || '{}');

          if (action === 'openFolder' && filePath) {
            const dir = fs.existsSync(filePath) && fs.statSync(filePath).isDirectory() ? filePath : path.dirname(filePath);
            await shell.openPath(dir);
          } else if (action === 'openFile' && filePath) {
            await shell.openPath(filePath);
          } else if ((action === 'copyPath' || action === 'copyFile') && filePath) {
            const { clipboard } = require('electron');
            const absolutePath = path.resolve(filePath);
            clipboard.writeText(absolutePath);
            if (process.platform === 'win32' && fs.existsSync(absolutePath)) {
              try {
                const buffer = Buffer.concat([
                  Buffer.from(absolutePath, 'ucs2'),
                  Buffer.from([0, 0])
                ]);
                clipboard.writeBuffer('FileNameW', buffer);
              } catch (e) { }
            }
          } else if (action === 'delete' && filePath) {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          } else if (action === 'deleteHistory' && id) {
            if (cachedHistory === null) cachedHistory = loadDownloadsDb();
            cachedHistory = cachedHistory.filter(item => item.id !== id);
            saveDownloadsDb(cachedHistory);
            if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) mainWindow.webContents.send('sync:history', cachedHistory);
            if (miniWindow && !miniWindow.isDestroyed() && miniWindow.webContents) miniWindow.webContents.send('sync:history', cachedHistory);
          } else if (action === 'clearHistory') {
            cachedHistory = [];
            saveDownloadsDb(cachedHistory);
            if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) mainWindow.webContents.send('sync:history', cachedHistory);
            if (miniWindow && !miniWindow.isDestroyed() && miniWindow.webContents) miniWindow.webContents.send('sync:history', cachedHistory);
          } else if (action === 'pushHistory' && Array.isArray(newHistory)) {
            cachedHistory = newHistory;
            saveDownloadsDb(cachedHistory);
            if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) mainWindow.webContents.send('sync:history', cachedHistory);
            if (miniWindow && !miniWindow.isDestroyed() && miniWindow.webContents) miniWindow.webContents.send('sync:history', cachedHistory);
          } else if (action === 'startDrag' && filePath) {
            if (mainWindow && !mainWindow.isDestroyed()) {
              const icon = fs.existsSync(dragIconPath) ? dragIconPath : nativeImage.createFromBuffer(validPngBuffer);
              mainWindow.webContents.startDrag({
                file: path.resolve(filePath),
                icon: icon
              });
            }
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  });

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`[Extension Bridge] Server running at http://127.0.0.1:${PORT}`);
  });

  server.on('error', (err) => {
    console.error('[Extension Bridge] Server error:', err.message);
  });
}

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
  } catch (e) { }
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

    const effectiveDestDir = destDir || (currentSettings && currentSettings.defaultPath) || app.getPath('downloads') || path.join(process.env.USERPROFILE || 'C:\\Users\\1', 'Downloads');
    const baseDest = path.join(effectiveDestDir, 'Media Download');
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
      let formatSelector = 'bv*+ba/b/best';
      if (quality && quality !== 'best') {
        const height = quality.replace('p', '');
        formatSelector = `bv*[height=${height}]+ba/bv*[height<=${height}]+ba/b[height<=${height}]/best`;
      }
      if (videoFps && videoFps !== 'auto') {
        formatSelector = `bv*[fps<=${videoFps}]+ba/best`;
      }
      args.push('-f', formatSelector);

      const targetContainer = videoContainer || 'mp4';
      args.push('--merge-output-format', targetContainer);
    } else if (formatType === 'audio') {
      args.push('-x');
      const ffmpegArgs = [];

      if (quality === 'mp3-320') {
        args.push('--audio-format', 'mp3', '--audio-quality', '320k');
        ffmpegArgs.push('-b:a', '320k');
      } else if (quality === 'mp3-256') {
        args.push('--audio-format', 'mp3', '--audio-quality', '256k');
        ffmpegArgs.push('-b:a', '256k');
      } else if (quality === 'mp3-192') {
        args.push('--audio-format', 'mp3', '--audio-quality', '192k');
        ffmpegArgs.push('-b:a', '192k');
      } else if (quality === 'mp3-128') {
        args.push('--audio-format', 'mp3', '--audio-quality', '128k');
        ffmpegArgs.push('-b:a', '128k');
      } else if (quality === 'wav') {
        args.push('--audio-format', 'wav');
      } else if (quality === 'm4a') {
        args.push('--audio-format', 'm4a');
      } else if (quality === 'flac') {
        args.push('--audio-format', 'flac');
      } else if (quality === 'opus') {
        args.push('--audio-format', 'opus');
      } else {
        args.push('--audio-format', 'mp3', '--audio-quality', '320k');
        ffmpegArgs.push('-b:a', '320k');
      }

      if (audioSampleRate && audioSampleRate !== 'auto') {
        ffmpegArgs.push('-ar', audioSampleRate);
      }

      if (ffmpegArgs.length > 0) {
        args.push('--postprocessor-args', `ExtractAudio+ffmpeg:${ffmpegArgs.join(' ')}`);
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
      args.push('--write-subs', '--write-auto-subs');
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

    args.push('--print', 'after_move:[OUTFILE]%(filepath)s');
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
      } catch (e) { }
    };

    writeLogLine(`[START] Command: yt-dlp ${args.join(' ')}`);

    const ytDlpCmd = getYtDlpCommand();
    const env = getSpawnEnv();

    const fullCmdStr = `${ytDlpCmd} ${args.map(a => (a.includes(' ') ? `"${a}"` : a)).join(' ')}`;
    console.log('\n================================================================');
    console.log('[DEBUG YT-DLP & FFMPEG DOWNLOAD COMMAND]:');
    console.log(fullCmdStr);
    console.log('================================================================\n');

    writeLogLine(`[START] Command: ${fullCmdStr}`);

    const taskStartTime = Date.now();
    const downloadProcess = spawn(ytDlpCmd, args, { env });
    activeDownloads.set(id, downloadProcess);

    // Send initial command line to UI
    const cmdLogLine = `[COMMAND]: ${fullCmdStr}`;
    mainWindow.webContents.send('download-log', { id, logLine: cmdLogLine, logFilePath });
    if (miniWindow) miniWindow.webContents.send('download-log', { id, logLine: cmdLogLine, logFilePath });

    // Track rich meta for mini window
    activeDownloadsMeta.set(id, {
      title: options.mediaTitle || options.playlistTitle || 'Downloading…',
      uploader: options.uploader || '',
      thumbnail: options.thumbnail || '',
      formatType: options.formatType || 'video',
      isPlaylist: !!(options.isPlaylist || options.isPlaylistItem),
      playlistTitle: options.playlistTitle || null,
      percent: 0,
      speed: '—',
      eta: '—',
      currentItem: 1,
      totalItems: playlistEntries ? playlistEntries.length : 1
    });
    if (miniWindow) miniWindow.webContents.send('mini:active-update', { id, ...activeDownloadsMeta.get(id) });

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

        console.log('[yt-dlp stdout]:', line.trim());

        const itemMatch = line.match(/\[download\]\s+Downloading\s+(?:item|video)?\s*(\d+)\s+of\s+(\d+)/i);
        if (itemMatch) {
          currentItemIdx = parseInt(itemMatch[1], 10);
          if (currentItemIdx > 1) {
            downloadedItemIndexes.add(currentItemIdx - 1);
          }
          const itemPayload = { id, currentItem: currentItemIdx, totalItems: parseInt(itemMatch[2], 10) };
          mainWindow.webContents.send('download-item-change', itemPayload);
          if (miniWindow) miniWindow.webContents.send('download-item-change', itemPayload);
          // Update meta
          if (activeDownloadsMeta.has(id)) {
            const m = activeDownloadsMeta.get(id);
            m.currentItem = itemPayload.currentItem;
            m.totalItems  = itemPayload.totalItems;
            if (miniWindow) miniWindow.webContents.send('mini:active-update', { id, ...m });
          }
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
          if (miniWindow) miniWindow.webContents.send('download-progress', { id, ...progress, logLine: line.trim(), logFilePath });
          // Update meta
          if (activeDownloadsMeta.has(id)) {
            const m = activeDownloadsMeta.get(id);
            m.percent = progress.percent;
            m.speed   = progress.speed;
            m.eta     = progress.eta;
            if (miniWindow) miniWindow.webContents.send('mini:active-update', { id, ...m });
          }
        } else {
          mainWindow.webContents.send('download-log', { id, logLine: line.trim(), logFilePath });
          if (miniWindow) miniWindow.webContents.send('download-log', { id, logLine: line.trim(), logFilePath });
        }
      }
    });

    downloadProcess.stderr.on('data', (data) => {
      const text = data.toString();
      logs += text;
      console.log('[yt-dlp stderr]:', text.trim());
      writeLogLine(`[STDERR] ${text.trim()}`);

      let formattedLog = `[Error Log] ${text.trim()}`;
      if (text.includes('Could not copy') && text.includes('cookie database')) {
        formattedLog = `[⚠️ HƯỚNG DẪN XỬ LÝ LỖI COOKIE]: Chrome/Edge đang mở làm KHOÁ cơ sở dữ liệu Cookie! Hãy ĐÓNG trình duyệt hoặc chọn "Không dùng Cookie" trong Tùy chọn Nâng cao rồi thử lại.`;
      }

      mainWindow.webContents.send('download-log', { id, logLine: formattedLog, logFilePath });
      if (miniWindow) miniWindow.webContents.send('download-log', { id, logLine: formattedLog, logFilePath });
    });

    downloadProcess.on('close', (code) => {
      activeDownloads.delete(id);
      activeDownloadsMeta.delete(id);
      if (miniWindow) miniWindow.webContents.send('mini:active-removed', { id });

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

        // 1. First priority: parse explicit [OUTFILE] tags from --print
        for (const line of lines) {
          const cleanLine = stripAnsi(line);
          const outfileMatch = cleanLine.match(/\[OUTFILE\]\s*(.+)$/);
          if (outfileMatch) {
            let filePath = outfileMatch[1].trim();
            if (filePath.startsWith('"') && filePath.endsWith('"')) filePath = filePath.slice(1, -1);
            if (filePath.startsWith("'") && filePath.endsWith("'")) filePath = filePath.slice(1, -1);
            filePath = filePath.replace(/[\r\n]/g, '').trim();
            const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(finalDestDir, filePath);
            if (fs.existsSync(absolutePath) && !destinationPaths.includes(absolutePath)) {
              destinationPaths.push(absolutePath);
            }
          }
        }

        // 2. Secondary fallback: parse standard yt-dlp log patterns if no [OUTFILE] found
        if (destinationPaths.length === 0) {
          const patterns = [
            /(?:\[download\]\s+)(.+?)\s+has already been downloaded/,
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
                if (fs.existsSync(absolutePath) && !destinationPaths.includes(absolutePath)) {
                  destinationPaths.push(absolutePath);
                }
              }
            }
          }
        }

        // 3. Final fallback: scan folder ONLY for files created or modified during this task execution
        if (destinationPaths.length === 0) {
          try {
            const filesInDir = fs.readdirSync(finalDestDir);
            for (const f of filesInDir) {
              if (f.endsWith('.log') || f.endsWith('.json')) continue;
              const fullPath = path.join(finalDestDir, f);
              try {
                const stat = fs.statSync(fullPath);
                if (stat.isFile() && stat.mtimeMs >= taskStartTime - 5000) {
                  destinationPaths.push(fullPath);
                }
              } catch (e) { }
            }
          } catch (e) { }
        }

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

        const dict = NOTIF_TRANSLATIONS[currentSettings.language || 'en'] || NOTIF_TRANSLATIONS.en;
        showDownloadNotification({
          title: dict.successTitle,
          status: dict.statusSuccess,
          mediaTitle: options.mediaTitle || options.playlistTitle || dict.mediaTitleDefault,
          uploader: options.uploader,
          thumbnail: options.thumbnail,
          isError: false,
          tab: 'downloads'
        });

        const downloadedFile = uniqueFiles && uniqueFiles.length > 0 ? uniqueFiles[0] : finalDestDir;
        const historyItem = {
          id: options.id || id,
          title: options.isPlaylist ? (options.playlistTitle || options.mediaTitle) : (options.mediaTitle || 'Media File'),
          uploader: options.uploader || 'N/A',
          thumbnail: options.thumbnail || '',
          duration: options.duration || null,
          formatType: options.formatType || 'video',
          sourceUrl: options.url || '',
          filePath: downloadedFile,
          folderPath: finalDestDir,
          isPlaylist: !!options.isPlaylist,
          playlistEntries: options.playlistEntries || null,
          downloadedFiles: uniqueFiles || [],
          entriesCount: options.isPlaylist ? (uniqueFiles.length || options.playlistEntries?.length || 1) : 1,
          downloadedAt: Date.now()
        };

        addDownloadItemToDbInternal(historyItem);

        resolve({ success: true, destDir: finalDestDir, files: uniqueFiles, logFilePath, taskLogFilePath, logs });
      } else {
        writeLogLine(`[ERROR] Process exited with code ${code}`);
        saveTaskLogManifest(finalDestDir, options, 'error');

        const isCookieLock = logs.includes('Could not copy') && logs.includes('cookie database');
        const dict = NOTIF_TRANSLATIONS[currentSettings.language || 'en'] || NOTIF_TRANSLATIONS.en;
        const failureStatus = isCookieLock
          ? '⚠️ Lỗi Cookie DB Lock: Hãy đóng trình duyệt Chrome/Edge rồi thử lại'
          : dict.errCodeStatus(code);

        showDownloadNotification({
          title: dict.errorTitle,
          status: failureStatus,
          mediaTitle: options.mediaTitle || options.playlistTitle || dict.mediaTitleDefault,
          uploader: options.uploader,
          thumbnail: options.thumbnail,
          isError: true,
          tab: 'downloads'
        });

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
        const dict = NOTIF_TRANSLATIONS[currentSettings.language || 'en'] || NOTIF_TRANSLATIONS.en;
        showDownloadNotification({
          title: dict.errorTitle,
          status: dict.errMessageStatus(err.message || dict.statusError),
          mediaTitle: options.mediaTitle || options.playlistTitle || dict.mediaTitleDefault,
          uploader: options.uploader,
          thumbnail: options.thumbnail,
          isError: true,
          tab: 'downloads'
        });
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
      } catch (e) { }
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
          try { downloadProcess.kill('SIGKILL'); } catch (e) { }
        }
      });
    } else {
      try {
        downloadProcess.kill('SIGTERM');
      } catch (e) {
        try { downloadProcess.kill('SIGKILL'); } catch (e2) { }
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
          try { downloadProcess.kill('SIGKILL'); } catch (e) { }
        }
      });
    } else {
      try {
        downloadProcess.kill('SIGTERM');
      } catch (e) {
        try { downloadProcess.kill('SIGKILL'); } catch (e2) { }
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
    let target = dirPath;
    if (fs.existsSync(target) && fs.statSync(target).isFile()) {
      target = path.dirname(target);
    }
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }
    await shell.openPath(target);
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

// ==========================================
// USER DOCUMENTS JSON DATABASE MANAGEMENT
// ==========================================
function getDbDir() {
  try {
    const docsPath = app.getPath('documents');
    const dbDir = path.join(docsPath, 'YTDownloader');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    return dbDir;
  } catch (err) {
    console.error('Failed to get or create Documents/YTDownloader directory:', err);
    return path.join(userDataPath, 'database');
  }
}

const OPTIONS_DB_PATH = () => path.join(getDbDir(), 'select_options.json');
const PRESETS_DB_PATH = () => path.join(getDbDir(), 'presets.json');
const DOWNLOADS_DB_PATH = () => path.join(getDbDir(), 'downloads_db.json');

const DEFAULT_SELECT_OPTIONS = {
  formatType: [
    { value: 'best', label: 'Best Quality (Video + Audio)' },
    { value: 'audio', label: 'Audio Only' },
    { value: 'video_only', label: 'Video Only' },
    { value: 'custom', label: 'Custom yt-dlp Format' }
  ],
  videoContainer: [
    { value: 'mp4', label: 'MP4 (.mp4)' },
    { value: 'mkv', label: 'MKV (.mkv)' },
    { value: 'webm', label: 'WebM (.webm)' },
    { value: 'avi', label: 'AVI (.avi)' },
    { value: 'mov', label: 'MOV (.mov)' }
  ],
  qualityPresets: [
    { value: 'best', label: 'Chất lượng cao nhất (Best)' },
    { value: '2160p', label: '4K (2160p)' },
    { value: '1440p', label: '2K (1440p)' },
    { value: '1080p', label: 'Full HD (1080p)' },
    { value: '720p', label: 'HD (720p)' },
    { value: '480p', label: 'SD (480p)' },
    { value: '360p', label: 'Low (360p)' }
  ],
  audioFormat: [
    { value: 'mp3', label: 'MP3 (.mp3)' },
    { value: 'm4a', label: 'M4A (.m4a)' },
    { value: 'wav', label: 'WAV (.wav)' },
    { value: 'flac', label: 'FLAC (.flac)' },
    { value: 'aac', label: 'AAC (.aac)' },
    { value: 'opus', label: 'Opus (.opus)' }
  ],
  audioSampleRate: [
    { value: 'original', label: 'Gốc (Original)' },
    { value: '44100', label: '44.1 kHz (CD Quality)' },
    { value: '48000', label: '48.0 kHz (Studio Quality)' },
    { value: '96000', label: '96.0 kHz (Hi-Res Audio)' }
  ],
  subLangs: [
    { value: 'vi', label: 'Tiếng Việt (vi)' },
    { value: 'en', label: 'English (en)' },
    { value: 'ja', label: 'Japanese (ja)' },
    { value: 'zh', label: 'Chinese (zh)' },
    { value: 'vi,en', label: 'Tiếng Việt & English (vi,en)' },
    { value: 'all', label: 'Tất cả ngôn ngữ (all)' }
  ],
  cookiesFromBrowser: [
    { value: 'none', label: 'Không dùng Cookie (Mặc định)' },
    { value: 'chrome', label: 'Google Chrome' },
    { value: 'firefox', label: 'Mozilla Firefox' },
    { value: 'edge', label: 'Microsoft Edge' },
    { value: 'opera', label: 'Opera' },
    { value: 'brave', label: 'Brave Browser' },
    { value: 'vivaldi', label: 'Vivaldi' }
  ],
  rateLimit: [
    { value: '', label: 'Không giới hạn tốc độ' },
    { value: '500K', label: '500 KB/s' },
    { value: '1M', label: '1 MB/s' },
    { value: '2M', label: '2 MB/s' },
    { value: '5M', label: '5 MB/s' },
    { value: '10M', label: '10 MB/s' }
  ],
  gifFps: [
    { value: '10', label: '10 FPS' },
    { value: '15', label: '15 FPS (Tiêu chuẩn)' },
    { value: '24', label: '24 FPS (Mượt mà)' },
    { value: '30', label: '30 FPS (Cao)' }
  ],
  gifRes: [
    { value: '480p', label: '480p' },
    { value: '720p', label: '720p HD' },
    { value: '1080p', label: '1080p Full HD' },
    { value: 'original', label: 'Kích thước gốc' }
  ],
  gifSpeed: [
    { value: '0.5', label: '0.5x (Chậm)' },
    { value: '1.0', label: '1.0x (Bình thường)' },
    { value: '1.5', label: '1.5x (Nhanh)' },
    { value: '2.0', label: '2.0x (Tốc độ kép)' }
  ]
};

const DEFAULT_PRESETS = [
  {
    id: 'preset-speed',
    name: 'Tăng Tốc Độ Tải',
    desc: 'Bật tốc độ tải cao 10M và bỏ qua ghi thời gian mtime',
    options: { rateLimit: '10M', customArgs: '--no-mtime' }
  },
  {
    id: 'preset-subs',
    name: 'Tải Phụ Đề Đa Ngôn Ngữ',
    desc: 'Tự động tải file phụ đề Tiếng Việt + Tiếng Anh và nhúng vào video',
    options: { writeSubs: true, embedSubs: true, subLangs: 'vi,en' }
  },
  {
    id: 'preset-bypass',
    name: 'Bỏ Qua Chặn Vùng Miền',
    desc: 'Tự động sử dụng tham số --geo-bypass',
    options: { customArgs: '--geo-bypass' }
  },
  {
    id: 'preset-cut-1m',
    name: 'Cắt 1 Phút Đầu Video',
    desc: 'Chỉ tải từ phút 00:00 đến 01:00',
    options: { downloadSections: '*00:00:00-00:01:00' }
  }
];

function loadSelectOptionsDb() {
  const filePath = OPTIONS_DB_PATH();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading select_options.json:', err);
  }
  try {
    fs.writeFileSync(filePath, JSON.stringify(DEFAULT_SELECT_OPTIONS, null, 2), 'utf-8');
  } catch (err) {}
  return DEFAULT_SELECT_OPTIONS;
}

function saveSelectOptionsDb(optionsData) {
  const filePath = OPTIONS_DB_PATH();
  try {
    fs.writeFileSync(filePath, JSON.stringify(optionsData, null, 2), 'utf-8');
    notifyDbSync('options', optionsData);
    return true;
  } catch (err) {
    console.error('Error saving select_options.json:', err);
    return false;
  }
}

function loadPresetsDb() {
  const filePath = PRESETS_DB_PATH();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading presets.json:', err);
  }
  try {
    fs.writeFileSync(filePath, JSON.stringify(DEFAULT_PRESETS, null, 2), 'utf-8');
  } catch (err) {}
  return DEFAULT_PRESETS;
}

function savePresetsDb(presetsData) {
  const filePath = PRESETS_DB_PATH();
  try {
    fs.writeFileSync(filePath, JSON.stringify(presetsData, null, 2), 'utf-8');
    notifyDbSync('presets', presetsData);
    return true;
  } catch (err) {
    console.error('Error saving presets.json:', err);
    return false;
  }
}

function loadDownloadsDb() {
  const filePath = DOWNLOADS_DB_PATH();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      if (Array.isArray(data)) {
        cachedHistory = data;
        return data;
      }
    }
  } catch (err) {
    console.error('Error reading downloads_db.json:', err);
  }
  try {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf-8');
  } catch (err) {}
  cachedHistory = [];
  return [];
}

function saveDownloadsDb(downloadsData) {
  if (!Array.isArray(downloadsData)) return false;
  cachedHistory = downloadsData;
  const filePath = DOWNLOADS_DB_PATH();
  try {
    fs.writeFileSync(filePath, JSON.stringify(downloadsData, null, 2), 'utf-8');
    notifyDbSync('downloads', downloadsData);
    return true;
  } catch (err) {
    console.error('Error saving downloads_db.json:', err);
    return false;
  }
}

function notifyDbSync(type, data) {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    mainWindow.webContents.send(`db:sync-${type}`, data);
    if (type === 'downloads') {
      mainWindow.webContents.send('sync:history', data);
    }
  }
  if (miniWindow && !miniWindow.isDestroyed() && miniWindow.webContents) {
    miniWindow.webContents.send(`db:sync-${type}`, data);
    if (type === 'downloads') {
      miniWindow.webContents.send('sync:history', data);
    }
  }
}

function enrichDownloadDetails(destDir, isPlaylist = false, downloadedFiles = []) {
  let subPaths = [];
  let thumbnailPath = null;
  let hasSub = false;
  let hasThumbnail = false;
  let playlistDir = isPlaylist ? destDir : null;

  try {
    const validFiles = Array.isArray(downloadedFiles) ? downloadedFiles.filter(f => typeof f === 'string' && f.trim()) : [];
    
    // Extract base stems of all downloaded video/audio files
    const stems = validFiles.map(filePath => {
      const baseName = path.basename(filePath);
      const ext = path.extname(baseName);
      return baseName.slice(0, baseName.length - ext.length);
    }).filter(stem => stem.length > 0);

    const checkDir = (validFiles.length > 0 && fs.existsSync(path.dirname(validFiles[0])))
      ? path.dirname(validFiles[0])
      : destDir;

    if (fs.existsSync(checkDir)) {
      const entries = fs.readdirSync(checkDir);
      for (const entry of entries) {
        const fullPath = path.join(checkDir, entry);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isFile()) {
            const ext = path.extname(entry).toLowerCase();
            
            // Subtitles/Thumbnails must belong to the downloaded video stem
            const belongsToTask = stems.length === 0 || stems.some(stem => entry.startsWith(stem));

            if (belongsToTask) {
              if (['.srt', '.vtt', '.ass', '.lrc'].includes(ext)) {
                hasSub = true;
                if (!subPaths.includes(fullPath)) subPaths.push(fullPath);
              } else if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
                if (!hasThumbnail) {
                  hasThumbnail = true;
                  thumbnailPath = fullPath;
                }
              }
            }
          }
        } catch (e) {}
      }
    }
  } catch (err) {
    console.error('Error enriching download details:', err);
  }

  return {
    hasSub,
    subPaths,
    hasThumbnail,
    thumbnailPath,
    playlistDir
  };
}

function addDownloadItemToDbInternal(rawItem) {
  try {
    const currentDb = loadDownloadsDb();
    const targetDir = rawItem.folderPath || rawItem.filePath || (rawItem.downloadedFiles && rawItem.downloadedFiles[0] ? path.dirname(rawItem.downloadedFiles[0]) : '');
    const enrich = enrichDownloadDetails(targetDir, rawItem.isPlaylist, rawItem.downloadedFiles);

    const fullItem = {
      ...rawItem,
      sourceUrl: rawItem.sourceUrl || rawItem.url || rawItem.originalOptions?.url || '',
      playlistDir: enrich.playlistDir || rawItem.playlistDir || rawItem.folderPath || null,
      hasSub: enrich.hasSub || rawItem.hasSub || false,
      subPaths: enrich.subPaths.length > 0 ? enrich.subPaths : (rawItem.subPaths || []),
      hasThumbnail: enrich.hasThumbnail || rawItem.hasThumbnail || false,
      thumbnailPath: enrich.thumbnailPath || rawItem.thumbnailPath || null,
      downloadedAt: rawItem.downloadedAt || Date.now()
    };

    const existingIdx = currentDb.findIndex(i => i.id === fullItem.id);
    if (existingIdx >= 0) {
      currentDb[existingIdx] = { ...currentDb[existingIdx], ...fullItem };
    } else {
      currentDb.unshift(fullItem);
    }

    saveDownloadsDb(currentDb);
    return currentDb;
  } catch (err) {
    console.error('Error adding download item to DB internal:', err);
    return [];
  }
}

ipcMain.handle('db:get-path', async () => getDbDir());
ipcMain.handle('db:load-options', async () => loadSelectOptionsDb());
ipcMain.handle('db:save-options', async (event, data) => saveSelectOptionsDb(data));
ipcMain.handle('db:load-presets', async () => loadPresetsDb());
ipcMain.handle('db:save-presets', async (event, data) => savePresetsDb(data));
ipcMain.handle('db:load-downloads', async () => loadDownloadsDb());
ipcMain.handle('db:save-downloads', async (event, data) => saveDownloadsDb(data));
ipcMain.handle('db:add-download', async (event, rawItem) => addDownloadItemToDbInternal(rawItem));

ipcMain.handle('db:delete-download', async (event, id) => {
  const currentDb = loadDownloadsDb();
  const updated = currentDb.filter(item => item.id !== id);
  saveDownloadsDb(updated);
  return updated;
});

ipcMain.handle('db:clear-downloads', async () => {
  saveDownloadsDb([]);
  return [];
});

