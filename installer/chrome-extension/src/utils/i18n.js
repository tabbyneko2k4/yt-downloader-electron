export const i18nDict = {
  vi: {
    appTitle: "Nyanko's Media Downloader",
    quickDownloader: "Nyanko's Media Downloader",
    subtitle: 'Tải media tốc độ cao trực tiếp từ trình duyệt',
    searchPlaceholder: 'Dán URL hoặc từ khóa tìm kiếm...',
    downloadTab: 'Tải Media',
    progressTab: 'Tiến Trình',
    filesTab: 'Lịch Sử Tệp',
    statusConnected: 'Đã Kết Nối',
    statusOffline: 'Ngoại Tuyến',
    openApp: 'Mở App Desktop',
    quickDownloadBtn: '⚡ Tải Nhanh',
    shareLinkBtn: 'Sao chép Link',
    formatVideo: 'Video HD',
    formatAudio: 'Audio MP3',
    formatThumbnail: 'Hình Ảnh',
    formatGif: 'Ảnh GIF',
    qualityBest: 'Chất lượng cao nhất',
    qualityMp3: 'MP3 320kbps',
    downloadNow: 'Bắt Đầu Tải Về App',
    analyzing: 'Đang Phân Tích Media...',
    copiedSuccess: 'Đã sao chép link share media!',
    sentToApp: '✓ Đã gửi sang App thành công!',
    sending: '⏳ Đang gửi...',
    offlineFallback: '📋 App ngoại tuyến - Đã copy link!',
    themeSystem: 'Hệ thống',
    themeDark: 'Tối (Dark)',
    themeLight: 'Sáng (Light)'
  },
  en: {
    appTitle: "Nyanko's Media Downloader",
    quickDownloader: "Nyanko's Media Downloader",
    subtitle: 'Download high-speed media directly from browser',
    searchPlaceholder: 'Paste URL or type search keywords...',
    downloadTab: 'Downloader',
    progressTab: 'Progress',
    filesTab: 'File History',
    statusConnected: 'Connected',
    statusOffline: 'Offline',
    openApp: 'Open Desktop App',
    quickDownloadBtn: '⚡ Quick Download',
    shareLinkBtn: 'Copy Share Link',
    formatVideo: 'HD Video',
    formatAudio: 'Audio MP3',
    formatThumbnail: 'Thumbnail Image',
    formatGif: 'Animated GIF',
    qualityBest: 'Best Quality',
    qualityMp3: 'MP3 320kbps',
    downloadNow: 'Start Download to App',
    analyzing: 'Analyzing Media...',
    copiedSuccess: 'Copied share link to clipboard!',
    sentToApp: '✓ Sent to Desktop App!',
    sending: '⏳ Sending...',
    offlineFallback: '📋 App Offline - Link Copied!',
    themeSystem: 'System',
    themeDark: 'Dark Mode',
    themeLight: 'Light Mode'
  }
};

export function getLang() {
  const lang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
  return lang.startsWith('vi') ? 'vi' : 'en';
}

export function t(key) {
  const lang = getLang();
  return (i18nDict[lang] && i18nDict[lang][key]) || i18nDict.en[key] || key;
}
