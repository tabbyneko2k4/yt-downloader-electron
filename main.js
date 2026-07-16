const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const https = require('https');


function getBinPaths() {
  const isWin = process.platform === 'win32';
  return {
    ytDlp: path.join(binDir, isWin ? 'yt-dlp.exe' : 'yt-dlp'),
    ffmpeg: path.join(binDir, isWin ? 'ffmpeg.exe' : 'ffmpeg'),
    ffprobe: path.join(binDir, isWin ? 'ffprobe.exe' : 'ffprobe')
  };
}

function checkBinariesExist() {
  const paths = getBinPaths();
  return fs.existsSync(paths.ytDlp) && fs.existsSync(paths.ffmpeg) && fs.existsSync(paths.ffprobe);
}

function getYtDlpCommand() {
  const paths = getBinPaths();
  if (fs.existsSync(paths.ytDlp)) {
    return paths.ytDlp;
  }
  return 'yt-dlp';
}

// Tải file có hiển thị tiến trình
function downloadFile(url, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const request = (targetUrl) => {
      const parsedUrl = new URL(targetUrl);
      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      };

      https.get(options, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          request(response.headers.location);
          return;
        }
        
        if (response.statusCode !== 200) {
          reject(new Error(`Tải file thất bại: ${response.statusCode}`));
          return;
        }

        const totalLength = parseInt(response.headers['content-length'], 10);
        let downloadedLength = 0;

        response.on('data', (chunk) => {
          downloadedLength += chunk.length;
          file.write(chunk);
          if (onProgress && totalLength) {
            onProgress(downloadedLength, totalLength);
          }
        });

        response.on('end', () => {
          file.end();
          resolve();
        });
      }).on('error', (err) => {
        file.close();
        fs.unlink(destPath, () => {});
        reject(err);
      });
    };
    request(url);
  });
}

function extractZipWindows(zipPath, destDir) {
  return new Promise((resolve, reject) => {
    const escapedZipPath = zipPath.replace(/'/g, "''");
    const escapedDestDir = destDir.replace(/'/g, "''");
    const ps = spawn('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      `Expand-Archive -Path '${escapedZipPath}' -DestinationPath '${escapedDestDir}' -Force`
    ]);

    let stderr = '';
    ps.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ps.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Giải nén thất bại: ${stderr}`));
    });
    ps.on('error', reject);
  });
}

function extractZipUnix(zipPath, destDir) {
  return new Promise((resolve, reject) => {
    const ps = spawn('unzip', ['-o', zipPath, '-d', destDir]);
    ps.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`unzip thất bại: code ${code}`));
    });
    ps.on('error', reject);
  });
}

function extractZip(zipPath, destDir) {
  if (process.platform === 'win32') {
    return extractZipWindows(zipPath, destDir);
  } else {
    return extractZipUnix(zipPath, destDir);
  }
}


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

// Thư mục chứa thư viện local
let binDir;
const appDirBin = path.join(path.dirname(process.execPath), 'bin');
const devDirBin = path.join(__dirname, 'bin');

if (app.isPackaged) {
  if (fs.existsSync(appDirBin)) {
    binDir = appDirBin;
  } else {
    binDir = path.join(app.getPath('userData'), 'bin');
  }
} else {
  if (fs.existsSync(devDirBin)) {
    binDir = devDirBin;
  } else {
    binDir = path.join(app.getPath('userData'), 'bin');
  }
}

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

// Helper: Strip ANSI escape codes
function stripAnsi(str) {
  return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
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
    const ytDlpCmd = getYtDlpCommand();
    const pathSeparator = process.platform === 'win32' ? ';' : ':';
    const env = {
      ...process.env,
      PATH: `${binDir}${pathSeparator}${process.env.PATH}`,
      PYTHONIOENCODING: 'utf-8',
      LANG: 'en_US.UTF-8'
    };
    // Run yt-dlp --flat-playlist --dump-single-json to support playlists/sets
    const child = spawn(ytDlpCmd, ['--flat-playlist', '--dump-single-json', url], { env });
    
    let stdoutData = '';
    let stderrData = '';

    child.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

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

    child.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(new Error('Không tìm thấy yt-dlp trên hệ thống. Hãy đảm bảo bạn đã cài đặt đầy đủ các thư viện.'));
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

    const ytDlpCmd = getYtDlpCommand();
    console.log(`Starting download for ${id} with command: ${ytDlpCmd} ${args.join(' ')}`);
    const pathSeparator = process.platform === 'win32' ? ';' : ':';
    const env = { 
      ...process.env, 
      PATH: `${binDir}${pathSeparator}${process.env.PATH}`,
      PYTHONIOENCODING: 'utf-8', 
      LANG: 'en_US.UTF-8' 
    };
    const downloadProcess = spawn(ytDlpCmd, args, { env });
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
        // Parse destination files from logs
        const destinationPaths = [];
        const lines = logs.split(/[\r\n]+/);
        
        // Comprehensive patterns to extract file paths
        const patterns = [
          /(?:[Dd]estination:\s+)(.+)$/,
          /(?:[Mm]erging\s+formats\s+into\s+)(.+)$/,
          /(?:[Aa]dding\s+metadata\s+to\s+)(.+)$/,
          /(?:[Aa]dding\s+thumbnail\s+to\s+)(.+)$/,
          /(?:[Cc]orrecting\s+container\s+of\s+)(.+)$/,
          /(?:[Ff]ixup[Mm]4a\]\s+Correcting\s+container\s+of\s+)(.+)$/
        ];

        for (const line of lines) {
          const cleanLine = stripAnsi(line);
          for (const pattern of patterns) {
            const match = cleanLine.match(pattern);
            if (match) {
              let filePath = match[1].trim();
              if (filePath.startsWith('"') && filePath.endsWith('"')) {
                filePath = filePath.slice(1, -1);
              }
              if (filePath.startsWith("'") && filePath.endsWith("'")) {
                filePath = filePath.slice(1, -1);
              }
              filePath = filePath.replace(/[\r\n]/g, '').trim();
              const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(finalDestDir, filePath);
              if (!destinationPaths.includes(absolutePath)) {
                destinationPaths.push(absolutePath);
              }
            }
          }
        }
        
        // Filter only existing files to be safe
        let existingFiles = destinationPaths.filter(fp => {
          try {
            return fs.existsSync(fp) && fs.statSync(fp).isFile();
          } catch (e) {
            return false;
          }
        });

        // Fallback: If no files were parsed from logs (due to encoding or other issues),
        // scan finalDestDir for files modified within the last 15 seconds
        if (existingFiles.length === 0) {
          try {
            const filesInDir = fs.readdirSync(finalDestDir);
            const now = Date.now();
            const recentFiles = [];
            for (const file of filesInDir) {
              const fullPath = path.join(finalDestDir, file);
              const stat = fs.statSync(fullPath);
              if (stat.isFile() && (now - stat.mtimeMs) < 15000) { // 15 seconds
                recentFiles.push({ path: fullPath, mtime: stat.mtimeMs });
              }
            }
            // Sort by mtime descending (most recent first)
            recentFiles.sort((a, b) => b.mtime - a.mtime);
            if (recentFiles.length > 0) {
              existingFiles = [recentFiles[0].path];
              console.log('Fallback scan matched recent file:', recentFiles[0].path);
            }
          } catch (e) {
            console.error('Fallback scan failed:', e);
          }
        }

        resolve({ success: true, destDir: finalDestDir, files: existingFiles, logs });
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

// IPC Handler: Open file
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

// IPC Handler: Copy file to clipboard
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
    } else if (process.platform === 'darwin') {
      const { clipboard } = require('electron');
      const fileUrl = `file://${absolutePath}`;
      clipboard.write({
        text: absolutePath,
        html: `<a href="${fileUrl}">${path.basename(absolutePath)}</a>`
      });
    } else {
      const { clipboard } = require('electron');
      clipboard.writeText(absolutePath);
    }
    return true;
  } catch (e) {
    console.error('Failed to copy file to clipboard:', e);
    return false;
  }
});

// Tạo icon kéo thả mặc định để tương thích đa nền tảng (đặc biệt là macOS)
const dragIconPath = path.join(userDataPath, 'drag-icon.png');
try {
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  if (!fs.existsSync(dragIconPath)) {
    const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    fs.writeFileSync(dragIconPath, Buffer.from(base64Data, 'base64'));
  }
} catch (e) {
  console.error('Failed to create drag icon:', e);
}

// Xử lý sự kiện kéo thả tệp tin từ ứng dụng ra hệ thống
ipcMain.on('ondragstart', (event, filePath) => {
  if (!filePath) return;
  try {
    const resolvedPath = path.resolve(filePath);
    if (fs.existsSync(resolvedPath)) {
      event.sender.startDrag({
        file: resolvedPath,
        icon: dragIconPath
      });
    } else {
      console.warn(`File/Folder does not exist for drag start: ${resolvedPath}`);
    }
  } catch (err) {
    console.error('Error starting drag:', err);
  }
});

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const files = fs.readdirSync(src);
  for (const file of files) {
    const curSource = path.join(src, file);
    const curDest = path.join(dest, file);
    if (fs.lstatSync(curSource).isDirectory()) {
      copyDirRecursive(curSource, curDest);
    } else {
      fs.copyFileSync(curSource, curDest);
    }
  }
}

function copyAppFiles(srcDir, destDir) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  const items = fs.readdirSync(srcDir);
  for (const item of items) {
    if (item === 'electron_user_data' || item === 'dist' || item === 'node_modules' || item === '.git' || item === '.agents') {
      continue;
    }
    const srcPath = path.join(srcDir, item);
    const destPath = path.join(destDir, item);
    if (fs.lstatSync(srcPath).isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function createShortcut(destDir) {
  const isWin = process.platform === 'win32';
  if (isWin) {
    const desktopPath = app.getPath('desktop');
    const exeName = path.basename(process.execPath);
    const targetExePath = path.join(destDir, exeName);
    const shortcutPath = path.join(desktopPath, 'YT-DLP Media Downloader.lnk');
    const escapedShortcutPath = shortcutPath.replace(/'/g, "''");
    const escapedTargetExePath = targetExePath.replace(/'/g, "''");
    const workingDir = destDir.replace(/'/g, "''");
    
    const psCommand = `
      $WshShell = New-Object -ComObject WScript.Shell;
      $Shortcut = $WshShell.CreateShortcut('${escapedShortcutPath}');
      $Shortcut.TargetPath = '${escapedTargetExePath}';
      $Shortcut.WorkingDirectory = '${workingDir}';
      $Shortcut.Save();
    `;
    const { execSync } = require('child_process');
    try {
      execSync(`powershell.exe -NoProfile -NonInteractive -Command "${psCommand.trim().replace(/\n/g, ' ')}"`);
      console.log('Windows shortcut created successfully.');
      return true;
    } catch (err) {
      console.error('Failed to create Windows shortcut:', err);
      return false;
    }
  } else if (process.platform === 'linux') {
    const homedir = require('os').homedir();
    const desktopFileDir = path.join(homedir, '.local', 'share', 'applications');
    if (!fs.existsSync(desktopFileDir)) {
      fs.mkdirSync(desktopFileDir, { recursive: true });
    }
    const desktopFilePath = path.join(desktopFileDir, 'yt-dlp-downloader.desktop');
    const exeName = path.basename(process.execPath);
    const targetExePath = path.join(destDir, exeName);
    const content = `[Desktop Entry]
Name=YT-DLP Media Downloader
Exec="${targetExePath}" %U
Terminal=false
Type=Application
Icon=youtube
Comment=A yt-dlp GUI downloader powered by Electron
Categories=Network;Utility;
`;
    try {
      fs.writeFileSync(desktopFilePath, content, 'utf8');
      const userDesktop = path.join(homedir, 'Desktop');
      if (fs.existsSync(userDesktop)) {
        fs.writeFileSync(path.join(userDesktop, 'yt-dlp-downloader.desktop'), content, 'utf8');
        fs.chmodSync(path.join(userDesktop, 'yt-dlp-downloader.desktop'), '755');
      }
      return true;
    } catch (err) {
      console.error('Failed to create Linux shortcut:', err);
      return false;
    }
  }
  return false;
}

// IPC Handler: Check Setup Status
ipcMain.handle('setup:check-status', async () => {
  console.log("setup:check-status IPC called!");
  const configPath = path.join(app.getPath('userData'), 'app_setup_config.json');
  let configExists = fs.existsSync(configPath);
  
  if (!configExists) {
    if (checkBinariesExist()) {
      try {
        const configData = {
          setupCompleted: true,
          installType: 'portable',
          destDir: app.isPackaged ? path.dirname(process.execPath) : __dirname,
          timestamp: new Date().toISOString()
        };
        fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
        configExists = true;
      } catch (e) {
        console.error('Failed to auto-create config file:', e);
      }
    }
  }

  let pkgManager = 'none';
  if (process.platform === 'win32') {
    if (await isCommandAvailable('winget', ['--version'])) {
      pkgManager = 'winget';
    }
  } else if (process.platform === 'darwin') {
    if (await isCommandAvailable('brew', ['--version'])) {
      pkgManager = 'brew';
    }
  } else {
    if (await isCommandAvailable('apt-get', ['--version'])) {
      pkgManager = 'apt';
    }
  }

  let defaultInstallPath = '';
  if (process.platform === 'win32') {
    defaultInstallPath = path.join(app.getPath('appData'), '..', 'Local', 'Programs', 'YT-DLP Media Downloader');
  } else if (process.platform === 'darwin') {
    defaultInstallPath = '/Applications';
  } else {
    defaultInstallPath = path.join(require('os').homedir(), 'YT-DLP-Media-Downloader');
  }

  const currentAppPath = app.isPackaged ? path.dirname(process.execPath) : __dirname;

  return {
    needsSetup: !configExists,
    pkgManager,
    defaultInstallPath,
    currentAppPath,
    platform: process.platform
  };
});

// IPC Handler: Start Setup & Download dependencies
ipcMain.handle('setup:start', async (event, { installType, destDir, pkgManager }) => {
  const sendProgress = (step, percent, status, detail) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('setup-progress', { step, percent, status, detail });
    }
  };

  try {
    // --- Step 1: Install Dependencies ---
    sendProgress(1, 10, 'Cài đặt thư viện phụ thuộc...', 'Đang khởi chạy tiến trình cài đặt...');
    
    let depInstalled = false;
    if (pkgManager && pkgManager !== 'none') {
      sendProgress(1, 20, 'Cài đặt thư viện phụ thuộc...', `Đang cài đặt bằng trình quản lý gói: ${pkgManager}...`);
      
      let command = '';
      let args = [];
      if (pkgManager === 'winget') {
        command = 'powershell.exe';
        args = [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          'winget install yt-dlp.yt-dlp --accept-source-agreements --accept-package-agreements; winget install Gyan.FFmpeg --accept-source-agreements --accept-package-agreements'
        ];
      } else if (pkgManager === 'brew') {
        command = 'brew';
        args = ['install', 'yt-dlp', 'ffmpeg'];
      } else if (pkgManager === 'apt') {
        command = 'pkexec';
        args = ['apt-get', 'install', '-y', 'yt-dlp', 'ffmpeg'];
      }

      if (command) {
        depInstalled = await new Promise((resolve) => {
          const child = spawn(command, args, { shell: true });
          let logOutput = '';
          child.stdout.on('data', (data) => {
            logOutput += data.toString();
            sendProgress(1, 30, 'Cài đặt thư viện phụ thuộc...', data.toString().trim().slice(-60));
          });
          child.stderr.on('data', (data) => {
            logOutput += data.toString();
          });
          child.on('close', (code) => {
            resolve(code === 0);
          });
        });
      }
    }

    if (!depInstalled) {
      sendProgress(1, 40, 'Tải thư viện cục bộ (Dự phòng)...', 'Đang tải yt-dlp và FFmpeg cục bộ...');
      if (!fs.existsSync(binDir)) {
        fs.mkdirSync(binDir, { recursive: true });
      }
      
      const isWin = process.platform === 'win32';
      const isMac = process.platform === 'darwin';

      let ytDlpUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
      let ffmpegUrl = 'https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v6.1/ffmpeg-6.1-win-64.zip';
      let ffprobeUrl = 'https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v6.1/ffprobe-6.1-win-64.zip';

      if (isMac) {
        ytDlpUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos';
        ffmpegUrl = 'https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v6.1/ffmpeg-6.1-osx-64.zip';
        ffprobeUrl = 'https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v6.1/ffprobe-6.1-osx-64.zip';
      } else if (process.platform !== 'win32') {
        ytDlpUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
        ffmpegUrl = 'https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v6.1/ffmpeg-6.1-linux-64.zip';
        ffprobeUrl = 'https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v6.1/ffprobe-6.1-linux-64.zip';
      }

      const binPaths = getBinPaths();

      sendProgress(1, 50, 'Tải thư viện cục bộ...', 'Đang tải yt-dlp...');
      const ytDlpTemp = binPaths.ytDlp + '.tmp';
      await downloadFile(ytDlpUrl, ytDlpTemp);
      if (fs.existsSync(binPaths.ytDlp)) fs.unlinkSync(binPaths.ytDlp);
      fs.renameSync(ytDlpTemp, binPaths.ytDlp);
      if (!isWin) fs.chmodSync(binPaths.ytDlp, '755');

      sendProgress(1, 65, 'Tải thư viện FFmpeg cục bộ...', 'Đang tải FFmpeg...');
      const ffmpegZip = path.join(binDir, 'ffmpeg.zip');
      await downloadFile(ffmpegUrl, ffmpegZip);
      await extractZip(ffmpegZip, binDir);
      try { fs.unlinkSync(ffmpegZip); } catch (e) {}
      if (!isWin) fs.chmodSync(binPaths.ffmpeg, '755');

      sendProgress(1, 80, 'Tải thư viện FFprobe cục bộ...', 'Đang tải FFprobe...');
      const ffprobeZip = path.join(binDir, 'ffprobe.zip');
      await downloadFile(ffprobeUrl, ffprobeZip);
      await extractZip(ffprobeZip, binDir);
      try { fs.unlinkSync(ffprobeZip); } catch (e) {}
      if (!isWin) fs.chmodSync(binPaths.ffprobe, '755');
    }

    // --- Step 2: Copy App Files (if installType is 'installed') ---
    if (installType === 'installed') {
      sendProgress(2, 85, 'Sao chép tệp ứng dụng...', `Đang sao chép các tệp đến: ${destDir}...`);
      if (app.isPackaged) {
        const appDir = path.dirname(process.execPath);
        copyAppFiles(appDir, destDir);
      } else {
        console.log("Mocking file copy in development mode.");
        await new Promise(r => setTimeout(r, 1000));
      }

      // --- Step 3: Create Shortcut ---
      sendProgress(3, 90, 'Tạo phím tắt...', 'Đang tạo shortcut ngoài màn hình Desktop...');
      createShortcut(destDir);
    } else {
      const currentAppDir = app.isPackaged ? path.dirname(process.execPath) : __dirname;
      const resolvedCurrent = path.resolve(currentAppDir);
      const resolvedDest = path.resolve(destDir);
      
      if (resolvedCurrent !== resolvedDest) {
        sendProgress(2, 85, 'Sao chép tệp ứng dụng...', `Đang thiết lập thư mục portable tại: ${destDir}...`);
        if (app.isPackaged) {
          copyAppFiles(resolvedCurrent, resolvedDest);
        } else {
          console.log("Mocking file copy in development mode.");
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }

    // --- Step 4: Write configuration and complete ---
    sendProgress(4, 95, 'Lưu cấu hình thiết lập...', 'Đang hoàn tất các cấu hình...');
    const configPath = path.join(app.getPath('userData'), 'app_setup_config.json');
    const configData = {
      setupCompleted: true,
      installType,
      destDir,
      timestamp: new Date().toISOString()
    };
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');

    sendProgress(4, 100, 'Hoàn thành!', 'Ứng dụng đã được thiết lập thành công.');
    return { success: true };
  } catch (err) {
    console.error('Setup failed:', err);
    throw err;
  }
});

// IPC Handler: Update yt-dlp & FFmpeg
ipcMain.handle('setup:update', async (event) => {
  return new Promise((resolve, reject) => {
    const paths = getBinPaths();
    if (!fs.existsSync(paths.ytDlp)) {
      reject(new Error('Không tìm thấy tệp yt-dlp.exe cục bộ. Vui lòng thực hiện thiết lập trước.'));
      return;
    }

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('download-log', { id: 'update', logLine: 'Bắt đầu kiểm tra bản cập nhật mới cho yt-dlp...' });
    }

    const child = spawn(paths.ytDlp, ['--update']);
    let logs = '';

    child.stdout.on('data', (data) => {
      const line = data.toString();
      logs += line;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('download-log', { id: 'update', logLine: line.trim() });
      }
    });

    child.stderr.on('data', (data) => {
      const line = data.toString();
      logs += line;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('download-log', { id: 'update', logLine: `[Lỗi] ${line.trim()}` });
      }
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, logs });
      } else {
        reject(new Error(`Tiến trình kết thúc với mã lỗi ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
});


// Helper to check if command exists
async function isCommandAvailable(cmd, args = ['--version']) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { shell: true });
    child.on('error', () => {
      resolve(false);
    });
    child.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

// IPC Handler: Check System & Local Libraries Status
ipcMain.handle('settings:check-libraries', async () => {
  const localPaths = getBinPaths();
  
  const results = {
    ytDlp: {
      local: fs.existsSync(localPaths.ytDlp),
      global: await isCommandAvailable('yt-dlp', ['--version'])
    },
    ffmpeg: {
      local: fs.existsSync(localPaths.ffmpeg),
      global: await isCommandAvailable('ffmpeg', ['-version'])
    },
    ffprobe: {
      local: fs.existsSync(localPaths.ffprobe),
      global: await isCommandAvailable('ffprobe', ['-version'])
    }
  };

  // Detect platform & pkg manager
  let pkgManager = 'none';
  if (process.platform === 'win32') {
    if (await isCommandAvailable('winget', ['--version'])) {
      pkgManager = 'winget';
    }
  } else if (process.platform === 'darwin') {
    if (await isCommandAvailable('brew', ['--version'])) {
      pkgManager = 'brew';
    }
  } else {
    // Linux / other
    if (await isCommandAvailable('apt-get', ['--version'])) {
      pkgManager = 'apt';
    }
  }

  return {
    results,
    pkgManager,
    platform: process.platform
  };
});

// IPC Handler: Install Libraries via package manager
ipcMain.handle('settings:install-libraries', async (event, { pkgManager }) => {
  return new Promise((resolve, reject) => {
    let command = '';
    let args = [];

    const sendLog = (line) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('install-log', line);
      }
    };

    if (pkgManager === 'winget') {
      command = 'powershell.exe';
      args = [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        'Write-Output "Bắt đầu cài đặt yt-dlp qua winget..."; ' +
        'winget install yt-dlp.yt-dlp --accept-source-agreements --accept-package-agreements; ' +
        'Write-Output "`nBắt đầu cài đặt FFmpeg qua winget..."; ' +
        'winget install Gyan.FFmpeg --accept-source-agreements --accept-package-agreements; ' +
        'Write-Output "`nHoàn tất các tiến trình cài đặt."'
      ];
    } else if (pkgManager === 'brew') {
      command = 'brew';
      args = ['install', 'yt-dlp', 'ffmpeg'];
    } else if (pkgManager === 'apt') {
      command = 'pkexec';
      args = ['apt-get', 'install', '-y', 'yt-dlp', 'ffmpeg'];
    } else {
      reject(new Error('Không tìm thấy Trình quản lý gói phù hợp trên hệ điều hành này.'));
      return;
    }

    sendLog(`Đang khởi chạy tiến trình cài đặt với: ${command} ${args.join(' ')}\n\n`);

    const child = spawn(command, args, { shell: true });

    child.stdout.on('data', (data) => {
      sendLog(data.toString());
    });

    child.stderr.on('data', (data) => {
      sendLog(data.toString());
    });

    child.on('close', (code) => {
      if (code === 0) {
        sendLog('\n[Hệ thống] Tiến trình cài đặt hoàn tất thành công!\n');
        resolve({ success: true });
      } else {
        sendLog(`\n[Hệ thống] Tiến trình kết thúc với mã thoát: ${code}\n`);
        
        // Fallback for apt if pkexec fails
        if (pkgManager === 'apt' && command === 'pkexec') {
          sendLog('[Hệ thống] Thử lại không cần pkexec...\n');
          const fallback = spawn('apt-get', ['install', '-y', 'yt-dlp', 'ffmpeg'], { shell: true });
          fallback.stdout.on('data', (data) => sendLog(data.toString()));
          fallback.stderr.on('data', (data) => sendLog(data.toString()));
          fallback.on('close', (fCode) => {
            if (fCode === 0) {
              resolve({ success: true });
            } else {
              reject(new Error(`Cài đặt thất bại với mã lỗi ${fCode}`));
            }
          });
          return;
        }
        reject(new Error(`Tiến trình cài đặt kết thúc với mã lỗi ${code}`));
      }
    });

    child.on('error', (err) => {
      sendLog(`\n[LỖI HỆ THỐNG] Không thể thực thi lệnh: ${err.message}\n`);
      reject(err);
    });
  });
});


