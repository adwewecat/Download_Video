/**
 * dvi_mobile_content.js
 * Kịch bản phát hiện media dành riêng cho trình duyệt WebView di động.
 * Tự động quét video/hình ảnh, tạo nút bấm cảm ứng nổi và giao tiếp hai chiều với Android qua DVIBridge.
 */
(function() {
  'use strict';

  if (window.__DVI_MOBILE_INITIALIZED__) return;
  window.__DVI_MOBILE_INITIALIZED__ = true;

  console.log('[DVI Mobile] Khoi dong kien truc phat hien media...');

  // Danh sách media đã phát hiện để tránh trùng lặp
  const detectedMap = new Map();

  function detectPlatform() {
    const host = window.location.hostname.toLowerCase();
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
    if (host.includes('instagram.com')) return 'instagram';
    if (host.includes('tiktok.com')) return 'tiktok';
    if (host.includes('facebook.com') || host.includes('fb.watch')) return 'facebook';
    if (host.includes('threads.net')) return 'threads';
    if (host.includes('x.com') || host.includes('twitter.com')) return 'x';
    return 'web';
  }

  function getPageTitle() {
    return document.title || 'Video';
  }

  // Quét link stream từ Performance API
  function findDirectStreamFromPerformance() {
    try {
      const entries = performance.getEntriesByType('resource');
      for (let i = entries.length - 1; i >= 0; i--) {
        const name = entries[i].name;
        if (/\.(m3u8|mpd|vl)(\?|$)/i.test(name)) {
          return name;
        }
      }
    } catch (e) {
      // Bỏ qua nếu Performance API bị hạn chế
    }
    return null;
  }

  // Quét link stream từ các script trong trang
  function findStreamFromScripts() {
    try {
      const scripts = document.querySelectorAll('script');
      for (const s of scripts) {
        const text = s.textContent || '';
        const m = /["'](?:file|source|src)["']\s*:\s*["'](https?:\/\/[^"']+\.(?:vl|m3u8|mpd|mp4)[^"']*)["']/i.exec(text)
          || /(https?:\/\/[^\s"'<>]+\.(?:m3u8|mpd|vl)(?:\?[^\s"'<>]*)?)/i.exec(text);
        if (m && m[1]) return m[1];
      }
    } catch (e) {}
    return null;
  }

  // Tạo và gắn badge cảm ứng vào container của video
  function attachTouchBadge(el, mediaInfo) {
    if (el.__dvi_badged__) return;
    el.__dvi_badged__ = true;

    // Tìm phần tử cha phù hợp để gắn badge
    const parent = el.parentElement || el;
    const style = window.getComputedStyle(parent);
    if (style.position === 'static') {
      parent.style.position = 'relative';
    }

    const badge = document.createElement('div');
    badge.className = 'dvi-touch-badge';
    badge.innerHTML = `
      <div style="
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 99999;
        display: flex;
        align-items: center;
        gap: 4px;
        background: rgba(15, 23, 42, 0.85);
        backdrop-filter: blur(8px);
        color: #ffffff;
        padding: 6px 10px;
        border-radius: 20px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 13px;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.25);
        cursor: pointer;
        user-select: none;
        touch-action: manipulation;
      ">
        <span style="color: #38bdf8; font-size: 15px;">⬇</span>
        <span>Tải về</span>
      </div>
    `;

    badge.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (window.DVIBridge && typeof window.DVIBridge.onBadgeClick === 'function') {
        window.DVIBridge.onBadgeClick(
          mediaInfo.type,
          mediaInfo.url,
          mediaInfo.title,
          mediaInfo.platform
        );
      }
    });

    try {
      parent.appendChild(badge);
    } catch (e) {
      // Bỏ qua nếu không thể append vào DOM
    }
  }

  // Quét toàn bộ video trên trang
  function scanMedia() {
    const platform = detectPlatform();
    const pageTitle = getPageTitle();
    const streamUrl = findDirectStreamFromPerformance() || findStreamFromScripts();

    // 1. Quét thẻ video
    const videos = document.querySelectorAll('video');
    videos.forEach((v) => {
      const rect = v.getBoundingClientRect();
      if (rect.width < 60 && rect.height < 60) return;

      let targetUrl = streamUrl || v.currentSrc || v.src || window.location.href;
      
      // Nếu là Instagram / TikTok / Facebook: ưu tiên dùng canonical permalink
      if (platform !== 'web') {
        targetUrl = window.location.href;
      }

      const mediaInfo = {
        type: 'video',
        url: targetUrl,
        title: pageTitle,
        platform: platform
      };

      if (!detectedMap.has(targetUrl)) {
        detectedMap.set(targetUrl, mediaInfo);
        if (window.DVIBridge && typeof window.DVIBridge.onMediaDetected === 'function') {
          window.DVIBridge.onMediaDetected(
            mediaInfo.type,
            mediaInfo.url,
            mediaInfo.title,
            mediaInfo.platform
          );
        }
      }

      attachTouchBadge(v, mediaInfo);
    });
  }

  // Quét ngay khi khởi tạo
  scanMedia();

  // Theo dõi các phần tử DOM mới được thêm vào (infinite scroll)
  const observer = new MutationObserver(() => {
    scanMedia();
  });
  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });

  // Quét định kỳ mỗi 1.5 giây để bắt các luồng video tải chậm
  setInterval(scanMedia, 1500);

})();
