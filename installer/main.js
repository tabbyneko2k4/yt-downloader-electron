const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec, execSync, execFile, execFileSync } = require('child_process');
const https = require('https');
const http = require('http');
const url = require('url');

// Cấu hình thư mục dữ liệu cục bộ để tránh lỗi "Access is denied"
let userDataPath;
if (app.isPackaged) {
  userDataPath = path.join(path.dirname(process.execPath), 'electron_installer_data');
} else {
  userDataPath = path.join(__dirname, 'electron_installer_data');
}
app.setPath('userData', userDataPath);

// Sử dụng SwiftShader software renderer để vô hiệu hóa card màn hình cứng
// mà vẫn đảm bảo Compositor hiển thị giao diện đầy đủ (tránh bị màn hình trắng)
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('use-gl', 'swiftshader');



let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 680,
    height: 520,
    resizable: false,
    frame: false, // frameless UI
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');

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
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handler: Minimize & Close
ipcMain.on('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window:close', () => {
  app.quit();
});

// IPC Handler: Browse Folder
ipcMain.handle('dialog:select-directory', async (event, defaultPath) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Chọn thư mục cài đặt',
    defaultPath: defaultPath || app.getPath('desktop')
  });
  if (result.canceled) {
    return null;
  } else {
    return result.filePaths[0];
  }
});

// IPC Handler: Get Default Paths
ipcMain.handle('app:get-default-paths', () => {
  return {
    localInstall: path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'Programs', "Nyanko's Media Downloader"),
    portableInstall: path.join(os.homedir(), 'Desktop', "Nyanko's Media Downloader (Portable)")
  };
});

// Helper: Download file with redirect support
function downloadFileWithRedirects(fileUrl, destPath, fileId) {
  return new Promise((resolve, reject) => {
    // Ensure destination directory exists
    const parentDir = path.dirname(destPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    let file = fs.createWriteStream(destPath);
    let request;

    function get(currentUrl) {
      const parsedUrl = url.parse(currentUrl);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;

      // Set user agent to avoid github/download API blocks
      const options = {
        ...parsedUrl,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      };
      
      request = protocol.get(options, (response) => {
        // Follow redirects (HTTP 301, 302, 303, 307, 308)
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          file.close();
          try { fs.unlinkSync(destPath); } catch (e) {}
          file = fs.createWriteStream(destPath);
          const redirectUrl = url.resolve(currentUrl, response.headers.location);
          get(redirectUrl);
          return;
        }

        if (response.statusCode !== 200) {
          file.close();
          try { fs.unlinkSync(destPath); } catch (e) {}
          reject(new Error(`HTTP Status ${response.statusCode} for URL: ${currentUrl}`));
          return;
        }

        const totalBytes = parseInt(response.headers['content-length'], 10) || 0;
        let receivedBytes = 0;

        response.on('data', (chunk) => {
          receivedBytes += chunk.length;
          file.write(chunk);
          if (totalBytes && mainWindow) {
            mainWindow.webContents.send('download-progress', {
              fileId,
              receivedBytes,
              totalBytes,
              percent: (receivedBytes / totalBytes) * 100
            });
          }
        });

        response.on('end', () => {
          file.end();
          resolve();
        });
      });

      request.on('error', (err) => {
        file.close();
        try { fs.unlinkSync(destPath); } catch (e) {}
        reject(err);
      });
    }

    get(fileUrl);
  });
}

// IPC Handler: Download dependency
ipcMain.handle('install:download-file', async (event, { url, destPath, fileId }) => {
  try {
    await downloadFileWithRedirects(url, destPath, fileId);
    return { success: true };
  } catch (err) {
    console.error(`Download failed for ${fileId}:`, err);
    return { success: false, error: err.message };
  }
});

// IPC Handler: Extract App Package ZIP
ipcMain.handle('install:extract-app', async (event, { destPath }) => {
  try {
    const asarZipPath = path.join(__dirname, 'app.zip');
    const tempZipPath = path.join(os.tmpdir(), `yt_dlp_app_${Date.now()}.zip`);

    if (!fs.existsSync(asarZipPath)) {
      throw new Error(`Không tìm thấy file nguồn app.zip tại ${asarZipPath}`);
    }

    // Copy app.zip out of ASAR to temp directory
    const zipBuffer = fs.readFileSync(asarZipPath);
    fs.writeFileSync(tempZipPath, zipBuffer);

    // Ensure destination directory exists
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }

    // Extract using PowerShell Expand-Archive
    return new Promise((resolve) => {
      const safeTempZip = tempZipPath.replace(/'/g, "''");
      const safeDest = destPath.replace(/'/g, "''");
      const psCommand = `Expand-Archive -LiteralPath '${safeTempZip}' -DestinationPath '${safeDest}' -Force`;

      execFile('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psCommand], (err, stdout, stderr) => {
        // Clean up temp zip
        try { fs.unlinkSync(tempZipPath); } catch (e) {}

        if (err) {
          resolve({ success: false, error: stderr || err.message });
        } else {
          resolve({ success: true });
        }
      });
    });
  } catch (err) {
    console.error('Extraction error:', err);
    return { success: false, error: err.message };
  }
});

// Helper: Run PowerShell Shortcut Creator
function createShortcutPowerShell(targetPath, shortcutPath) {
  const safeShortcut = shortcutPath.replace(/\//g, '\\').replace(/'/g, "''");
  const safeTarget = targetPath.replace(/\//g, '\\').replace(/'/g, "''");
  const safeDir = path.dirname(targetPath).replace(/\//g, '\\').replace(/'/g, "''");
  
  const code = [
    `$WshShell = New-Object -ComObject WScript.Shell`,
    `$Shortcut = $WshShell.CreateShortcut('${safeShortcut}')`,
    `$Shortcut.TargetPath = '${safeTarget}'`,
    `$Shortcut.WorkingDirectory = '${safeDir}'`,
    `$Shortcut.Save()`
  ].join('; ');
  
  try {
    execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', code]);
    return true;
  } catch (err) {
    console.error(`Failed to create shortcut at ${shortcutPath}:`, err);
    return false;
  }
}

// Helper: Find main executable in app directory
function getMainExePath(appPath) {
  const candidates = [
    path.join(appPath, "Nyanko's Media Downloader.exe"),
    path.join(appPath, "Media Downloader.exe"),
    path.join(appPath, "YT-DLP Media Downloader.exe")
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  if (fs.existsSync(appPath)) {
    const files = fs.readdirSync(appPath);
    const exe = files.find(f => f.endsWith('.exe') && !f.toLowerCase().includes('uninstall'));
    if (exe) return path.join(appPath, exe);
  }
  return path.join(appPath, "Media Downloader.exe");
}

// IPC Handler: Create shortcuts
ipcMain.handle('install:create-shortcuts', async (event, { appPath, desktop, startMenu }) => {
  const exePath = getMainExePath(appPath);
  let success = true;

  if (desktop) {
    const desktopPath = path.join(os.homedir(), 'Desktop', "Nyanko's Media Downloader.lnk");
    const res = createShortcutPowerShell(exePath, desktopPath);
    if (!res) success = false;
  }

  if (startMenu) {
    const startMenuFolder = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs');
    if (!fs.existsSync(startMenuFolder)) {
      fs.mkdirSync(startMenuFolder, { recursive: true });
    }
    const startMenuPath = path.join(startMenuFolder, "Nyanko's Media Downloader.lnk");
    const res = createShortcutPowerShell(exePath, startMenuPath);
    if (!res) success = false;
  }

  return { success };
});

// IPC Handler: Pin to Taskbar
ipcMain.handle('install:pin-taskbar', async (event, { appPath }) => {
  const startMenuShortcut = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', "Nyanko's Media Downloader.lnk");
  const desktopShortcut = path.join(os.homedir(), 'Desktop', "Nyanko's Media Downloader.lnk");
  
  let sourceShortcutPath = '';
  if (fs.existsSync(startMenuShortcut)) {
    sourceShortcutPath = startMenuShortcut;
  } else if (fs.existsSync(desktopShortcut)) {
    sourceShortcutPath = desktopShortcut;
  } else {
    const exePath = getMainExePath(appPath);
    sourceShortcutPath = path.join(os.tmpdir(), `yt_dlp_temp_${Date.now()}.lnk`);
    createShortcutPowerShell(exePath, sourceShortcutPath);
  }

  const safeDir = path.dirname(sourceShortcutPath).replace(/\//g, '\\').replace(/'/g, "''");
  const safeBase = path.basename(sourceShortcutPath).replace(/\//g, '\\').replace(/'/g, "''");

  const code = [
    `$shell = New-Object -ComObject Shell.Application`,
    `$folder = $shell.NameSpace('${safeDir}')`,
    `$item = $folder.ParseName('${safeBase}')`,
    `$verbs = $item.Verbs()`,
    `$pinVerb = $verbs | Where-Object { $_.Name.replace('&','') -match 'Ghim vào thanh tác vụ|Pin to taskbar' }`,
    `if ($pinVerb) { $pinVerb.DoIt(); Write-Host 'Success' } else { Write-Host 'Verb not found' }`
  ].join('; ');

  try {
    const result = execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', code]).toString().trim();
    console.log('Pin to taskbar output:', result);
    return { success: result.includes('Success') };
  } catch (err) {
    console.error('Failed to pin to taskbar:', err);
    return { success: false, error: err.message };
  } finally {
    if (sourceShortcutPath.includes('yt_dlp_temp_')) {
      try { fs.unlinkSync(sourceShortcutPath); } catch (e) {}
    }
  }
});

// Helper: Flatten extracted binaries from nested directories to root destPath
function flattenExtractedBinaries(targetDir) {
  function findFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      const resPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        findFiles(resPath, fileList);
      } else {
        fileList.push(resPath);
      }
    }
    return fileList;
  }

  const allFiles = findFiles(targetDir);
  for (const filePath of allFiles) {
    const fileName = path.basename(filePath);
    const destination = path.join(targetDir, fileName);
    if (filePath !== destination && (fileName.endsWith('.exe') || fileName.endsWith('.dll'))) {
      try {
        fs.copyFileSync(filePath, destination);
      } catch (e) {
        console.error(`Failed to copy ${fileName} to ${destination}:`, e);
      }
    }
  }
}

// IPC Handler: Launch application
ipcMain.handle('install:launch-app', async (event, { appPath }) => {
  const exePath = getMainExePath(appPath);
  try {
    // Spawn detached process
    const child = exec(`"${exePath}"`, {
      cwd: appPath,
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
    return { success: true };
  } catch (err) {
    console.error('Failed to launch application:', err);
    return { success: false, error: err.message };
  }
});

// Extract zipped dependencies using PowerShell
ipcMain.handle('install:unzip-file', async (event, { zipPath, destPath }) => {
  try {
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }

    return new Promise((resolve) => {
      const safeZipPath = zipPath.replace(/'/g, "''");
      const safeDestPath = destPath.replace(/'/g, "''");
      const psCommand = `Expand-Archive -LiteralPath '${safeZipPath}' -DestinationPath '${safeDestPath}' -Force`;

      execFile('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psCommand], (err, stdout, stderr) => {
        // Delete zip file after extract
        try { fs.unlinkSync(zipPath); } catch (e) {}

        if (err) {
          resolve({ success: false, error: stderr || err.message });
        } else {
          try {
            flattenExtractedBinaries(destPath);
          } catch (e) {
            console.error('Error flattening binaries:', e);
          }
          resolve({ success: true });
        }
      });
    });
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC Handler: Check existing system/local dependencies
ipcMain.handle('install:check-dependencies', async (event, { targetPath }) => {
  const results = {
    ytdlp: false,
    ffmpeg: false,
    ffprobe: false
  };

  // Helper to check if binary exists locally in targetPath/bin or on system PATH
  const checkBinary = (name) => {
    const localBinPath = path.join(targetPath, 'bin', `${name}.exe`);
    if (fs.existsSync(localBinPath)) {
      return true;
    }
    try {
      execSync(`where ${name}`, { stdio: 'ignore' });
      return true;
    } catch (e) {
      return false;
    }
  };

  results.ytdlp = checkBinary('yt-dlp');
  results.ffmpeg = checkBinary('ffmpeg');
  results.ffprobe = checkBinary('ffprobe');

  return results;
});

// Helper to copy directory recursively
function copyDirRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursiveSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// IPC Handler: Copy Chrome extension to target folder
ipcMain.handle('install:copy-extension', async (event, { targetPath }) => {
  try {
    const extSrcPath = path.join(__dirname, 'chrome-extension');
    const rootExtSrcPath = path.join(__dirname, '..', 'chrome-extension');
    const srcPath = fs.existsSync(extSrcPath) ? extSrcPath : (fs.existsSync(rootExtSrcPath) ? rootExtSrcPath : null);

    if (!srcPath) {
      console.log('Chrome extension source folder not found.');
      return { success: false, error: 'Source extension directory not found' };
    }

    const extDestPath = path.join(targetPath, 'chrome-extension');
    copyDirRecursiveSync(srcPath, extDestPath);
    return { success: true, destPath: extDestPath };
  } catch (err) {
    console.error('Error copying extension:', err);
    return { success: false, error: err.message };
  }
});

// IPC Handler: Create portable.tag marker file
ipcMain.handle('install:create-portable-tag', async (event, { targetPath }) => {
  try {
    const tagPath = path.join(targetPath, 'portable.tag');
    fs.writeFileSync(tagPath, 'portable=true\ncreated_at=' + new Date().toISOString(), 'utf-8');
    return { success: true };
  } catch (err) {
    console.error('Error creating portable.tag:', err);
    return { success: false, error: err.message };
  }
});

// IPC Handler: Install package via Winget
ipcMain.handle('install:winget-package', async (event, { packageId }) => {
  return new Promise((resolve) => {
    execFile('winget', ['install', '--id', packageId, '--accept-source-agreements', '--accept-package-agreements', '--silent'], { timeout: 180000 }, (err, stdout, stderr) => {
      if (err) {
        console.error(`Winget install failed for ${packageId}:`, stderr || err.message);
        resolve({ success: false, error: stderr || err.message });
      } else {
        resolve({ success: true, output: stdout });
      }
    });
  });
});

