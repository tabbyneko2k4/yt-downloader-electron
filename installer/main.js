const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec, execSync } = require('child_process');
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

// Vô hiệu hóa tăng tốc phần cứng nếu cần thiết trên môi trường VM/Sandbox/Remote.
// Mặc định để Chromium tự động quản lý và fallback để tránh lỗi "Failed to create shared context for virtualization" dẫn đến không lên UI.
// app.disableHardwareAcceleration();
// app.commandLine.appendSwitch('no-sandbox');
// app.commandLine.appendSwitch('disable-gpu');
// app.commandLine.appendSwitch('disable-software-rasterizer');
// app.commandLine.appendSwitch('disable-gpu-sandbox');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 650,
    height: 480,
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
    localInstall: path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'Programs', 'YT-DLP Downloader'),
    portableInstall: path.join(os.homedir(), 'Desktop', 'YT-DLP Downloader')
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
      const cmd = `powershell -NoProfile -Command "Expand-Archive -Path '${tempZipPath}' -DestinationPath '${destPath}' -Force"`;
      exec(cmd, (err, stdout, stderr) => {
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
  const cleanShortcut = shortcutPath.replace(/\//g, '\\');
  const cleanTarget = targetPath.replace(/\//g, '\\');
  const cleanDir = path.dirname(targetPath).replace(/\//g, '\\');
  
  const code = [
    `$WshShell = New-Object -ComObject WScript.Shell`,
    `$Shortcut = $WshShell.CreateShortcut('${cleanShortcut}')`,
    `$Shortcut.TargetPath = '${cleanTarget}'`,
    `$Shortcut.WorkingDirectory = '${cleanDir}'`,
    `$Shortcut.Save()`
  ].join('; ');
  
  const cmd = `powershell -NoProfile -Command "${code}"`;
  try {
    execSync(cmd);
    return true;
  } catch (err) {
    console.error(`Failed to create shortcut at ${shortcutPath}:`, err);
    return false;
  }
}

// IPC Handler: Create shortcuts
ipcMain.handle('install:create-shortcuts', async (event, { appPath, desktop, startMenu }) => {
  const exePath = path.join(appPath, 'YT-DLP Media Downloader.exe');
  let success = true;

  if (desktop) {
    const desktopPath = path.join(os.homedir(), 'Desktop', 'YT-DLP Media Downloader.lnk');
    const res = createShortcutPowerShell(exePath, desktopPath);
    if (!res) success = false;
  }

  if (startMenu) {
    const startMenuFolder = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs');
    if (!fs.existsSync(startMenuFolder)) {
      fs.mkdirSync(startMenuFolder, { recursive: true });
    }
    const startMenuPath = path.join(startMenuFolder, 'YT-DLP Media Downloader.lnk');
    const res = createShortcutPowerShell(exePath, startMenuPath);
    if (!res) success = false;
  }

  return { success };
});

// IPC Handler: Pin to Taskbar
ipcMain.handle('install:pin-taskbar', async (event, { appPath }) => {
  const startMenuShortcut = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'YT-DLP Media Downloader.lnk');
  const desktopShortcut = path.join(os.homedir(), 'Desktop', 'YT-DLP Media Downloader.lnk');
  
  let sourceShortcutPath = '';
  if (fs.existsSync(startMenuShortcut)) {
    sourceShortcutPath = startMenuShortcut;
  } else if (fs.existsSync(desktopShortcut)) {
    sourceShortcutPath = desktopShortcut;
  } else {
    const exePath = path.join(appPath, 'YT-DLP Media Downloader.exe');
    sourceShortcutPath = path.join(os.tmpdir(), `yt_dlp_temp_${Date.now()}.lnk`);
    createShortcutPowerShell(exePath, sourceShortcutPath);
  }

  const cleanShortcutPath = sourceShortcutPath.replace(/\//g, '\\');
  const dirName = path.dirname(cleanShortcutPath);
  const baseName = path.basename(cleanShortcutPath);

  const code = [
    `$shell = New-Object -ComObject Shell.Application`,
    `$folder = $shell.NameSpace('${dirName}')`,
    `$item = $folder.ParseName('${baseName}')`,
    `$verbs = $item.Verbs()`,
    `$pinVerb = $verbs | Where-Object { $_.Name.replace('&','') -match 'Ghim vào thanh tác vụ|Pin to taskbar' }`,
    `if ($pinVerb) { $pinVerb.DoIt(); Write-Host 'Success' } else { Write-Host 'Verb not found' }`
  ].join('; ');

  const cmd = `powershell -NoProfile -Command "${code}"`;
  
  try {
    const result = execSync(cmd).toString().trim();
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

// IPC Handler: Launch application
ipcMain.handle('install:launch-app', async (event, { appPath }) => {
  const exePath = path.join(appPath, 'YT-DLP Media Downloader.exe');
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
      const cmd = `powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destPath}' -Force"`;
      exec(cmd, (err, stdout, stderr) => {
        // Delete zip file after extract
        try { fs.unlinkSync(zipPath); } catch (e) {}

        if (err) {
          resolve({ success: false, error: stderr || err.message });
        } else {
          resolve({ success: true });
        }
      });
    });
  } catch (err) {
    return { success: false, error: err.message };
  }
});
