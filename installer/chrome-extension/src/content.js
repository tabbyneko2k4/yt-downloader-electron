/**
 * Multi-Platform Universal Quick Download & Share Injector Content Script
 * Supports:
 * 1. YouTube Watch (https://www.youtube.com/watch?v=...)
 * 2. YouTube Shorts (https://www.youtube.com/shorts/...)
 * 3. SoundCloud Track Player & Sound Badges (https://soundcloud.com/...)
 * 4. Facebook Reels (https://www.facebook.com/reel/...)
 */

const API_BASE = 'http://127.0.0.1:38472';

// Helper function to extract single clean video URL by stripping playlist params
function getCleanSingleVideoUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;
  try {
    const urlObj = new URL(rawUrl.trim());
    const hostname = urlObj.hostname.toLowerCase();
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      urlObj.searchParams.delete('list');
      urlObj.searchParams.delete('index');
      urlObj.searchParams.delete('start_radio');
      urlObj.searchParams.delete('pp');
      urlObj.searchParams.delete('playnext');
      return urlObj.toString();
    }
    if (hostname.includes('soundcloud.com')) {
      return rawUrl.split('?')[0];
    }
  } catch (e) {}
  return rawUrl;
}

// i18n Auto Detect
function getLang() {
  const l = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
  return l.startsWith('vi') ? 'vi' : 'en';
}

const translations = {
  vi: {
    quickDownload: '⚡ Tải Nhanh',
    copyLink: 'Sao chép Share Link đơn lẻ',
    sending: '⏳ Đang gửi...',
    sent: '✓ Đã gửi sang App!',
    offline: '📋 App offline - Đã copy link!',
    formatTitle: 'Chọn Định Dạng Tải:',
    videoBest: '🎥 Video MP4 (Chất lượng cao nhất)',
    video1080: '🎥 Video 1080p Full HD',
    video720: '🎥 Video 720p HD',
    audio320: '🎵 MP3 320kbps (Âm thanh cao nhất)',
    audio192: '🎵 MP3 192kbps (Âm thanh chuẩn)'
  },
  en: {
    quickDownload: '⚡ Quick Download',
    copyLink: 'Copy Single Link',
    sending: '⏳ Sending...',
    sent: '✓ Sent to App!',
    offline: '📋 App offline - Link Copied!',
    formatTitle: 'Select Download Format:',
    videoBest: '🎥 MP4 Video (Best Quality)',
    video1080: '🎥 1080p Full HD Video',
    video720: '🎥 720p HD Video',
    audio320: '🎵 MP3 320kbps (Best Audio)',
    audio192: '🎵 MP3 192kbps (Standard Audio)'
  }
};

const t = (key) => (translations[getLang()] && translations[getLang()][key]) || translations.en[key] || key;

// Create Fixed Positioned Dropdown Popover
function createPopover(isDarkMode, formatOptions, onSelect) {
  const popover = document.createElement('div');
  popover.style.cssText = `
    display: none;
    position: fixed;
    z-index: 999999;
    width: 240px;
    padding: 8px;
    border-radius: 12px;
    background: ${isDarkMode ? '#0f172a' : '#ffffff'};
    color: ${isDarkMode ? '#f8fafc' : '#0f172a'};
    border: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'};
    box-shadow: 0 12px 30px rgba(0,0,0,0.35);
    flex-direction: column;
    gap: 4px;
    font-family: system-ui, -apple-system, sans-serif;
  `;

  const popoverHeader = document.createElement('div');
  popoverHeader.style.cssText = `
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 4px 8px;
    color: ${isDarkMode ? '#94a3b8' : '#64748b'};
  `;
  popoverHeader.textContent = t('formatTitle');
  popover.appendChild(popoverHeader);

  formatOptions.forEach(opt => {
    const item = document.createElement('button');
    item.type = 'button';
    item.textContent = opt.label;
    item.style.cssText = `
      display: block;
      width: 100%;
      text-align: left;
      padding: 7px 10px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: inherit;
      cursor: pointer;
      transition: background 0.15s ease;
    `;
    item.onmouseenter = () => {
      item.style.background = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)';
    };
    item.onmouseleave = () => {
      item.style.background = 'transparent';
    };
    item.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      onSelect(opt.formatType, opt.quality);
    };
    popover.appendChild(item);
  });

  document.body.appendChild(popover);
  return popover;
}

// --------------------------------------------------------------------------
// 1. YOUTUBE WATCH INJECTION
// --------------------------------------------------------------------------
function injectYouTubeDownloadButton() {
  if (!window.location.href.includes('youtube.com/watch')) return;

  const titleContainer = document.querySelector('ytd-watch-metadata #title h1') || 
                         document.querySelector('#title.ytd-watch-metadata') ||
                         document.querySelector('h1.ytd-watch-metadata');

  if (!titleContainer) return;
  if (document.getElementById('yt-downloader-companion-btn')) return;

  const isDarkMode = document.documentElement.hasAttribute('dark') || 
                     document.documentElement.getAttribute('data-theme') === 'dark' ||
                     window.matchMedia('(prefers-color-scheme: dark)').matches;

  const rawTitle = titleContainer.textContent.trim() || document.title.replace(/- YouTube$/, '').trim();

  const btnWrapper = document.createElement('span');
  btnWrapper.id = 'yt-downloader-companion-btn';
  btnWrapper.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-left: 12px;
    vertical-align: middle;
    position: relative;
    font-size: 13px;
    font-weight: 700;
    font-family: Roboto, Arial, sans-serif;
  `;

  const dlBtn = document.createElement('button');
  dlBtn.type = 'button';
  dlBtn.title = t('quickDownload');
  dlBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    <span>${t('quickDownload')}</span>
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left:2px;"><path d="m6 9 6 6 6-6"/></svg>
  `;
  dlBtn.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    border-radius: 18px;
    background: linear-gradient(135deg, #ec4899, #d946ef);
    color: #ffffff;
    border: none;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(236, 72, 153, 0.4);
    transition: all 0.2s ease;
  `;

  const formatOptions = [
    { formatType: 'video', quality: 'best', label: t('videoBest') },
    { formatType: 'video', quality: '1080p', label: t('video1080') },
    { formatType: 'video', quality: '720p', label: t('video720') },
    { formatType: 'audio', quality: 'mp3-320', label: t('audio320') },
    { formatType: 'audio', quality: 'mp3-192', label: t('audio192') }
  ];

  const popover = createPopover(isDarkMode, formatOptions, async (fmt, qual) => {
    popover.style.display = 'none';
    const singleVideoUrl = getCleanSingleVideoUrl(window.location.href);
    const currentTitle = titleContainer.textContent.trim() || rawTitle;

    dlBtn.textContent = t('sending');

    try {
      const res = await fetch(`${API_BASE}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: singleVideoUrl, mediaTitle: currentTitle, formatType: fmt, quality: qual })
      });
      if (res.ok) {
        dlBtn.style.background = '#10b981';
        dlBtn.textContent = t('sent');
      } else { throw new Error('Server error'); }
    } catch (err) {
      navigator.clipboard.writeText(singleVideoUrl);
      dlBtn.style.background = '#f59e0b';
      dlBtn.textContent = t('offline');
    }

    setTimeout(() => {
      dlBtn.style.background = 'linear-gradient(135deg, #ec4899, #d946ef)';
      dlBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>${t('quickDownload')}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left:2px;"><path d="m6 9 6 6 6-6"/></svg>
      `;
    }, 2500);
  });

  dlBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isVisible = popover.style.display === 'flex';
    if (isVisible) popover.style.display = 'none';
    else {
      const rect = dlBtn.getBoundingClientRect();
      popover.style.top = `${rect.bottom + 6}px`;
      popover.style.left = `${rect.left}px`;
      popover.style.display = 'flex';
    }
  };

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.title = t('copyLink');
  copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
  copyBtn.style.cssText = `
    display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%;
    background: ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)'}; color: currentColor;
    border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.12)'}; cursor: pointer; transition: all 0.2s ease;
  `;
  copyBtn.onclick = (e) => {
    e.preventDefault(); e.stopPropagation();
    const cleanUrl = getCleanSingleVideoUrl(window.location.href);
    navigator.clipboard.writeText(cleanUrl);
    copyBtn.style.background = '#10b981'; copyBtn.style.color = '#ffffff';
    setTimeout(() => {
      copyBtn.style.background = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';
      copyBtn.style.color = 'currentColor';
    }, 1500);
  };

  btnWrapper.appendChild(dlBtn);
  btnWrapper.appendChild(copyBtn);
  titleContainer.appendChild(btnWrapper);
}

// --------------------------------------------------------------------------
// 2. YOUTUBE SHORTS INJECTION (https://www.youtube.com/shorts/...)
// --------------------------------------------------------------------------
function injectYouTubeShortsButton() {
  if (!window.location.href.includes('youtube.com/shorts/')) return;

  // Find active reel or fallback to any reel container
  const activeReel = document.querySelector('ytd-reel-video-renderer[is-active]') ||
                     document.querySelector('ytd-reel-video-renderer') ||
                     document.querySelector('#shorts-container');

  if (!activeReel) return;

  // Check if button already injected in this reel
  if (activeReel.querySelector('#shorts-downloader-companion-btn') || document.getElementById('shorts-downloader-companion-btn')) return;

  // Find YouTube Shorts Like Button container with robust fallbacks
  const likeBtnContainer = activeReel.querySelector('ytd-like-button-renderer') ||
                           activeReel.querySelector('#like-button') ||
                           activeReel.querySelector('#actions ytd-toggle-button-renderer') ||
                           activeReel.querySelector('#actions #button-shape') ||
                           activeReel.querySelector('#actions');

  if (!likeBtnContainer) return;

  const isDarkMode = true; // YouTube Shorts is dark interface

  const btnWrapper = document.createElement('div');
  btnWrapper.id = 'shorts-downloader-companion-btn';
  btnWrapper.style.cssText = `
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    margin-bottom: 16px; position: relative; gap: 8px;
  `;

  const dlBtn = document.createElement('button');
  dlBtn.type = 'button';
  dlBtn.title = t('quickDownload');
  dlBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
  dlBtn.style.cssText = `
    display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 50%;
    background: linear-gradient(135deg, #ec4899, #d946ef); color: #ffffff; border: none; cursor: pointer;
    box-shadow: 0 4px 12px rgba(236, 72, 153, 0.5); transition: transform 0.2s ease;
  `;

  const formatOptions = [
    { formatType: 'video', quality: 'best', label: t('videoBest') },
    { formatType: 'audio', quality: 'mp3-320', label: t('audio320') }
  ];

  const popover = createPopover(isDarkMode, formatOptions, async (fmt, qual) => {
    popover.style.display = 'none';
    const shortUrl = window.location.href.split('?')[0];
    const titleEl = activeReel.querySelector('h2.title') || activeReel.querySelector('#video-title');
    const mediaTitle = titleEl ? titleEl.textContent.trim() : 'YouTube Short';

    try {
      const res = await fetch(`${API_BASE}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: shortUrl, mediaTitle, formatType: fmt, quality: qual })
      });
      if (res.ok) {
        dlBtn.style.background = '#10b981';
      } else throw new Error();
    } catch (e) {
      navigator.clipboard.writeText(shortUrl);
      dlBtn.style.background = '#f59e0b';
    }
    setTimeout(() => { dlBtn.style.background = 'linear-gradient(135deg, #ec4899, #d946ef)'; }, 2500);
  });

  dlBtn.onclick = (e) => {
    e.preventDefault(); e.stopPropagation();
    const isVisible = popover.style.display === 'flex';
    if (isVisible) popover.style.display = 'none';
    else {
      const rect = dlBtn.getBoundingClientRect();
      popover.style.top = `${rect.top - 110}px`;
      popover.style.left = `${rect.left - 250}px`;
      popover.style.display = 'flex';
    }
  };

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.title = t('copyLink');
  copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
  copyBtn.style.cssText = `
    display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%;
    background: rgba(255, 255, 255, 0.2); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.3); cursor: pointer;
  `;
  copyBtn.onclick = (e) => {
    e.preventDefault(); e.stopPropagation();
    const shortUrl = window.location.href.split('?')[0];
    navigator.clipboard.writeText(shortUrl);
    copyBtn.style.background = '#10b981';
    setTimeout(() => { copyBtn.style.background = 'rgba(255, 255, 255, 0.2)'; }, 1500);
  };

  btnWrapper.appendChild(dlBtn);
  btnWrapper.appendChild(copyBtn);

  // Insert right ABOVE the Like button container
  likeBtnContainer.parentNode.insertBefore(btnWrapper, likeBtnContainer);
}

// --------------------------------------------------------------------------
// 3. SOUNDCLOUD INJECTION (soundcloud.com)
// --------------------------------------------------------------------------
function injectSoundCloudButton() {
  if (!window.location.hostname.includes('soundcloud.com')) return;

  const actionsContainer = document.querySelector('.playbackSoundBadge__actions') || 
                           document.querySelector('.playControls__soundBadge');

  if (!actionsContainer) return;
  if (document.getElementById('sc-downloader-companion-btn')) return;

  const isDarkMode = document.body.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches;

  const btnWrapper = document.createElement('div');
  btnWrapper.id = 'sc-downloader-companion-btn';
  btnWrapper.style.cssText = `
    display: inline-flex; align-items: center; gap: 6px; margin-left: 6px; position: relative; vertical-align: middle;
  `;

  const dlBtn = document.createElement('button');
  dlBtn.type = 'button';
  dlBtn.title = t('quickDownload');
  dlBtn.innerHTML = `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    <span>${t('quickDownload')}</span>
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
  `;
  dlBtn.style.cssText = `
    display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 14px;
    background: linear-gradient(135deg, #ff5500, #ff7700); color: #ffffff; border: none; cursor: pointer;
    font-size: 11px; font-weight: 700; box-shadow: 0 2px 6px rgba(255, 85, 0, 0.4);
  `;

  const formatOptions = [
    { formatType: 'audio', quality: 'mp3-320', label: t('audio320') },
    { formatType: 'audio', quality: 'mp3-192', label: t('audio192') }
  ];

  const popover = createPopover(isDarkMode, formatOptions, async (fmt, qual) => {
    popover.style.display = 'none';
    const playbarLink = document.querySelector('.playControls__soundBadge a.playbackSoundBadge__title');
    let playingUrl = window.location.href;
    let mediaTitle = document.title;
    if (playbarLink) {
      const href = playbarLink.getAttribute('href');
      if (href) playingUrl = href.startsWith('http') ? href : `https://soundcloud.com${href}`;
      mediaTitle = playbarLink.getAttribute('title') || playbarLink.textContent.trim() || mediaTitle;
    }
    const cleanUrl = playingUrl.split('?')[0];

    try {
      const res = await fetch(`${API_BASE}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl, mediaTitle, formatType: fmt, quality: qual })
      });
      if (res.ok) dlBtn.style.background = '#10b981';
      else throw new Error();
    } catch (e) {
      navigator.clipboard.writeText(cleanUrl);
      dlBtn.style.background = '#f59e0b';
    }
    setTimeout(() => { dlBtn.style.background = 'linear-gradient(135deg, #ff5500, #ff7700)'; }, 2500);
  });

  dlBtn.onclick = (e) => {
    e.preventDefault(); e.stopPropagation();
    const isVisible = popover.style.display === 'flex';
    if (isVisible) popover.style.display = 'none';
    else {
      const rect = dlBtn.getBoundingClientRect();
      popover.style.top = `${rect.top - 100}px`;
      popover.style.left = `${rect.left}px`;
      popover.style.display = 'flex';
    }
  };

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.title = t('copyLink');
  copyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
  copyBtn.style.cssText = `
    display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%;
    background: rgba(255, 85, 0, 0.15); color: #ff5500; border: 1px solid rgba(255, 85, 0, 0.3); cursor: pointer;
  `;
  copyBtn.onclick = (e) => {
    e.preventDefault(); e.stopPropagation();
    const playbarLink = document.querySelector('.playControls__soundBadge a.playbackSoundBadge__title');
    let playingUrl = window.location.href;
    if (playbarLink) {
      const href = playbarLink.getAttribute('href');
      if (href) playingUrl = href.startsWith('http') ? href : `https://soundcloud.com${href}`;
    }
    const cleanUrl = playingUrl.split('?')[0];
    navigator.clipboard.writeText(cleanUrl);
    copyBtn.style.background = '#10b981'; copyBtn.style.color = '#fff';
    setTimeout(() => { copyBtn.style.background = 'rgba(255, 85, 0, 0.15)'; copyBtn.style.color = '#ff5500'; }, 1500);
  };

  btnWrapper.appendChild(dlBtn);
  btnWrapper.appendChild(copyBtn);
  actionsContainer.appendChild(btnWrapper);
}

// --------------------------------------------------------------------------
// 4. FACEBOOK REELS INJECTION (facebook.com/reel/...)
// --------------------------------------------------------------------------
function injectFacebookReelsButton() {
  if (!window.location.href.includes('facebook.com/reel/')) return;

  const reelContainer = document.querySelector('[role="main"]') || document.body;
  if (!reelContainer) return;
  if (document.getElementById('fb-downloader-companion-btn')) return;

  const isDarkMode = document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches;

  const btnWrapper = document.createElement('div');
  btnWrapper.id = 'fb-downloader-companion-btn';
  btnWrapper.style.cssText = `
    position: fixed; bottom: 80px; right: 24px; z-index: 99999;
    display: flex; flex-direction: column; align-items: center; gap: 8px;
  `;

  const dlBtn = document.createElement('button');
  dlBtn.type = 'button';
  dlBtn.title = t('quickDownload');
  dlBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
  `;
  dlBtn.style.cssText = `
    display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 50%;
    background: linear-gradient(135deg, #1877f2, #00c6ff); color: #ffffff; border: none; cursor: pointer;
    box-shadow: 0 4px 14px rgba(24, 119, 242, 0.5); transition: transform 0.2s ease;
  `;

  const formatOptions = [
    { formatType: 'video', quality: 'best', label: t('videoBest') },
    { formatType: 'audio', quality: 'mp3-320', label: t('audio320') }
  ];

  const popover = createPopover(isDarkMode, formatOptions, async (fmt, qual) => {
    popover.style.display = 'none';
    const reelUrl = window.location.href.split('?')[0];

    try {
      const res = await fetch(`${API_BASE}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: reelUrl, mediaTitle: 'Facebook Reel', formatType: fmt, quality: qual })
      });
      if (res.ok) dlBtn.style.background = '#10b981';
      else throw new Error();
    } catch (e) {
      navigator.clipboard.writeText(reelUrl);
      dlBtn.style.background = '#f59e0b';
    }
    setTimeout(() => { dlBtn.style.background = 'linear-gradient(135deg, #1877f2, #00c6ff)'; }, 2500);
  });

  dlBtn.onclick = (e) => {
    e.preventDefault(); e.stopPropagation();
    const isVisible = popover.style.display === 'flex';
    if (isVisible) popover.style.display = 'none';
    else {
      const rect = dlBtn.getBoundingClientRect();
      popover.style.top = `${rect.top - 110}px`;
      popover.style.left = `${rect.left - 250}px`;
      popover.style.display = 'flex';
    }
  };

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.title = t('copyLink');
  copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
  copyBtn.style.cssText = `
    display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%;
    background: rgba(0, 0, 0, 0.6); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.3); cursor: pointer;
  `;
  copyBtn.onclick = (e) => {
    e.preventDefault(); e.stopPropagation();
    const reelUrl = window.location.href.split('?')[0];
    navigator.clipboard.writeText(reelUrl);
    copyBtn.style.background = '#10b981';
    setTimeout(() => { copyBtn.style.background = 'rgba(0, 0, 0, 0.6)'; }, 1500);
  };

  btnWrapper.appendChild(dlBtn);
  btnWrapper.appendChild(copyBtn);
  document.body.appendChild(btnWrapper);
}

// --------------------------------------------------------------------------
// GLOBAL OBSERVER & RUNNER
// --------------------------------------------------------------------------
const observer = new MutationObserver(() => {
  injectYouTubeDownloadButton();
  injectYouTubeShortsButton();
  injectSoundCloudButton();
  injectFacebookReelsButton();
});

observer.observe(document.body, { childList: true, subtree: true });

injectYouTubeDownloadButton();
injectYouTubeShortsButton();
injectSoundCloudButton();
injectFacebookReelsButton();
