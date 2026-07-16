// Elements selectors
const btnMinimize = document.getElementById('btn-minimize');
const btnClose = document.getElementById('btn-close');

const stepWelcome = document.getElementById('step-welcome');
const stepOptions = document.getElementById('step-options');
const stepProgress = document.getElementById('step-progress');
const stepFinish = document.getElementById('step-finish');

const btnWelcomeNext = document.getElementById('btn-welcome-next');
const btnOptionsBack = document.getElementById('btn-options-back');
const btnOptionsInstall = document.getElementById('btn-options-install');
const btnBrowsePath = document.getElementById('btn-browse-path');
const btnFinish = document.getElementById('btn-finish');

const pathInput = document.getElementById('install-path-input');
const radioLocal = document.getElementById('mode-local');
const radioPortable = document.getElementById('mode-portable');
const modeCards = document.querySelectorAll('.mode-card');

const progressSubtitle = document.getElementById('progress-subtitle');
const majorProgressFill = document.getElementById('major-progress-fill');
const majorProgressStatus = document.getElementById('major-progress-status');
const majorProgressPercent = document.getElementById('major-progress-percent');

// Checkboxes on finish screen
const chkDesktopShortcut = document.getElementById('chk-desktop-shortcut');
const chkStartShortcut = document.getElementById('chk-start-shortcut');
const chkTaskbarPin = document.getElementById('chk-taskbar-pin');
const chkLaunchApp = document.getElementById('chk-launch-app');

const labelDesktopShortcut = document.getElementById('label-desktop-shortcut');
const labelStartShortcut = document.getElementById('label-start-shortcut');
const labelTaskbarPin = document.getElementById('label-taskbar-pin');

// Default paths fetched from main process
let defaultPaths = { localInstall: '', portableInstall: '' };
let currentTargetPath = '';
let selectedMode = 'local'; // 'local' or 'portable'

// Navigation: Welcome -> Options
btnWelcomeNext.addEventListener('click', async () => {
  switchStep(stepWelcome, stepOptions);
  
  // Load default paths if not already loaded
  if (!defaultPaths.localInstall) {
    try {
      defaultPaths = await window.api.getDefaultPaths();
      currentTargetPath = defaultPaths.localInstall;
      pathInput.value = currentTargetPath;
    } catch (err) {
      console.error('Failed to get default paths:', err);
    }
  }
});

// Navigation: Options -> Welcome
btnOptionsBack.addEventListener('click', () => {
  switchStep(stepOptions, stepWelcome);
});

// Handle Mode Card Selection UI & Radio toggles
radioLocal.addEventListener('change', () => handleModeChange('local'));
radioPortable.addEventListener('change', () => handleModeChange('portable'));

// Mode Cards click handler
modeCards.forEach(card => {
  card.addEventListener('click', () => {
    const radio = card.querySelector('input[type="radio"]');
    radio.checked = true;
    handleModeChange(radio.value);
  });
});

function handleModeChange(mode) {
  selectedMode = mode;
  modeCards.forEach(c => c.classList.remove('active'));
  
  if (mode === 'local') {
    document.querySelector('label[for="mode-local"]').classList.add('active');
    currentTargetPath = defaultPaths.localInstall;
    // Show shortcut options on finish screen
    labelDesktopShortcut.classList.remove('hidden');
    labelStartShortcut.classList.remove('hidden');
    labelTaskbarPin.classList.remove('hidden');
  } else {
    document.querySelector('label[for="mode-portable"]').classList.add('active');
    currentTargetPath = defaultPaths.portableInstall;
    // Hide taskbar/start shortcut defaults for portable to keep it clean (or let user choose)
    chkTaskbarPin.checked = false;
    chkStartShortcut.checked = false;
  }
  
  pathInput.value = currentTargetPath;
}

// Browse folder
btnBrowsePath.addEventListener('click', async () => {
  try {
    const dir = await window.api.selectDirectory(currentTargetPath);
    if (dir) {
      currentTargetPath = dir;
      pathInput.value = currentTargetPath;
    }
  } catch (err) {
    console.error(err);
  }
});

// Titlebar Controls
btnMinimize.addEventListener('click', () => window.api.minimize());
btnClose.addEventListener('click', () => {
  if (confirm('Bạn có chắc chắn muốn thoát khỏi trình cài đặt không?')) {
    window.api.close();
  }
});

// Navigation helper
function switchStep(fromStep, toStep) {
  fromStep.classList.remove('active');
  toStep.classList.add('active');
}

// Global download progress listener
window.api.onDownloadProgress((data) => {
  const { fileId, percent, receivedBytes, totalBytes } = data;
  const detailEl = document.getElementById(`${fileId}-detail`);
  const fillEl = document.getElementById(`${fileId}-bar`);
  
  if (detailEl && fillEl) {
    const recMB = (receivedBytes / (1024 * 1024)).toFixed(1);
    const totMB = (totalBytes / (1024 * 1024)).toFixed(1);
    detailEl.textContent = `Đang tải: ${recMB} MB / ${totMB} MB (${Math.round(percent)}%)`;
    fillEl.style.width = `${percent}%`;
  }
});

// Installation Pipeline
btnOptionsInstall.addEventListener('click', async () => {
  const targetDir = pathInput.value.trim();
  if (!targetDir) {
    alert('Vui lòng chọn thư mục cài đặt hợp lệ.');
    return;
  }
  currentTargetPath = targetDir;
  
  // Transition to Progress Step
  switchStep(stepOptions, stepProgress);
  btnClose.style.display = 'none'; // Lock close button during installation

  try {
    // Pipeline Progress Tracking
    let progress = 0;
    const updateMajorProgress = (statusText, percent) => {
      majorProgressStatus.textContent = statusText;
      majorProgressPercent.textContent = `${percent}%`;
      majorProgressFill.style.width = `${percent}%`;
    };

    // 1. EXTRACT APP ZIP
    updateMajorProgress('Đang giải nén ứng dụng...', 10);
    const statusExtract = document.getElementById('status-extract');
    statusExtract.querySelector('.spinner-small').classList.remove('hidden');
    
    const extractRes = await window.api.extractApp({ destPath: currentTargetPath });
    statusExtract.querySelector('.spinner-small').classList.add('hidden');
    
    if (!extractRes.success) {
      throw new Error(`Lỗi giải nén tệp tin ứng dụng: ${extractRes.error}`);
    }
    statusExtract.querySelector('.check-icon').classList.remove('hidden');
    statusExtract.classList.add('done');
    
    // 2. DOWNLOAD YT-DLP
    updateMajorProgress('Đang tải yt-dlp (Trình tải cốt lõi)...', 30);
    const statusYtdlp = document.getElementById('status-ytdlp');
    statusYtdlp.querySelector('.pending-dot').classList.add('hidden');
    statusYtdlp.querySelector('.spinner-small').classList.remove('hidden');
    document.getElementById('ytdlp-bar-container').classList.remove('hidden');
    
    const ytdlpUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
    const ytdlpDest = currentTargetPath + '\\bin\\yt-dlp.exe';
    
    const ytdlpRes = await window.api.downloadFile({
      url: ytdlpUrl,
      destPath: ytdlpDest,
      fileId: 'ytdlp'
    });
    
    statusYtdlp.querySelector('.spinner-small').classList.add('hidden');
    document.getElementById('ytdlp-bar-container').classList.add('hidden');
    
    if (!ytdlpRes.success) {
      throw new Error(`Không thể tải yt-dlp: ${ytdlpRes.error}`);
    }
    statusYtdlp.querySelector('.check-icon').classList.remove('hidden');
    document.getElementById('ytdlp-detail').textContent = 'Đã cài đặt thành công.';
    statusYtdlp.classList.add('done');

    // 3. DOWNLOAD FFMPEG
    updateMajorProgress('Đang tải ffmpeg (Bộ giải mã âm thanh)...', 60);
    const statusFfmpeg = document.getElementById('status-ffmpeg');
    statusFfmpeg.querySelector('.pending-dot').classList.add('hidden');
    statusFfmpeg.querySelector('.spinner-small').classList.remove('hidden');
    document.getElementById('ffmpeg-bar-container').classList.remove('hidden');
    
    const ffmpegUrl = 'https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v4.4.1/ffmpeg-4.4.1-win-64.zip';
    const ffmpegZip = currentTargetPath + '\\bin\\ffmpeg.zip';
    
    const ffmpegDownloadRes = await window.api.downloadFile({
      url: ffmpegUrl,
      destPath: ffmpegZip,
      fileId: 'ffmpeg'
    });
    
    document.getElementById('ffmpeg-bar-container').classList.add('hidden');
    
    if (!ffmpegDownloadRes.success) {
      throw new Error(`Không thể tải ffmpeg: ${ffmpegDownloadRes.error}`);
    }
    
    // Extract ffmpeg zip
    document.getElementById('ffmpeg-detail').textContent = 'Đang giải nén thư viện...';
    const ffmpegUnzipRes = await window.api.unzipFile({
      zipPath: ffmpegZip,
      destPath: currentTargetPath + '\\bin'
    });
    
    statusFfmpeg.querySelector('.spinner-small').classList.add('hidden');
    if (!ffmpegUnzipRes.success) {
      throw new Error(`Không thể giải nén ffmpeg: ${ffmpegUnzipRes.error}`);
    }
    statusFfmpeg.querySelector('.check-icon').classList.remove('hidden');
    document.getElementById('ffmpeg-detail').textContent = 'Đã cài đặt thành công.';
    statusFfmpeg.classList.add('done');

    // 4. DOWNLOAD FFPROBE
    updateMajorProgress('Đang tải ffprobe (Phân tích phương tiện)...', 85);
    const statusFfprobe = document.getElementById('status-ffprobe');
    statusFfprobe.querySelector('.pending-dot').classList.add('hidden');
    statusFfprobe.querySelector('.spinner-small').classList.remove('hidden');
    document.getElementById('ffprobe-bar-container').classList.remove('hidden');
    
    const ffprobeUrl = 'https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v4.4.1/ffprobe-4.4.1-win-64.zip';
    const ffprobeZip = currentTargetPath + '\\bin\\ffprobe.zip';
    
    const ffprobeDownloadRes = await window.api.downloadFile({
      url: ffprobeUrl,
      destPath: ffprobeZip,
      fileId: 'ffprobe'
    });
    
    document.getElementById('ffprobe-bar-container').classList.add('hidden');
    
    if (!ffprobeDownloadRes.success) {
      throw new Error(`Không thể tải ffprobe: ${ffprobeDownloadRes.error}`);
    }
    
    // Extract ffprobe zip
    document.getElementById('ffprobe-detail').textContent = 'Đang giải nén thư viện...';
    const ffprobeUnzipRes = await window.api.unzipFile({
      zipPath: ffprobeZip,
      destPath: currentTargetPath + '\\bin'
    });
    
    statusFfprobe.querySelector('.spinner-small').classList.add('hidden');
    if (!ffprobeUnzipRes.success) {
      throw new Error(`Không thể giải nén ffprobe: ${ffprobeUnzipRes.error}`);
    }
    statusFfprobe.querySelector('.check-icon').classList.remove('hidden');
    document.getElementById('ffprobe-detail').textContent = 'Đã cài đặt thành công.';
    statusFfprobe.classList.add('done');

    // Finish pipeline
    updateMajorProgress('Cài đặt hoàn tất!', 100);
    setTimeout(() => {
      btnClose.style.display = 'flex'; // Restore close button
      switchStep(stepProgress, stepFinish);
    }, 800);

  } catch (err) {
    btnClose.style.display = 'flex'; // Restore close button
    alert(`Cài đặt thất bại!\n\nChi tiết: ${err.message}`);
    // Navigate back to options to retry
    switchStep(stepProgress, stepOptions);
  }
});

// Finish Page Button Action
btnFinish.addEventListener('click', async () => {
  btnFinish.disabled = true;
  
  const shortcutsOptions = {
    appPath: currentTargetPath,
    desktop: chkDesktopShortcut.checked,
    startMenu: chkStartShortcut.checked
  };
  
  // Create Shortcuts
  if (shortcutsOptions.desktop || shortcutsOptions.startMenu) {
    await window.api.createShortcuts(shortcutsOptions);
  }
  
  // Pin to taskbar
  if (chkTaskbarPin.checked) {
    await window.api.pinTaskbar({ appPath: currentTargetPath });
  }
  
  // Launch App
  if (chkLaunchApp.checked) {
    await window.api.launchApp({ appPath: currentTargetPath });
  }
  
  // Exit Setup
  window.api.close();
});
