/**
 * media-utils.js
 * Thư viện các hàm thuần tiện ích xử lý URL, srcset, CSS background, nhận diện nền tảng và route tải.
 * Không phụ thuộc DOM, an toàn khi chạy trong Content Script lẫn sandbox vm của node:test.
 */
(function (global) {
  'use strict';

  /**
   * Bảng ánh xạ MIME type thông dụng sang phần mở rộng file chuẩn.
   */
  const MIME_TO_EXT = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'image/bmp': 'bmp',
    'image/svg+xml': 'svg',
    'image/x-icon': 'ico',
    'image/vnd.microsoft.icon': 'ico',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/ogg': 'ogv',
    'video/quicktime': 'mov'
  };

  /**
   * Phân tích chuỗi srcset của <img> hoặc <source> và chọn ứng viên có chất lượng cao nhất.
   * Ưu tiên descriptor độ rộng (w) lớn nhất; nếu không có w thì so mật độ điểm ảnh (x).
   * URL trả về được giải tuyệt đối theo baseUrl.
   *
   * @param {string|undefined|null} srcset - Chuỗi thuộc tính srcset
   * @param {string} baseUrl - Base URL để giải đường dẫn tuyệt đối
   * @returns {string|null} URL tuyệt đối hoặc null nếu rỗng / không hợp lệ
   */
  function pickLargestFromSrcset(srcset, baseUrl) {
    if (!srcset || typeof srcset !== 'string' || !srcset.trim()) {
      return null;
    }

    const trimmed = srcset.trim();
    const candidates = [];
    const regex = /\s*([^\s]+)(?:\s+([\d.]+[wx]))?(?:\s*,\s*|\s*$)/g;
    let match;
    while ((match = regex.exec(trimmed)) !== null) {
      let rawUrl = match[1];
      const descriptor = match[2];

      if (!descriptor && rawUrl.endsWith(',')) {
        rawUrl = rawUrl.slice(0, -1);
      }
      if (!rawUrl) continue;

      let width = null;
      let density = 1;

      if (descriptor) {
        if (descriptor.endsWith('w')) {
          width = parseFloat(descriptor.slice(0, -1));
        } else if (descriptor.endsWith('x')) {
          density = parseFloat(descriptor.slice(0, -1));
        }
      }

      try {
        const absoluteUrl = new URL(rawUrl, baseUrl).href;
        candidates.push({ url: absoluteUrl, width, density });
      } catch {
        // Bỏ qua URL không hợp lệ
      }
    }

    if (candidates.length === 0) {
      return null;
    }

    const hasWidth = candidates.some((c) => c.width !== null && !Number.isNaN(c.width));
    if (hasWidth) {
      candidates.sort((a, b) => (b.width || 0) - (a.width || 0));
      return candidates[0].url;
    }

    candidates.sort((a, b) => (b.density || 1) - (a.density || 1));
    return candidates[0].url;
  }

  /**
   * Trích xuất URL hình ảnh đầu tiên trong giá trị CSS background-image.
   *
   * @param {string|undefined|null} cssValue - Giá trị CSS computedStyle.backgroundImage
   * @returns {string|null} URL được trích xuất hoặc null nếu không có
   */
  function extractCssUrl(cssValue) {
    if (!cssValue || typeof cssValue !== 'string') {
      return null;
    }
    const match = /url\((?:['"]?)(.*?)(?:['"]?)\)/i.exec(cssValue);
    if (!match || !match[1]) {
      return null;
    }
    const extracted = match[1].trim();
    if (!extracted || extracted === 'none') {
      return null;
    }
    return extracted;
  }

  /**
   * Phân loại giao thức của một URL để xác định cách xử lý tiếp theo.
   *
   * @param {string|undefined|null} url - URL cần phân loại
   * @returns {'http'|'data'|'blob'|'none'}
   */
  function getUrlKind(url) {
    if (!url || typeof url !== 'string') {
      return 'none';
    }
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      return 'http';
    }
    if (/^data:/i.test(trimmed)) {
      return 'data';
    }
    if (/^blob:/i.test(trimmed)) {
      return 'blob';
    }
    return 'none';
  }

  /**
   * Tạo tên file chuẩn cho Data URL dựa trên loại media (image/video) và thời gian hiện tại.
   *
   * @param {string} dataUrl - Chuỗi data: URL
   * @param {'image'|'video'} mediaType - Loại media
   * @param {Date} [now=new Date()] - Thời điểm tạo tên file
   * @returns {string} Tên file với phần mở rộng phù hợp
   */
  function filenameForDataUrl(dataUrl, mediaType, now = new Date()) {
    const match = /^data:([^;,]+)/i.exec(dataUrl || '');
    const mime = match ? match[1].toLowerCase().trim() : '';

    let ext = MIME_TO_EXT[mime];
    if (!ext) {
      ext = mediaType === 'video' ? 'mp4' : 'jpg';
    }

    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = now.getFullYear();
    const mm = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    const hh = pad(now.getHours());
    const min = pad(now.getMinutes());
    const ss = pad(now.getSeconds());

    const timestamp = `${yyyy}${mm}${dd}-${hh}${min}${ss}`;
    return `${mediaType}-${timestamp}.${ext}`;
  }

  /**
   * Kiểm tra xem hostname có thuộc domain đã định hay không.
   */
  function matchesHost(host, domain) {
    return host === domain || host.endsWith('.' + domain);
  }

  /**
   * Nhận diện nền tảng mạng xã hội từ hostname.
   *
   * @param {string|undefined|null} hostname - Tên miền của trang hiện tại
   * @returns {'youtube'|'x'|'instagram'|'threads'|'tiktok'|'facebook'|null}
   */
  function detectPlatform(hostname) {
    if (!hostname || typeof hostname !== 'string') {
      return null;
    }
    const h = hostname.toLowerCase().trim().replace(/\.$/, '');

    if (
      matchesHost(h, 'youtube.com') ||
      matchesHost(h, 'youtu.be') ||
      matchesHost(h, 'youtube-nocookie.com')
    ) {
      return 'youtube';
    }
    if (matchesHost(h, 'x.com') || matchesHost(h, 'twitter.com')) {
      return 'x';
    }
    if (matchesHost(h, 'instagram.com')) {
      return 'instagram';
    }
    if (matchesHost(h, 'threads.net') || matchesHost(h, 'threads.com')) {
      return 'threads';
    }
    if (matchesHost(h, 'tiktok.com')) {
      return 'tiktok';
    }
    if (matchesHost(h, 'facebook.com') || matchesHost(h, 'fb.watch')) {
      return 'facebook';
    }

    return null;
  }

  /**
   * Chuẩn hoá permalink của từng nền tảng về dạng canonical duy nhất.
   * Trả về null nếu URL không phải là permalink của video / bài viết trên nền tảng đó.
   *
   * @param {string} platform - Tên nền tảng
   * @param {string} rawUrl - URL cần kiểm tra và chuẩn hoá
   * @returns {string|null} Canonical URL hoặc null
   */
  function normalizePermalink(platform, rawUrl) {
    if (!platform || !rawUrl || typeof rawUrl !== 'string') {
      return null;
    }

    let urlObj;
    try {
      urlObj = new URL(rawUrl);
    } catch {
      return null;
    }

    const path = urlObj.pathname;
    const origin = urlObj.origin;

    switch (platform) {
      case 'youtube': {
        if (path === '/watch') {
          const v = urlObj.searchParams.get('v');
          if (v) return `${origin}/watch?v=${v}`;
        }
        const shortsMatch = /^\/shorts\/([^/?#]+)/.exec(path);
        if (shortsMatch) {
          return `${origin}/shorts/${shortsMatch[1]}`;
        }
        return null;
      }

      case 'x': {
        const match = /^\/([^/?#]+)\/status\/(\d+)/.exec(path);
        if (match) {
          return `${origin}/${match[1]}/status/${match[2]}`;
        }
        return null;
      }

      case 'instagram': {
        const match = /^\/(p|reel)\/([^/?#]+)/.exec(path);
        if (match) {
          return `${origin}/${match[1]}/${match[2]}/`;
        }
        return null;
      }

      case 'threads': {
        const match = /^\/(@[^/?#]+)\/post\/([^/?#]+)/.exec(path);
        if (match) {
          return `${origin}/${match[1]}/post/${match[2]}`;
        }
        return null;
      }

      case 'tiktok': {
        const match = /^\/(@[^/?#]+)\/video\/(\d+)/.exec(path);
        if (match) {
          return `${origin}/${match[1]}/video/${match[2]}`;
        }
        return null;
      }

      case 'facebook': {
        if (path.startsWith('/watch')) {
          const v = urlObj.searchParams.get('v');
          if (v) return `${origin}/watch/?v=${v}`;
        }
        const reelMatch = /^\/reel\/([^/?#]+)/.exec(path);
        if (reelMatch) {
          return `${origin}/reel/${reelMatch[1]}`;
        }
        const vidMatch = /^\/([^/?#]+)\/videos\/(\d+)/.exec(path);
        if (vidMatch) {
          return `${origin}/${vidMatch[1]}/videos/${vidMatch[2]}/`;
        }
        if (urlObj.hostname === 'fb.watch' || urlObj.hostname.endsWith('.fb.watch')) {
          if (path.length > 1) {
            return `${origin}${path}`;
          }
        }
        return null;
      }

      default:
        return null;
    }
  }

  /**
   * Kiểm tra xem một URL có phải là permalink của nền tảng hay không.
   *
   * @param {string} platform - Tên nền tảng
   * @param {string} rawUrl - URL
   * @returns {boolean}
   */
  function isPermalink(platform, rawUrl) {
    return normalizePermalink(platform, rawUrl) !== null;
  }

  /**
   * Chọn permalink duy nhất từ các tầng thẻ cha (ancestor levels) chứa thẻ media.
   * Tránh chọn nhầm link ngoài feed khi đi lên quá rộng.
   *
   * @param {string} platform - Tên nền tảng
   * @param {string[][]} levels - Mảng các mảng link ở từng cấp cha
   * @param {string} pageUrl - URL trang dự phòng
   * @returns {string} Permalink duy nhất hoặc pageUrl
   */
  function choosePermalink(platform, levels, pageUrl) {
    if (!platform || !Array.isArray(levels) || levels.length === 0) {
      return pageUrl;
    }

    for (const level of levels) {
      if (!Array.isArray(level) || level.length === 0) continue;

      const canonicalSet = new Set();
      for (const href of level) {
        const normalized = normalizePermalink(platform, href);
        if (normalized) {
          canonicalSet.add(normalized);
        }
      }

      if (canonicalSet.size === 1) {
        return Array.from(canonicalSet)[0];
      }
      if (canonicalSet.size > 1) {
        return pageUrl;
      }
    }

    return pageUrl;
  }

  /**
   * Quyết định đường tải cho một phần tử media.
   *
   * @param {'image'|'video'} mediaType - Loại media
   * @param {'http'|'data'|'blob'|'none'} urlKind - Loại URL
   * @param {string|null} platform - Tên nền tảng (nếu có)
   * @returns {'direct'|'blob-image'|'ytdlp'|'none'}
   */
  function chooseRoute(mediaType, urlKind, platform) {
    if (mediaType === 'image') {
      if (urlKind === 'http' || urlKind === 'data') {
        return 'direct';
      }
      if (urlKind === 'blob') {
        return 'blob-image';
      }
      return 'none';
    }

    if (mediaType === 'video') {
      if (platform !== null) {
        return 'ytdlp';
      }
      if (urlKind === 'http' || urlKind === 'data') {
        return 'direct';
      }
      if (urlKind === 'blob' || urlKind === 'none') {
        return 'ytdlp';
      }
      return 'none';
    }

    return 'none';
  }

  const DVIMediaUtils = Object.freeze({
    pickLargestFromSrcset,
    extractCssUrl,
    getUrlKind,
    filenameForDataUrl,
    detectPlatform,
    normalizePermalink,
    isPermalink,
    choosePermalink,
    chooseRoute
  });

  global.DVIMediaUtils = DVIMediaUtils;
})(typeof globalThis !== 'undefined' ? globalThis : this);
