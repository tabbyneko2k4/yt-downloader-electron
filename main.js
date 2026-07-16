const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

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
  for (const [id, process] of activeDownloads.entries()) {
    try {
      process.kill('SIGTERM');
    } catch (e) {
      console.error(`Failed to kill process ${id}:`, e);
    }
  }
  if (process.platform !== 'darwin') app.quit();
});

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

// IPC Handler: Get Video Metadata
ipcMain.handle('yt-dlp:get-info', async (event, url) => {
  return new Promise((resolve, reject) => {
    // Run yt-dlp --dump-json to get video information
    const process = spawn('yt-dlp', ['--dump-json', '--no-playlist', url]);
    
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
          resolve({
            success: true,
            info: {
              title: info.title,
              thumbnail: info.thumbnail,
              duration: info.duration, // in seconds
              uploader: info.uploader,
              webpage_url: info.webpage_url,
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
ipcMain.handle('yt-dlp:download', async (event, { id, url, formatType, quality, destDir }) => {
  if (activeDownloads.has(id)) {
    throw new Error('Tiến trình tải này đang được thực hiện.');
  }

  return new Promise((resolve, reject) => {
    const args = [];

    // Base settings
    args.push('--no-playlist');
    
    // Output path template
    // Use path.join to create absolute path pattern
    const outputTemplate = path.join(destDir, '%(title)s.%(ext)s');
    args.push('-o', outputTemplate);

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

    args.push(url);

    console.log(`Starting download for ${id} with command: yt-dlp ${args.join(' ')}`);
    const downloadProcess = spawn('yt-dlp', args);
    activeDownloads.set(id, downloadProcess);

    let logs = '';

    downloadProcess.stdout.on('data', (data) => {
      const text = data.toString();
      logs += text;

      // Split lines to find progress
      const lines = text.split('\r');
      for (const line of lines) {
        const progress = parseProgress(line);
        if (progress) {
          mainWindow.webContents.send('download-progress', { id, ...progress, logLine: line.trim() });
        } else if (line.trim()) {
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
        resolve({ success: true, logs });
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
  const process = activeDownloads.get(id);
  if (process) {
    process.kill('SIGTERM');
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
