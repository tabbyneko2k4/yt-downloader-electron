/**
 * Tự động phát hiện định dạng mặc định (Video / Audio) dựa trên URL trang web
 * @param {string} url 
 * @returns {{ formatType: 'video' | 'audio' | null, platformName: string | null }}
 */
export function detectFormatFromUrl(url) {
  if (!url || typeof url !== 'string') return { formatType: null, platformName: null };
  const trimmed = url.trim().toLowerCase();

  // Danh sách các trang chuyên Âm thanh / Nhạc
  const audioPlatforms = [
    { domains: ['soundcloud.com', 'snd.sc'], name: 'SoundCloud' },
    { domains: ['spotify.com'], name: 'Spotify' },
    { domains: ['bandcamp.com'], name: 'Bandcamp' },
    { domains: ['mixcloud.com'], name: 'Mixcloud' },
    { domains: ['audiomack.com'], name: 'Audiomack' },
    { domains: ['podcasts.apple.com'], name: 'Apple Podcasts' }
  ];

  for (const p of audioPlatforms) {
    if (p.domains.some(d => trimmed.includes(d))) {
      return { formatType: 'audio', platformName: p.name };
    }
  }

  // Danh sách các trang chuyên Video
  const videoPlatforms = [
    { domains: ['youtube.com', 'youtu.be'], name: 'YouTube' },
    { domains: ['tiktok.com'], name: 'TikTok' },
    { domains: ['facebook.com', 'fb.watch', 'fb.com'], name: 'Facebook' },
    { domains: ['instagram.com'], name: 'Instagram' },
    { domains: ['twitter.com', 'x.com'], name: 'Twitter / X' },
    { domains: ['bilibili.com'], name: 'Bilibili' },
    { domains: ['vimeo.com'], name: 'Vimeo' },
    { domains: ['dailymotion.com'], name: 'Dailymotion' },
    { domains: ['twitch.tv'], name: 'Twitch' },
    { domains: ['rumble.com'], name: 'Rumble' }
  ];

  for (const p of videoPlatforms) {
    if (p.domains.some(d => trimmed.includes(d))) {
      return { formatType: 'video', platformName: p.name };
    }
  }

  return { formatType: null, platformName: null };
}
