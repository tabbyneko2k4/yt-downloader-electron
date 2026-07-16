// DOM Elements
const urlInput = document.getElementById('video-url');
const btnAnalyze = document.getElementById('btn-analyze');
const btnAnalyzeText = btnAnalyze.querySelector('.btn-text');
const spinner = btnAnalyze.querySelector('.spinner');
const errorMessage = document.getElementById('error-message');

const previewSection = document.getElementById('preview-section');
const videoThumbnail = document.getElementById('video-thumbnail');
const videoDuration = document.getElementById('video-duration');
const videoTitle = document.getElementById('video-title');
const videoUploader = document.getElementById('video-uploader');

const typeVideo = document.getElementById('type-video');
const typeAudio = document.getElementById('type-audio');
const selectQuality = document.getElementById('select-quality');
const destPathDisplay = document.getElementById('dest-path-display');
const btnBrowse = document.getElementById('btn-browse');
const btnDownload = document.getElementById('btn-download');

const progressSection = document.getElementById('progress-section');
const downloadingTitle = document.getElementById('downloading-title');
const statSpeed = document.getElementById('stat-speed');
const statEta = document.getElementById('stat-eta');
const statSize = document.getElementById('stat-size');
const progressFill = document.getElementById('progress-fill');
const progressPercent = document.getElementById('progress-percent');
const btnCancel = document.getElementById('btn-cancel');

const btnToggleLog = document.getElementById('btn-toggle-log');
const logArrow = document.getElementById('log-arrow');
const logConsole = document.getElementById('log-console');

const historyList = document.getElementById('history-list');
const btnClearHistory = document.getElementById('btn-clear-history');

// App State
let currentVideoInfo = null;
let currentDownloadId = null;
let currentDestPath = localStorage.getItem('yt_dlp_dest_path') || '';
let history = JSON.parse(localStorage.getItem('yt_dlp_history') || '[]');

// Default qualities
const videoQualities = [
  { name: 'Chất lượng tốt nhất (Best Quality)', value: 'best' },
  { name: '1080p Full HD (MP4)', value: '1080p' },
  { name: '720p HD (MP4)', value: '720p' },
  { name: '480p SD (MP4)', value: '480p' }
];

const audioQualities = [
  { name: 'MP3 320 kbps (High Quality)', value: 'mp3-320' },
  { name: 'MP3 192 kbps (Standard)', value: 'mp3-192' },
  { name: 'WAV (Lossless Audio)', value: 'wav' },
  { name: 'M4A (AAC Audio)', value: 'm4a' }
];

// Initialize
function init() {
  // Restore destination path or set default Downloads folder
  if (!currentDestPath) {
    // Windows default Downloads folder approximation if we can't get it, 
    // but we can ask the user. We will show 'Chưa chọn thư mục...'
    destPathDisplay.textContent = 'Chưa chọn thư mục. Vui lòng bấm chọn...';
  } else {
    destPathDisplay.textContent = currentDestPath;
    destPathDisplay.title = currentDestPath;
  }

  // Populate qualities for default selection (video)
  populateQualities('video');
  renderHistory();

  // Setup Event Listeners
  btnAnalyze.addEventListener('click', analyzeUrl);
  urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') analyzeUrl();
  });

  typeVideo.addEventListener('change', () => populateQualities('video'));
  typeAudio.addEventListener('change', () => populateQualities('audio'));

  btnBrowse.addEventListener('click', selectDestDirectory);
  btnDownload.addEventListener('click', startDownload);
  btnCancel.addEventListener('click', cancelActiveDownload);

  btnToggleLog.addEventListener('click', toggleConsoleLog);
  btnClearHistory.addEventListener('click', clearAllHistory);

  // Setup IPC Subscriptions
  window.api.onDownloadProgress((data) => {
    if (data.id !== currentDownloadId) return;

    progressFill.style.width = `${data.percent}%`;
    progressPercent.textContent = `${Math.round(data.percent)}%`;
    statSpeed.textContent = `Tốc độ: ${data.speed}`;
    statEta.textContent = `Còn lại: ${data.eta}`;
    statSize.textContent = `Dung lượng: ${data.totalSize}`;

    if (data.logLine) {
      appendLog(data.logLine);
    }
  });

  window.api.onDownloadLog((data) => {
    if (data.id !== currentDownloadId) return;
    if (data.logLine) {
      appendLog(data.logLine);
    }
  });
}

// Populate quality choices
function populateQualities(type) {
  selectQuality.innerHTML = '';
  const qualities = type === 'video' ? videoQualities : audioQualities;
  qualities.forEach(q => {
    const opt = document.createElement('option');
    opt.value = q.value;
    opt.textContent = q.name;
    selectQuality.appendChild(opt);
  });
}

// Convert seconds to format HH:MM:SS
function formatDuration(seconds) {
  if (!seconds) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Helper: Show/Hide Error
function showError(msg) {
  if (msg) {
    errorMessage.textContent = msg;
    errorMessage.classList.remove('hidden');
  } else {
    errorMessage.classList.add('hidden');
    errorMessage.textContent = '';
  }
}

// IPC call to get video information
async function analyzeUrl() {
  const url = urlInput.value.trim();
  if (!url) {
    showError('Vui lòng nhập đường dẫn video hợp lệ.');
    return;
  }

  showError(null);
  btnAnalyze.disabled = true;
  btnAnalyzeText.textContent = 'Đang phân tích...';
  spinner.classList.remove('hidden');
  previewSection.classList.add('hidden');

  try {
    const result = await window.api.getVideoInfo(url);
    if (result.success) {
      currentVideoInfo = result.info;
      
      // Update UI
      videoThumbnail.src = currentVideoInfo.thumbnail || '';
      videoDuration.textContent = formatDuration(currentVideoInfo.duration);
      videoTitle.textContent = currentVideoInfo.title || 'Unknown Title';
      videoUploader.textContent = currentVideoInfo.uploader || 'Unknown Channel';
      
      previewSection.classList.remove('hidden');
    } else {
      showError('Không lấy được thông tin video.');
    }
  } catch (error) {
    console.error(error);
    showError(error.message || 'Lỗi khi phân tích đường dẫn. Vui lòng kiểm tra lại URL hoặc cài đặt yt-dlp.');
  } finally {
    btnAnalyze.disabled = false;
    btnAnalyzeText.textContent = 'Phân tích';
    spinner.classList.add('hidden');
  }
}

// Select Destination Folder dialog
async function selectDestDirectory() {
  try {
    const path = await window.api.selectDirectory();
    if (path) {
      currentDestPath = path;
      destPathDisplay.textContent = path;
      destPathDisplay.title = path;
      localStorage.setItem('yt_dlp_dest_path', path);
      showError(null); // Clear errors like "Vui lòng chọn thư mục lưu"
    }
  } catch (err) {
    console.error(err);
  }
}

// Start Download process
async function startDownload() {
  if (!currentVideoInfo) return;

  if (!currentDestPath) {
    showError('Vui lòng chọn thư mục lưu tệp trước khi tải xuống.');
    btnBrowse.focus();
    return;
  }

  showError(null);
  const formatType = typeVideo.checked ? 'video' : 'audio';
  const quality = selectQuality.value;
  const url = currentVideoInfo.webpage_url;

  currentDownloadId = Date.now().toString();

  // Update Progress UI
  downloadingTitle.textContent = `Đang tải: ${currentVideoInfo.title}`;
  progressFill.style.width = '0%';
  progressPercent.textContent = '0%';
  statSpeed.textContent = 'Tốc độ: Đang kết nối...';
  statEta.textContent = 'Còn lại: --:--';
  statSize.textContent = 'Dung lượng: -- MB';
  logConsole.innerHTML = '';
  
  progressSection.classList.remove('hidden');
  previewSection.classList.add('hidden');
  btnAnalyze.disabled = true;

  appendLog(`[Hệ thống] Bắt đầu tải video: ${currentVideoInfo.title}`);
  appendLog(`[Hệ thống] Định dạng: ${formatType === 'video' ? 'Video (MP4)' : 'Audio (Nhạc)'}`);
  appendLog(`[Hệ thống] Chất lượng chọn: ${quality}`);
  appendLog(`[Hệ thống] Thư mục lưu: ${currentDestPath}`);

  try {
    const result = await window.api.downloadVideo({
      id: currentDownloadId,
      url,
      formatType,
      quality,
      destDir: currentDestPath
    });

    if (result.success) {
      appendLog('[Hệ thống] Tải xuống hoàn tất thành công!');
      
      // Save item to history
      const historyItem = {
        id: currentDownloadId,
        title: currentVideoInfo.title,
        type: formatType,
        quality: selectQuality.options[selectQuality.selectedIndex].text,
        destDir: currentDestPath,
        date: new Date().toLocaleString('vi-VN')
      };
      
      history.unshift(historyItem);
      localStorage.setItem('yt_dlp_history', JSON.stringify(history));
      renderHistory();

      // Show notification/alert
      new Notification('YT-DLP Downloader', {
        body: `Đã tải xong: ${currentVideoInfo.title}`
      });

      // Clear URL and reset UI after a delay
      setTimeout(() => {
        progressSection.classList.add('hidden');
        urlInput.value = '';
        currentVideoInfo = null;
        btnAnalyze.disabled = false;
      }, 1500);

    }
  } catch (error) {
    appendLog(`[Lỗi] ${error.message}`);
    showError(`Lỗi tải xuống: ${error.message}`);
    progressSection.classList.add('hidden');
    previewSection.classList.remove('hidden');
    btnAnalyze.disabled = false;
  }
}

// Cancel current download
async function cancelActiveDownload() {
  if (!currentDownloadId) return;

  appendLog('[Hệ thống] Đang hủy tiến trình tải...');
  try {
    const canceled = await window.api.cancelDownload(currentDownloadId);
    if (canceled) {
      appendLog('[Hệ thống] Đã hủy tải xuống bởi người dùng.');
      showError('Đã hủy tải xuống.');
      
      setTimeout(() => {
        progressSection.classList.add('hidden');
        previewSection.classList.remove('hidden');
        btnAnalyze.disabled = false;
      }, 1000);
    }
  } catch (err) {
    console.error(err);
    appendLog(`[Lỗi khi hủy] ${err.message}`);
  }
}

// Append logs to terminal element
function appendLog(line) {
  const lineEl = document.createElement('div');
  lineEl.textContent = line;
  logConsole.appendChild(lineEl);
  // Auto scroll to bottom
  logConsole.scrollTop = logConsole.scrollHeight;
}

// Toggle Logs collapsible
function toggleConsoleLog() {
  logConsole.classList.toggle('hidden');
  logArrow.classList.toggle('open');
}

// Render history
function renderHistory() {
  if (history.length === 0) {
    historyList.innerHTML = '<div class="empty-history">Chưa có tệp nào được tải xuống gần đây.</div>';
    return;
  }

  historyList.innerHTML = '';
  history.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'history-item';
    
    const isAudio = item.type === 'audio';

    itemEl.innerHTML = `
      <div class="history-item-left">
        <div class="history-icon-wrapper ${isAudio ? 'audio' : 'video'}">
          ${isAudio ? 
            `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>` : 
            `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
              <line x1="7" y1="2" x2="7" y2="22"></line>
              <line x1="17" y1="2" x2="17" y2="22"></line>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <line x1="2" y1="7" x2="7" y2="7"></line>
              <line x1="2" y1="17" x2="7" y2="17"></line>
              <line x1="17" y1="17" x2="22" y2="17"></line>
              <line x1="17" y1="7" x2="22" y2="7"></line>
            </svg>`
          }
        </div>
        <div class="history-item-details">
          <div class="history-item-title" title="${item.title}">${item.title}</div>
          <div class="history-item-meta">${item.quality} • Lưu vào: ${item.destDir} • ${item.date}</div>
        </div>
      </div>
      <div class="history-item-actions">
        <button class="btn btn-secondary btn-action-small btn-open-folder" data-dir="${item.destDir}">Mở thư mục</button>
        <button class="btn btn-danger btn-action-small btn-delete-history" data-id="${item.id}">Xóa</button>
      </div>
    `;

    // Bind item actions
    itemEl.querySelector('.btn-open-folder').addEventListener('click', () => {
      window.api.openFolder(item.destDir);
    });

    itemEl.querySelector('.btn-delete-history').addEventListener('click', () => {
      deleteHistoryItem(item.id);
    });

    historyList.appendChild(itemEl);
  });
}

// Delete single history item
function deleteHistoryItem(id) {
  history = history.filter(item => item.id !== id);
  localStorage.setItem('yt_dlp_history', JSON.stringify(history));
  renderHistory();
}

// Clear all history
function clearAllHistory() {
  if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử tải xuống không?')) {
    history = [];
    localStorage.removeItem('yt_dlp_history');
    renderHistory();
  }
}

// Run init
document.addEventListener('DOMContentLoaded', init);
