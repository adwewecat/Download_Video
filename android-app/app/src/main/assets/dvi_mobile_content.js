/**
 * dvi_mobile_content.js
 * Kịch bản phát hiện đa tầng media (Video, Iframe Embed, HLS Stream, Image) trên thiết bị di động.
 * Tự động tạo nút nổi cảm ứng định vị cố định (không bị overflow hay che khuất)
 * và kết nối hai chiều với Android Native qua DVIBridge.
 */
(function() {
  'use strict';

  if (window.__DVI_MOBILE_INITIALIZED__) {
    if (typeof window.__DVI_MOBILE_RESCAN__ === 'function') {
      window.__DVI_MOBILE_RESCAN__();
    }
    return;
  }
  window.__DVI_MOBILE_INITIALIZED__ = true;

  console.log('[DVI Mobile] Khởi động phát hiện đa tầng media...');

  const detectedMap = new Map();
  const badgedElements = new Map(); // el -> badge element

  // 1. Tạo Root Host cố định trên đầu trang (z-index cực đại, không bị che khuất)
  let overlayHost = document.getElementById('dvi-mobile-overlay-host');
  if (!overlayHost) {
    overlayHost = document.createElement('div');
    overlayHost.id = 'dvi-mobile-overlay-host';
    overlayHost.style.cssText =
      'position: fixed !important; top: 0 !important; left: 0 !important; width: 0 !important; height: 0 !important; z-index: 2147483647 !important; pointer-events: none !important; overflow: visible !important;';
    (document.documentElement || document.body || document).appendChild(overlayHost);
  }

  function detectPlatform() {
    const host = (window.location.hostname || '').toLowerCase();
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
    if (host.includes('instagram.com')) return 'instagram';
    if (host.includes('tiktok.com')) return 'tiktok';
    if (host.includes('facebook.com') || host.includes('fb.watch')) return 'facebook';
    if (host.includes('threads.net')) return 'threads';
    if (host.includes('x.com') || host.includes('twitter.com')) return 'x';
    return 'web';
  }

  function getPageTitle() {
    return document.title || 'Media';
  }

  // Quét Performance API để lấy luồng HLS/DASH/MP4 tải ngầm qua AJAX
  function findDirectStreamFromPerformance() {
    try {
      if (!window.performance || typeof window.performance.getEntriesByType !== 'function') return null;
      const entries = window.performance.getEntriesByType('resource') || [];
      // 1. Ưu tiên luồng m3u8, mpd, vl
      for (let i = entries.length - 1; i >= 0; i--) {
        const name = entries[i].name;
        if (name && typeof name === 'string' && /\.(m3u8|mpd|vl)(\?|$)/i.test(name)) {
          return name;
        }
      }
      // 2. Kế tiếp tìm mp4, webm
      for (let i = entries.length - 1; i >= 0; i--) {
        const name = entries[i].name;
        if (name && typeof name === 'string' && /\.(mp4|webm)(\?|$)/i.test(name)) {
          return name;
        }
      }
    } catch {}
    return null;
  }

  // Quét các thẻ <script> và nội dung trang tìm link luồng stream
  function findDirectStreamInScripts() {
    try {
      const scripts = document.querySelectorAll('script');
      for (const s of scripts) {
        const text = s.textContent || '';
        const m = /["'](?:file|source|src)["']\s*:\s*["'](https?:\/\/[^"']+\.(?:vl|m3u8|mpd|mp4)[^"']*)["']/i.exec(text)
          || /(https?:\/\/[^\s"'<>]+\.(?:m3u8|mpd|vl)(?:\?[^\s"'<>]*)?)/i.exec(text);
        if (m && m[1]) return m[1];
      }
    } catch {}
    return null;
  }

  // Báo media phát hiện về Android Native
  function notifyAndroidMedia(type, url, title, platform) {
    if (!url || detectedMap.has(url)) return;
    const item = { type, url, title, platform };
    detectedMap.set(url, item);

    try {
      if (window.DVIBridge && typeof window.DVIBridge.onMediaDetected === 'function') {
        window.DVIBridge.onMediaDetected(type, url, title, platform);
      }
    } catch (e) {
      console.warn('[DVI Mobile] Lỗi gửi DVIBridge:', e);
    }
  }

  // Tạo và định vị nút nổi cảm ứng định vị cố định theo toạ độ màn hình của phần tử
  function attachFixedTouchBadge(el, mediaInfo) {
    if (badgedElements.has(el)) return;

    const badge = document.createElement('div');
    badge.className = 'dvi-mobile-touch-pill';
    badge.style.cssText = `
      position: fixed !important;
      z-index: 2147483647 !important;
      display: flex !important;
      align-items: center !important;
      gap: 4px !important;
      background: rgba(11, 17, 32, 0.72) !important;
      backdrop-filter: blur(6px) !important;
      -webkit-backdrop-filter: blur(6px) !important;
      color: #ffffff !important;
      padding: 4px 10px !important;
      border-radius: 16px !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      font-size: 11.5px !important;
      font-weight: 600 !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4) !important;
      border: 1px solid rgba(56, 189, 248, 0.35) !important;
      cursor: pointer !important;
      user-select: none !important;
      -webkit-user-select: none !important;
      touch-action: manipulation !important;
      pointer-events: auto !important;
      transition: transform 0.1s ease !important;
    `;
    badge.innerHTML = `
      <span style="color: #38bdf8; font-size: 13px; font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">⬇</span>
      <span style="color: #ffffff; font-size: 11.5px; font-weight: 600; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">${mediaInfo.type === 'image' ? 'Tải ảnh' : 'Tải video'}</span>
    `;

    function updateBadgePosition() {
      if (!el.isConnected) {
        badge.remove();
        badgedElements.delete(el);
        return;
      }
      const rect = el.getBoundingClientRect();
      if (rect.width < 50 || rect.height < 50 || rect.bottom <= 0 || rect.top >= window.innerHeight || rect.right <= 0 || rect.left >= window.innerWidth) {
        badge.style.display = 'none';
        return;
      }
      badge.style.display = 'flex';
      const badgeTop = Math.max(8, rect.top + 8);
      const badgeLeft = Math.max(8, rect.right - 88);
      badge.style.top = badgeTop + 'px';
      badge.style.left = badgeLeft + 'px';
    }

    const triggerClick = function(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      try {
        if (window.DVIBridge && typeof window.DVIBridge.onBadgeClick === 'function') {
          window.DVIBridge.onBadgeClick(
            mediaInfo.type,
            mediaInfo.url,
            mediaInfo.title,
            mediaInfo.platform
          );
        }
      } catch (err) {
        console.warn('[DVI Mobile] Lỗi click badge:', err);
      }
    };

    badge.addEventListener('click', triggerClick);
    badge.addEventListener('touchend', triggerClick);

    overlayHost.appendChild(badge);
    badgedElements.set(el, badge);
    updateBadgePosition();
  }

  // Quét toàn diện: Video, Iframe, Stream, Ảnh, và Trang web
  function scanMedia() {
    const platform = detectPlatform();
    const pageTitle = getPageTitle();
    const pageUrl = window.location.href;
    const streamUrl = findDirectStreamFromPerformance() || findDirectStreamInScripts();

    // 0. Nếu tìm thấy streamUrl (như m3u8, vl, mp4) -> lập tức báo về Android
    if (streamUrl) {
      notifyAndroidMedia('video', streamUrl, pageTitle, platform);
    }

    // 1. Quét các thẻ <video>
    const videos = document.querySelectorAll('video');
    videos.forEach((v) => {
      let targetUrl = streamUrl || v.currentSrc || v.src;
      if (!targetUrl || targetUrl.startsWith('blob:')) {
        const sourceTag = v.querySelector('source[src]');
        if (sourceTag) targetUrl = sourceTag.src;
      }
      if (!targetUrl || targetUrl.startsWith('blob:') || platform !== 'web') {
        targetUrl = streamUrl || pageUrl;
      }

      const mediaInfo = {
        type: 'video',
        url: targetUrl,
        title: pageTitle,
        platform: platform
      };

      notifyAndroidMedia(mediaInfo.type, mediaInfo.url, mediaInfo.title, mediaInfo.platform);
      attachFixedTouchBadge(v, mediaInfo);

      // Gắn sự kiện khi video bắt đầu phát để cập nhật luồng
      if (!v.__dvi_listener__) {
        v.__dvi_listener__ = true;
        const onPlay = function() {
          const freshStream = findDirectStreamFromPerformance() || v.currentSrc || v.src || streamUrl || pageUrl;
          notifyAndroidMedia('video', freshStream, pageTitle, platform);
        };
        v.addEventListener('play', onPlay);
        v.addEventListener('playing', onPlay);
        v.addEventListener('loadeddata', onPlay);
      }
    });

    // 2. Quét các thẻ <iframe> và <embed> (bắt các player nhúng như vlstream, youtube embed, stream player)
    const iframes = document.querySelectorAll('iframe, embed');
    iframes.forEach((ifr) => {
      const src = ifr.src || ifr.getAttribute('src') || '';
      const rect = ifr.getBoundingClientRect();
      const isPlayerIframe = /embed|player|video|vlstream|stream|youtube|vimeo|dailymotion|m3u8|mp4/i.test(src) ||
                             (rect.width >= 160 && rect.height >= 90);

      if (isPlayerIframe) {
        const targetUrl = streamUrl || src || pageUrl;
        const mediaInfo = {
          type: 'video',
          url: targetUrl,
          title: pageTitle,
          platform: platform
        };

        notifyAndroidMedia(mediaInfo.type, mediaInfo.url, mediaInfo.title, mediaInfo.platform);
        attachFixedTouchBadge(ifr, mediaInfo);
      }
    });

    // 3. Quét các thẻ hình ảnh <img> kích thước lớn (>= 100x100)
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      const w = img.naturalWidth || img.clientWidth || 0;
      const h = img.naturalHeight || img.clientHeight || 0;
      if (w >= 100 && h >= 100) {
        const imgSrc = img.currentSrc || img.src || '';
        if (imgSrc && !imgSrc.startsWith('data:image/svg')) {
          const mediaInfo = {
            type: 'image',
            url: imgSrc,
            title: img.alt || pageTitle,
            platform: platform
          };
          notifyAndroidMedia(mediaInfo.type, mediaInfo.url, mediaInfo.title, mediaInfo.platform);
        }
      }
    });

    // 4. Nhận diện mức độ trang (Page-level video fallback)
    // Nếu là mạng xã hội hoặc URL chứa từ khoá video/phim (vlxx, watch, reel, video, clip)
    const isVideoSiteOrPage = platform !== 'web' ||
      /video|watch|reel|clip|film|movie|vlxx|phim|stream/i.test(pageUrl);

    if (isVideoSiteOrPage) {
      notifyAndroidMedia('video', streamUrl || pageUrl, pageTitle, platform);
    }
  }

  // Cập nhật vị trí tất cả các badge khi cuộn hoặc thay đổi kích thước
  function updateAllBadgePositions() {
    badgedElements.forEach((badge, el) => {
      if (!el.isConnected) {
        badge.remove();
        badgedElements.delete(el);
      } else {
        const rect = el.getBoundingClientRect();
        if (rect.width < 50 || rect.height < 50 || rect.bottom <= 0 || rect.top >= window.innerHeight || rect.right <= 0 || rect.left >= window.innerWidth) {
          badge.style.display = 'none';
        } else {
          badge.style.display = 'flex';
          const badgeTop = Math.max(8, rect.top + 8);
          const badgeLeft = Math.max(8, rect.right - 88);
          badge.style.top = badgeTop + 'px';
          badge.style.left = badgeLeft + 'px';
        }
      }
    });
  }

  window.addEventListener('scroll', updateAllBadgePositions, { passive: true });
  window.addEventListener('resize', updateAllBadgePositions, { passive: true });

  // Hỗ trợ SPA (Single Page Application như YouTube, Facebook): quét lại khi URL thay đổi
  const originalPushState = history.pushState;
  history.pushState = function() {
    originalPushState.apply(this, arguments);
    setTimeout(scanMedia, 300);
  };
  const originalReplaceState = history.replaceState;
  history.replaceState = function() {
    originalReplaceState.apply(this, arguments);
    setTimeout(scanMedia, 300);
  };
  window.addEventListener('popstate', () => setTimeout(scanMedia, 300));
  window.addEventListener('hashchange', () => setTimeout(scanMedia, 300));

  // Quét định kỳ và theo dõi biến động DOM
  scanMedia();
  const observer = new MutationObserver(() => {
    scanMedia();
    updateAllBadgePositions();
  });
  observer.observe(document.body || document.documentElement, { childList: true, subtree: true });

  setInterval(() => {
    scanMedia();
    updateAllBadgePositions();
  }, 1200);

  window.__DVI_MOBILE_RESCAN__ = function() {
    scanMedia();
    updateAllBadgePositions();
  };
})();
