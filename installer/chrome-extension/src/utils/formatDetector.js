/**
 * Tự động phát hiện định dạng mặc định (Video / Audio) dựa trên URL trang web
 * Giới hạn tự động phát hiện ở YouTube, SoundCloud, và Reels của các ứng dụng Meta (Facebook, Instagram)
 * @param {string} url 
 * @returns {{ formatType: 'video' | 'audio' | null, platformName: string | null }}
 */
export function detectFormatFromUrl(url) {
  if (!url || typeof url !== 'string') return { formatType: null, platformName: null };
  const trimmed = url.trim().toLowerCase();

  // 1. YouTube Music & SoundCloud (Audio default)
  if (trimmed.includes('music.youtube.com')) {
    return { formatType: 'audio', platformName: 'YouTube Music' };
  }

  const soundcloudDomains = ['soundcloud.com', 'snd.sc'];
  if (soundcloudDomains.some(d => trimmed.includes(d))) {
    return { formatType: 'audio', platformName: 'SoundCloud' };
  }

  // 2. YouTube Shorts & Regular YouTube
  if (trimmed.includes('youtube.com/shorts/') || trimmed.includes('youtu.be/shorts/')) {
    return { formatType: 'video', platformName: 'YouTube Shorts' };
  }

  const youtubeDomains = ['youtube.com', 'youtu.be'];
  if (youtubeDomains.some(d => trimmed.includes(d))) {
    return { formatType: 'video', platformName: 'YouTube' };
  }

  // 3. TikTok
  if (trimmed.includes('tiktok.com') || trimmed.includes('vt.tiktok.com')) {
    return { formatType: 'video', platformName: 'TikTok' };
  }

  // 4. Meta Reels & Short Videos (Instagram, Facebook)
  if (trimmed.includes('instagram.com') || trimmed.includes('instagr.am')) {
    if (trimmed.includes('/reel/') || trimmed.includes('/reels/') || trimmed.includes('/p/')) {
      return { formatType: 'video', platformName: 'Instagram' };
    }
  }

  if (trimmed.includes('facebook.com') || trimmed.includes('fb.watch') || trimmed.includes('fb.com')) {
    if (trimmed.includes('/reel/') || trimmed.includes('/reels/') || trimmed.includes('/share/r/') || trimmed.includes('/watch') || trimmed.includes('fb.watch')) {
      return { formatType: 'video', platformName: 'Facebook' };
    }
  }

  // 5. Bilibili / Douyin / Twitter / X / Threads
  if (trimmed.includes('bilibili.com') || trimmed.includes('b23.tv')) {
    return { formatType: 'video', platformName: 'Bilibili' };
  }
  if (trimmed.includes('douyin.com')) {
    return { formatType: 'video', platformName: 'Douyin' };
  }
  if (trimmed.includes('twitter.com') || trimmed.includes('x.com')) {
    return { formatType: 'video', platformName: 'Twitter/X' };
  }

  return { formatType: null, platformName: null };
}

/**
 * Kiểm tra xem URL có thuộc nhóm được tự động phát hiện hay không (YouTube, SoundCloud, Meta Reels)
 * @param {string} url 
 * @returns {boolean}
 */
export function isAutoDetectableUrl(url) {
  return detectFormatFromUrl(url).formatType !== null;
}

/**
 * Kiểm tra xem URL YouTube có chứa đồng thời cả ID Video đơn lẻ và tham số Danh sách phát (&list=...) hay không
 * @param {string} url 
 * @returns {boolean}
 */
export function isPlaylistWithSingleVideoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const urlObj = new URL(url.trim());
    const hostname = urlObj.hostname.toLowerCase();
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      const hasList = urlObj.searchParams.has('list');
      if (!hasList) return false;

      let hasVideo = urlObj.searchParams.has('v');
      if (!hasVideo && hostname.includes('youtu.be')) {
        const pathname = urlObj.pathname.replace(/^\//, '');
        if (pathname.length > 0 && !pathname.includes('/')) {
          hasVideo = true;
        }
      }
      return hasList && hasVideo;
    }
  } catch (e) {}
  return false;
}

/**
 * Loại bỏ các tham số danh sách phát khỏi URL YouTube, trả về URL chỉ chứa video đơn lẻ
 * @param {string} url 
 * @returns {string}
 */
export function stripPlaylistParam(url) {
  if (!url || typeof url !== 'string') return url;
  try {
    const urlObj = new URL(url.trim());
    const hostname = urlObj.hostname.toLowerCase();
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      urlObj.searchParams.delete('list');
      urlObj.searchParams.delete('index');
      urlObj.searchParams.delete('start_radio');
      urlObj.searchParams.delete('pp');
      urlObj.searchParams.delete('playnext');
      return urlObj.toString();
    }
  } catch (e) {}
  return url;
}

