// mini.js – Full implementation for the mini quick-download window

const api = window.api;

// ===== State =====
let currentFormat  = 'video';
let currentQuality = 'best';
let mediaInfo      = null;
let activeDownloads = {}; // id -> meta object
let history        = [];  // from main app via IPC sync

// ===== DOM Refs =====
const urlInput      = document.getElementById('urlInput');
const btnPaste      = document.getElementById('btnPaste');
const btnAnalyze    = document.getElementById('btnAnalyze');
const analyzeLabel  = document.getElementById('analyzeLabel');
const btnDownload   = document.getElementById('btnDownload');
const mediaInfoCard = document.getElementById('mediaInfoCard');
const mediaThumbnail= document.getElementById('mediaThumbnail');
const mediaTitle    = document.getElementById('mediaTitle');
const mediaArtist   = document.getElementById('mediaArtist');
const mediaTypeBadge= document.getElementById('mediaTypeBadge');
const playlistInfo  = document.getElementById('playlistInfo');
const playlistCount = document.getElementById('playlistCount');
const miniError     = document.getElementById('miniError');
const activeLabel   = document.getElementById('activeLabel');
const activeList    = document.getElementById('activeDownloadsList');
const filesSearch   = document.getElementById('filesSearch');
const filesFilter   = document.getElementById('filesFilter');
const filesList     = document.getElementById('filesList');
const filesEmpty    = document.getElementById('filesEmpty');
const filesBadge    = document.getElementById('filesBadge');
const tabs          = document.querySelectorAll('.mini-tab');
const panels        = document.querySelectorAll('.mini-panel');
const fmtBtns       = document.querySelectorAll('.fmt-btn');

// ===== Tab Switching =====
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const panel = document.getElementById('panel' + capitalize(tab.dataset.tab));
    if (panel) panel.classList.add('active');
    if (tab.dataset.tab === 'files') renderFiles();
  });
});
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ===== Format buttons =====
fmtBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    fmtBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFormat = btn.dataset.fmt;
    // Reset quality
    currentQuality = currentFormat === 'audio' ? 'mp3-192' : 'best';
    updateTypeBadge();
  });
});
function updateTypeBadge() {
  const labels = { video: 'Video', audio: 'Audio', thumbnail: 'Thumbnail' };
  if (mediaTypeBadge) mediaTypeBadge.textContent = labels[currentFormat] || 'Video';
}

// ===== Window Controls =====
document.getElementById('btnClose').addEventListener('click', () => {
  if (api) api.miniClose();
});
document.getElementById('btnShowMain').addEventListener('click', () => {
  if (api) api.miniShowMain();
});

// ===== Paste from clipboard =====
btnPaste.addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text && text.trim()) {
      urlInput.value = text.trim();
      resetMediaState();
    }
  } catch (e) { console.error('Paste failed', e); }
});

function resetMediaState() {
  mediaInfo = null;
  showError('');
  btnDownload.style.display = 'none';
  mediaInfoCard.style.display = 'none';
}

// ===== Analyze =====
btnAnalyze.addEventListener('click', () => handleAnalyze());
urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleAnalyze(); });

async function handleAnalyze() {
  const rawUrl = urlInput.value.trim();
  if (!rawUrl) return;

  setAnalyzing(true);
  showError('');
  mediaInfoCard.style.display = 'none';
  btnDownload.style.display = 'none';
  mediaInfo = null;

  try {
    let queryToSend = rawUrl;
    const isDirectUrl = /^https?:\/\//i.test(rawUrl);
    if (!isDirectUrl) {
      queryToSend = `ytsearch20:${rawUrl}`;
    }

    const res = api ? await api.getVideoInfo(queryToSend) : null;
    if (res && res.success) {
      mediaInfo = res;
      // Auto-detect format for SoundCloud
      if (rawUrl.includes('soundcloud.com') && currentFormat !== 'audio') {
        currentFormat = 'audio';
        currentQuality = 'mp3-192';
        fmtBtns.forEach(b => {
          b.classList.toggle('active', b.dataset.fmt === 'audio');
        });
      }
      renderMediaInfo();
      btnDownload.style.display = 'flex';
    } else {
      showError('Could not fetch media info. Check the URL and try again.');
    }
  } catch (err) {
    showError(err.message || 'Error fetching info.');
  } finally {
    setAnalyzing(false);
  }
}

function renderMediaInfo() {
  if (!mediaInfo || !mediaInfo.info) return;
  const info = mediaInfo.info;
  mediaInfoCard.style.display = 'block';

  mediaTitle.textContent  = info.title || '—';
  mediaArtist.textContent = info.uploader || '—';

  if (info.thumbnail) {
    mediaThumbnail.src = info.thumbnail;
    mediaThumbnail.style.display = 'block';
    mediaThumbnail.onerror = () => { mediaThumbnail.style.display = 'none'; };
  } else {
    mediaThumbnail.style.display = 'none';
  }

  if (mediaInfo.isPlaylist && info.entriesCount) {
    playlistInfo.style.display = 'flex';
    playlistCount.textContent  = `${info.entriesCount} tracks`;
  } else {
    playlistInfo.style.display = 'none';
  }

  updateTypeBadge();
}

function setAnalyzing(v) {
  btnAnalyze.disabled = v;
  if (analyzeLabel) analyzeLabel.textContent = v ? 'Analyzing…' : 'Analyze';
}

function showError(msg) {
  if (!miniError) return;
  if (msg) {
    miniError.textContent = msg;
    miniError.style.display = 'block';
  } else {
    miniError.style.display = 'none';
  }
}

// ===== Download =====
btnDownload.addEventListener('click', () => startDownload());

async function startDownload() {
  if (!mediaInfo || !api) return;

  const info = mediaInfo.info;
  btnDownload.disabled = true;

  try {
    const destDir = await api.getDownloadsPath();
    const id = `mini_${Date.now()}`;

    const options = {
      id,
      url: urlInput.value.trim(),
      formatType: currentFormat,
      quality: currentQuality,
      destDir,
      isPlaylist: !!(mediaInfo.isPlaylist && !mediaInfo.isSearch),
      playlistTitle: mediaInfo.isPlaylist ? info.title : null,
      playlistEntries: (mediaInfo.isPlaylist && info.entries) ? info.entries : null,
      mediaTitle: info.title || 'media',
      uploader: info.uploader || '',
      thumbnail: info.thumbnail || '',
      duration: info.duration || null,
      embedMetadata: true,
      embedThumbnail: currentFormat === 'audio'
    };

    // Relay to main renderer's queue via main process IPC
    await api.miniStartDownload(options);

    // Reset UI
    resetMediaState();
    urlInput.value = '';
    showError('');
  } catch (err) {
    showError(err.message || 'Download failed.');
  } finally {
    btnDownload.disabled = false;
  }
}

// ===== IPC: Active download sync from main process =====
if (api && api.onMiniActiveUpdate) {
  api.onMiniActiveUpdate((data) => {
    activeDownloads[data.id] = data;
    renderActiveDownloads();
  });
}

if (api && api.onMiniActiveRemoved) {
  api.onMiniActiveRemoved((data) => {
    delete activeDownloads[data.id];
    renderActiveDownloads();
    // Refresh files tab since a download completed
    if (api.miniRequestHistory) {
      api.miniRequestHistory().then(hist => {
        history = hist || [];
        updateFilesBadge();
      }).catch(() => {});
    }
  });
}

// Also listen to download-progress for finer-grained percent updates
if (api && api.onDownloadProgress) {
  api.onDownloadProgress((data) => {
    if (activeDownloads[data.id]) {
      activeDownloads[data.id].percent = data.percent || 0;
      activeDownloads[data.id].speed   = data.speed || '—';
      activeDownloads[data.id].eta     = data.eta   || '—';
      renderActiveDownloads();
    }
  });
}

if (api && api.onDownloadItemChange) {
  api.onDownloadItemChange((data) => {
    if (activeDownloads[data.id]) {
      activeDownloads[data.id].currentItem = data.currentItem;
      activeDownloads[data.id].totalItems  = data.totalItems;
      renderActiveDownloads();
    }
  });
}

// ===== IPC: History sync from main app =====
if (api && api.onSyncHistory) {
  api.onSyncHistory((hist) => {
    history = hist || [];
    updateFilesBadge();
    // If files panel is open, re-render
    if (document.getElementById('panelFiles')?.classList.contains('active')) {
      renderFiles();
    }
  });
}

// ===== Render active downloads =====
function renderActiveDownloads() {
  const keys = Object.keys(activeDownloads);
  if (activeLabel) activeLabel.style.display = keys.length > 0 ? 'block' : 'none';

  activeList.innerHTML = '';
  keys.forEach(id => {
    const dl = activeDownloads[id];
    const pct = Math.min(100, Math.max(0, dl.percent || 0));
    const pctStr = pct.toFixed(1);
    const isPlaylist = dl.isPlaylist;

    const item = document.createElement('div');
    item.className = 'active-dl-item';

    const thumb = dl.thumbnail
      ? `<img class="active-dl-thumb" src="${escHtml(dl.thumbnail)}" onerror="this.style.display='none'" />`
      : `<div class="active-dl-thumb no-thumb">${fmtIcon(dl.formatType, 16)}</div>`;

    const playlistBadge = isPlaylist && dl.totalItems
      ? `<span class="playlist-chip">${dl.currentItem || 1}/${dl.totalItems}</span>`
      : '';

    item.innerHTML = `
      <div class="active-dl-header">
        ${thumb}
        <div class="active-dl-meta">
          <div class="active-dl-title">${escHtml(dl.title || 'Downloading…')}</div>
          <div class="active-dl-sub">${escHtml(dl.uploader || '')}${playlistBadge}</div>
        </div>
        <div class="spin-wrap">
          <svg class="spin-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="url(#spinGrad)" stroke-width="2.5">
            <defs>
              <linearGradient id="spinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#ec4899"/>
                <stop offset="100%" style="stop-color:#8b5cf6"/>
              </linearGradient>
            </defs>
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25"/>
            <path d="M21 12a9 9 0 00-9-9" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
      <div class="active-dl-progress-wrap">
        <div class="active-dl-progress-bar" style="width:${pct}%"></div>
      </div>
      <div class="active-dl-stats">
        <span class="stat-pct">${pctStr}%</span>
        <span class="stat-speed">${escHtml(dl.speed || '—')}</span>
        <span class="stat-eta">ETA ${escHtml(dl.eta || '—')}</span>
      </div>
    `;
    activeList.appendChild(item);
  });
}

// ===== Files Tab =====
filesSearch.addEventListener('input', renderFiles);
filesFilter.addEventListener('change', renderFiles);

function updateFilesBadge() {
  const completed = history.filter(d => !d.isCancelled).length;
  if (filesBadge) {
    filesBadge.textContent = completed;
    filesBadge.style.display = completed > 0 ? 'inline-flex' : 'none';
  }
}

function renderFiles() {
  const term   = (filesSearch.value || '').toLowerCase().trim();
  const filter = filesFilter.value || 'all';

  let items = history.slice();

  if (term) {
    items = items.filter(d =>
      (d.title  || '').toLowerCase().includes(term) ||
      (d.uploader || '').toLowerCase().includes(term) ||
      (d.filePath || '').toLowerCase().includes(term)
    );
  }
  if (filter !== 'all') {
    items = items.filter(d => d.formatType === filter);
  }

  // Most recent first
  items.sort((a, b) => (b.downloadedAt || 0) - (a.downloadedAt || 0));

  filesList.innerHTML = '';

  if (items.length === 0) {
    filesEmpty.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.3">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
      <span>${term || filter !== 'all' ? 'No results' : 'No downloads yet'}</span>
    `;
    filesList.appendChild(filesEmpty);
    return;
  }

  items.forEach(d => {
    const cls   = formatClass(d.formatType);
    const icon  = fmtIcon(d.formatType, 15);
    const title = d.title || d.mediaTitle || 'Unknown';
    const sub   = [d.uploader, d.formatType].filter(Boolean).join(' · ');
    const status = d.isCancelled ? 'cancelled' : 'completed';
    const statusLabel = d.isCancelled ? 'Cancelled' : 'Done';
    const folderPath = d.folderPath || d.destDir || d.filePath;
    const filePath   = d.filePath || folderPath;
    const isPlaylist = d.isPlaylist;

    const el = document.createElement('div');
    el.className = 'file-item';
    el.draggable = !d.isCancelled;
    el.innerHTML = `
      <div class="file-item-icon ${cls}">${icon}</div>
      <div class="file-item-meta">
        <div class="file-item-name">${escHtml(title)}</div>
        <div class="file-item-sub">${escHtml(sub)}${isPlaylist ? ' <span class="playlist-chip-sm">Playlist</span>' : ''}</div>
      </div>
      <span class="file-item-status ${status}">${statusLabel}</span>
      <div class="file-item-actions">
        <button class="file-action-btn" title="Open folder" data-action="folder">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        </button>
        <button class="file-action-btn" title="Copy path" data-action="copy">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
      </div>
    `;

    // Drag to desktop
    if (!d.isCancelled) {
      el.addEventListener('dragstart', e => {
        e.preventDefault();
        const target = filePath || folderPath;
        if (api && api.startDrag && target) {
          if (d.isPlaylist && d.downloadedFiles && d.downloadedFiles.length > 0) {
            api.startDrag(d.downloadedFiles);
          } else {
            api.startDrag(target);
          }
        }
      });
    }

    // Action buttons
    el.querySelectorAll('.file-action-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const action = btn.dataset.action;
        if (action === 'folder' && api && api.openFolder && folderPath) api.openFolder(folderPath);
        if (action === 'copy'   && api && api.copyFile   && filePath)   api.copyFile(filePath);
      });
    });

    // Open on click
    el.addEventListener('click', () => {
      if (api && api.openFile && filePath) api.openFile(filePath);
    });

    filesList.appendChild(el);
  });
}

// ===== Helpers =====
function formatClass(fmt) {
  if (fmt === 'video') return 'video';
  if (fmt === 'audio') return 'audio';
  if (fmt === 'thumbnail') return 'thumbnail';
  return 'other';
}

function fmtIcon(fmt, size = 15) {
  const s = size;
  if (fmt === 'video')     return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`;
  if (fmt === 'audio')     return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
  if (fmt === 'thumbnail') return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ===== Initialization =====
async function init() {
  // Load existing active downloads from main process
  if (api && api.miniGetDownloadsMeta) {
    try {
      const metas = await api.miniGetDownloadsMeta();
      if (Array.isArray(metas)) {
        metas.forEach(m => { activeDownloads[m.id] = m; });
        renderActiveDownloads();
      }
    } catch (e) {}
  }

  // Load download history
  if (api && api.miniRequestHistory) {
    try {
      const hist = await api.miniRequestHistory();
      if (Array.isArray(hist)) {
        history = hist;
        updateFilesBadge();
      }
    } catch (e) {}
  }

  renderFiles();
}

init();
