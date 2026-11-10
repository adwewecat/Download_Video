/**
 * content.js
 * Content script quản lý nút tải nổi trên mọi hình ảnh và video của trang web.
 * Hoạt động độc lập trong Shadow DOM khép kín, không gây ảnh hưởng đến layout trang web.
 */

(function () {
  'use strict';

  // Tránh nạp lại nếu content script đã chạy trong frame này
  if (window.__dviContentScriptLoaded) return;
  window.__dviContentScriptLoaded = true;

  const U = window.DVIMediaUtils;
  if (!U) return;

  const MIN_SIZE = 60; // Kích thước tối thiểu (px) để hiển thị nút
  const BTN_OFFSET = 8; // Khoảng cách cách mép media (px)

  // Lưu trạng thái tải theo phần tử DOM để hiển thị đúng khi hover lại
  // element -> { state: 'idle'|'busy'|'done'|'error', detail?: number|string }
  const elementStates = new WeakMap();

  let activeTarget = null; // { element, mediaType, url, route, platform }
  let isHoveringBar = false;
  let rafPending = false;
  let lastMouseX = 0;
  let lastMouseY = 0;

  // Tạo container và Shadow Root
  const container = document.createElement('div');
  container.id = 'dvi-root-container';
  container.style.cssText =
    'position: fixed !important; top: 0 !important; left: 0 !important; width: 0 !important; height: 0 !important; z-index: 2147483647 !important; pointer-events: none !important; overflow: visible !important;';

  const shadow = container.attachShadow({ mode: 'closed' });

  // CSS nội bộ bên trong Shadow DOM
  const style = document.createElement('style');
  style.textContent = `
    .dvi-bar {
      position: fixed;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px;
      background: rgba(33, 33, 33, 0.85);
      backdrop-filter: blur(4px);
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      pointer-events: auto;
      transition: opacity 0.15s ease-in-out, transform 0.15s ease-in-out;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-2px);
      user-select: none;
      -webkit-user-select: none;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px;
      line-height: 1;
      color: #fff;
    }
    .dvi-bar.visible {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
    .dvi-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-family: inherit;
      font-size: 11px;
      font-weight: 600;
      color: #ffffff;
      outline: none;
      padding: 5px 8px;
      height: 26px;
      box-sizing: border-box;
      transition: background 0.15s, transform 0.1s;
    }
    .dvi-btn:active {
      transform: scale(0.95);
    }
    .dvi-btn-primary {
      background: #1e88e5;
    }
    .dvi-btn-primary:hover {
      background: #1565c0;
    }
    .dvi-btn-max {
      background: #8e24aa;
    }
    .dvi-btn-max:hover {
      background: #6a1b9a;
    }
    .dvi-btn-mp3 {
      background: #00897b;
    }
    .dvi-btn-mp3:hover {
      background: #00695c;
    }
    .dvi-icon {
      width: 14px;
      height: 14px;
      fill: currentColor;
    }
    .dvi-status {
      display: none;
      align-items: center;
      gap: 4px;
      padding: 0 4px;
      font-size: 11px;
      font-weight: 500;
      max-width: 220px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .dvi-bar.busy .dvi-btn { display: none; }
    .dvi-bar.busy .dvi-status-busy { display: inline-flex; color: #64b5f6; }
    .dvi-bar.done .dvi-btn { display: none; }
    .dvi-bar.done .dvi-status-done { display: inline-flex; color: #81c784; }
    .dvi-bar.error .dvi-btn { display: none; }
    .dvi-bar.error .dvi-status-error { display: inline-flex; color: #e57373; }
    .dvi-spinner {
      width: 12px;
      height: 12px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #64b5f6;
      border-radius: 50%;
      animation: dvi-spin 0.8s linear infinite;
    }
    @keyframes dvi-spin {
      to { transform: rotate(360deg); }
    }
  `;
  shadow.appendChild(style);

  // Tạo khung nút
  const bar = document.createElement('div');
  bar.className = 'dvi-bar';

  // Nút tải chính (⬇)
  const btnDownload = document.createElement('button');
  btnDownload.className = 'dvi-btn dvi-btn-primary';
  btnDownload.innerHTML = `
    <svg class="dvi-icon" viewBox="0 0 24 24">
      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/>
    </svg>
  `;
  bar.appendChild(btnDownload);

  // Nút nét nhất (MAX) cho video 2K/4K
  const btnMax = document.createElement('button');
  btnMax.className = 'dvi-btn dvi-btn-max';
  btnMax.textContent = 'MAX';
  btnMax.title = 'Tải video nét nhất (2K/4K)';
  btnMax.style.display = 'none';
  bar.appendChild(btnMax);

  // Nút tải riêng âm thanh MP3 cho video
  const btnMp3 = document.createElement('button');
  btnMp3.className = 'dvi-btn dvi-btn-mp3';
  btnMp3.textContent = 'MP3';
  btnMp3.title = 'Tải riêng âm thanh MP3';
  btnMp3.style.display = 'none';
  bar.appendChild(btnMp3);

  // Vùng thông báo trạng thái
  const statusBusy = document.createElement('span');
  statusBusy.className = 'dvi-status dvi-status-busy';
  statusBusy.innerHTML = '<span class="dvi-spinner"></span><span class="dvi-busy-text">Đang tải…</span>';
  bar.appendChild(statusBusy);

  const statusDone = document.createElement('span');
  statusDone.className = 'dvi-status dvi-status-done';
  statusDone.textContent = 'Đã tải xong ✓';
  bar.appendChild(statusDone);

  const statusError = document.createElement('span');
  statusError.className = 'dvi-status dvi-status-error';
  statusError.textContent = 'Lỗi';
  bar.appendChild(statusError);

  shadow.appendChild(bar);

  // Gắn container vào trang khi DOM sẵn sàng
  function mountContainer() {
    const parent = document.body || document.documentElement;
    if (parent && !parent.contains(container)) {
      parent.appendChild(container);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountContainer);
  } else {
    mountContainer();
  }

  // Chặn hoàn toàn mọi sự kiện chuột từ thanh công cụ lan ra trang web
  ['mousedown', 'pointerdown', 'mouseup', 'pointerup', 'click', 'dblclick'].forEach((evt) => {
    bar.addEventListener(evt, (e) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
      if (evt === 'mousedown' || evt === 'click') {
        e.preventDefault();
      }
    });
  });

  bar.addEventListener('mouseenter', () => {
    isHoveringBar = true;
  });
  bar.addEventListener('mouseleave', () => {
    isHoveringBar = false;
  });

  /**
   * Cập nhật trạng thái hiển thị của nút nổi theo element.
   */
  function setButtonState(element, state, detail) {
    if (!element) return;
    elementStates.set(element, { state, detail });

    if (activeTarget && activeTarget.element === element) {
      applyBarState(state, detail);
    }

    if (state === 'done' || state === 'error') {
      setTimeout(() => {
        const cur = elementStates.get(element);
        if (cur && cur.state === state) {
          elementStates.set(element, { state: 'idle' });
          if (activeTarget && activeTarget.element === element) {
            applyBarState('idle');
          }
        }
      }, 3000);
    }
  }
  // Expose ra window để background receiver có thể gọi
  window.__dviSetButtonState = setButtonState;

  function applyBarState(state, detail) {
    bar.classList.remove('busy', 'done', 'error');

    if (state === 'busy') {
      bar.classList.add('busy');
      const text = typeof detail === 'number' ? `Đang tải… ${Math.round(detail)}%` : 'Đang tải…';
      const textEl = statusBusy.querySelector('.dvi-busy-text');
      if (textEl) textEl.textContent = text;
    } else if (state === 'done') {
      bar.classList.add('done');
    } else if (state === 'error') {
      bar.classList.add('error');
      statusError.textContent = typeof detail === 'string' && detail ? detail : 'Lỗi tải';
      statusError.title = statusError.textContent;
    } else {
      // idle
      const isYtDlpVideo = activeTarget && activeTarget.mediaType === 'video' && activeTarget.route === 'ytdlp';
      btnMax.style.display = isYtDlpVideo ? 'inline-flex' : 'none';
      btnMp3.style.display = isYtDlpVideo ? 'inline-flex' : 'none';

      if (activeTarget && activeTarget.mediaType === 'video') {
        btnDownload.title = isYtDlpVideo ? 'Tải video (tương thích cao)' : 'Tải video';
      } else {
        btnDownload.title = 'Tải ảnh';
      }
    }
  }

  /**
   * Định vị thanh công cụ vào góc trên-phải của media.
   */
  function updateBarPosition() {
    if (!activeTarget || !activeTarget.element) {
      bar.classList.remove('visible');
      return;
    }

    const el = activeTarget.element;
    if (!el.isConnected) {
      hideBar();
      return;
    }

    const rect = el.getBoundingClientRect();
    if (rect.width < MIN_SIZE || rect.height < MIN_SIZE || rect.bottom <= 0 || rect.top >= window.innerHeight) {
      hideBar();
      return;
    }

    const barWidth = bar.offsetWidth || 70;
    const barHeight = bar.offsetHeight || 30;

    let targetX = rect.right - barWidth - BTN_OFFSET;
    let targetY = rect.top + BTN_OFFSET;

    // Giới hạn trong viewport
    targetX = Math.max(BTN_OFFSET, Math.min(window.innerWidth - barWidth - BTN_OFFSET, targetX));
    targetY = Math.max(BTN_OFFSET, Math.min(window.innerHeight - barHeight - BTN_OFFSET, targetY));

    bar.style.left = `${Math.round(targetX)}px`;
    bar.style.top = `${Math.round(targetY)}px`;
    bar.classList.add('visible');

    const st = elementStates.get(el) || { state: 'idle' };
    applyBarState(st.state, st.detail);
  }

  function hideBar() {
    activeTarget = null;
    bar.classList.remove('visible');
  }

  // Lắng nghe sự kiện stream tìm được từ MAIN world probe
  let inPageStreamUrl = null;
  window.addEventListener('__dvi_stream_found', (e) => {
    if (e.detail && e.detail.url) {
      inPageStreamUrl = e.detail.url;
    }
  });

  // Inject probe script vào MAIN world để đọc trực tiếp window.jwplayer hoặc window.__SRC
  try {
    const probe = document.createElement('script');
    probe.textContent = `
      (function() {
        function emit(u) {
          if (u && typeof u === 'string') {
            window.dispatchEvent(new CustomEvent('__dvi_stream_found', { detail: { url: u } }));
          }
        }
        function scan() {
          try {
            if (window.jwplayer && typeof window.jwplayer === 'function') {
              const jw = window.jwplayer();
              if (jw && jw.getPlaylist) {
                const pl = jw.getPlaylist();
                if (pl && pl[0] && pl[0].file) emit(pl[0].file);
              }
              if (jw && jw.on) {
                jw.on('ready', function() {
                  const pl = jw.getPlaylist();
                  if (pl && pl[0] && pl[0].file) emit(pl[0].file);
                });
              }
            }
          } catch {}
          try {
            if (window.__SRC && window.__SRC[0] && window.__SRC[0].file) {
              emit(window.__SRC[0].file);
            }
          } catch {}
        }
        scan();
        setTimeout(scan, 800);
        setTimeout(scan, 2500);
      })();
    `;
    (document.head || document.documentElement).appendChild(probe);
    probe.remove();
  } catch {}

  /**
   * Quét Performance API để lấy các yêu cầu mạng .m3u8, .mpd, .vl, .mp4 mà player đã nạp qua AJAX / HLS.
   */
  function findDirectStreamFromPerformance() {
    try {
      if (!window.performance || typeof window.performance.getEntriesByType !== 'function') {
        return null;
      }
      const entries = window.performance.getEntriesByType('resource') || [];
      // 1. Ưu tiên manifest HLS / DASH (.m3u8, .mpd, .vl)
      for (let i = entries.length - 1; i >= 0; i--) {
        const name = entries[i].name;
        if (name && typeof name === 'string' && /\.(m3u8|mpd|vl)(\?|$)/i.test(name)) {
          return name;
        }
      }
      // 2. Kế tiếp tìm file video mp4 / webm
      for (let i = entries.length - 1; i >= 0; i--) {
        const name = entries[i].name;
        if (name && typeof name === 'string' && /\.(mp4|webm)(\?|$)/i.test(name)) {
          return name;
        }
      }
    } catch {}
    return null;
  }

  /**
   * Quét các thẻ <script> và nội dung trang để tìm link luồng stream trực tiếp (HLS/m3u8/vl).
   */
  function findDirectStreamInDocument() {
    try {
      const scripts = document.scripts || [];
      for (let i = 0; i < scripts.length; i++) {
        const text = scripts[i].textContent || '';
        if (!text) continue;
        const streamUrl = U.extractStreamUrlFromHtml(text);
        if (streamUrl) return streamUrl;
      }
      const bodyHtml = document.body ? document.body.innerHTML : '';
      return U.extractStreamUrlFromHtml(bodyHtml);
    } catch {
      return null;
    }
  }

  /**
   * Tìm phần tử media hợp lệ dưới toạ độ (x, y) bằng elementsFromPoint.
   */
  function findMediaAt(x, y) {
    const elements = document.elementsFromPoint(x, y) || [];
    const limit = Math.min(elements.length, 20);

    let foundVideo = null;
    let foundImg = null;
    let foundBg = null;

    for (let i = 0; i < limit; i++) {
      const el = elements[i];
      if (!el || el === container || container.contains(el)) {
        continue;
      }

      const rect = el.getBoundingClientRect();
      if (rect.width < MIN_SIZE || rect.height < MIN_SIZE) {
        continue;
      }

      const tag = el.tagName ? el.tagName.toLowerCase() : '';

      if (!foundVideo && tag === 'video') {
        foundVideo = el;
        break; // Ưu tiên video cao nhất
      }

      if (!foundImg && tag === 'img') {
        foundImg = el;
      }

      if (!foundBg) {
        const bg = window.getComputedStyle(el).backgroundImage;
        const cssUrl = U.extractCssUrl(bg);
        if (cssUrl) {
          foundBg = { element: el, url: cssUrl };
        }
      }
    }

    const targetEl = foundVideo || foundImg || (foundBg ? foundBg.element : null);
    if (!targetEl) return null;

    const mediaType = foundVideo ? 'video' : 'image';
    let url = '';

    if (foundVideo) {
      url = foundVideo.currentSrc || foundVideo.src || '';
      if (!url) {
        const source = foundVideo.querySelector('source[src]');
        if (source) url = source.src;
      }
      // Nếu video phát bằng blob URL (thường là HLS stream qua jwplayer/hls.js), tìm link manifest thực tế
      if (!url || url.startsWith('blob:')) {
        const directStream = inPageStreamUrl || findDirectStreamFromPerformance() || findDirectStreamInDocument();
        if (directStream) {
          url = directStream;
        }
      }
    } else if (foundImg) {
      url = U.pickLargestFromSrcset(foundImg.srcset, document.baseURI) || foundImg.currentSrc || foundImg.src || '';
    } else if (foundBg) {
      url = foundBg.url;
    }

    const urlKind = U.getUrlKind(url);
    const platform = U.detectPlatform(window.location.hostname);
    const route = U.chooseRoute(mediaType, urlKind, platform, url);

    return {
      element: targetEl,
      mediaType,
      url,
      urlKind,
      platform,
      route
    };
  }

  // Lắng nghe di chuột
  window.addEventListener(
    'mousemove',
    (e) => {
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;

      if (rafPending) return;
      rafPending = true;

      requestAnimationFrame(() => {
        rafPending = false;
        mountContainer();

        // Nếu chuột đang rê vào chính thanh nút, giữ nguyên mục tiêu
        if (isHoveringBar) return;

        const target = findMediaAt(lastMouseX, lastMouseY);
        if (target) {
          activeTarget = target;
          updateBarPosition();
        } else {
          hideBar();
        }
      });
    },
    { passive: true }
  );

  // Cập nhật vị trí khi scroll hoặc resize
  window.addEventListener('scroll', () => { if (activeTarget) updateBarPosition(); }, { capture: true, passive: true });
  window.addEventListener('resize', () => { if (activeTarget) updateBarPosition(); }, { passive: true });

  /**
   * Thu thập các cấp link thẻ cha (ancestor levels) để chọn permalink chính xác trên mạng xã hội.
   */
  function collectLevels(element) {
    const levels = [];
    if (!element) return levels;

    // Tìm container bài viết gần nhất (article, [role="article"], ...)
    const postContainer = element.closest ? (
      element.closest('article') ||
      element.closest('[role="article"]') ||
      element.closest('[data-pagelet*="FeedUnit"]') ||
      element.closest('[data-e2e="feed-item"]') ||
      element.closest('div[role="presentation"]')
    ) : null;

    let cur = element;
    let count = 0;
    const maxDepth = postContainer ? 50 : 35;
    while (cur && cur !== document.body && cur !== document.documentElement && count < maxDepth) {
      const anchors = cur.querySelectorAll ? cur.querySelectorAll('a[href]') : [];
      const hrefs = [];
      for (let i = 0; i < anchors.length; i++) {
        try {
          const href = anchors[i].href;
          if (href) hrefs.push(href);
        } catch {}
      }
      if (hrefs.length > 0) {
        levels.push(hrefs);
      }
      // Dừng lại khi đã thu thập xong cấp postContainer để tránh lan sang các bài viết khác trên feed
      if (postContainer && cur === postContainer) {
        break;
      }
      cur = cur.parentElement;
      count++;
    }
    return levels;
  }

  /**
   * Quét tìm permalink bài viết trong container cha gần nhất (hỗ trợ bảng tin / feed trên mạng xã hội).
   */
  function findPostPermalink(platform, element) {
    if (!platform || !element) return null;

    const postContainer = element.closest ? (
      element.closest('article') ||
      element.closest('[role="article"]') ||
      element.closest('[data-pagelet*="FeedUnit"]') ||
      element.closest('[data-e2e="feed-item"]') ||
      element.closest('div[role="presentation"]')
    ) : null;

    const searchRoots = [];
    if (postContainer) searchRoots.push(postContainer);

    let cur = element;
    let depth = 0;
    while (cur && cur !== document.body && cur !== document.documentElement && depth < 35) {
      if (!searchRoots.includes(cur)) {
        searchRoots.push(cur);
      }
      cur = cur.parentElement;
      depth++;
    }

    for (const root of searchRoots) {
      const anchors = root.querySelectorAll ? root.querySelectorAll('a[href]') : [];
      const foundPermalinks = new Set();
      for (let i = 0; i < anchors.length; i++) {
        try {
          const href = anchors[i].href;
          const normalized = U.normalizePermalink(platform, href);
          if (normalized) {
            foundPermalinks.add(normalized);
          }
        } catch {}
      }
      if (foundPermalinks.size === 1) {
        return Array.from(foundPermalinks)[0];
      }
      if (foundPermalinks.size > 1) {
        const list = Array.from(foundPermalinks);
        const reelLink = list.find((u) => u.includes('/reel/'));
        if (reelLink) return reelLink;
        return list[0];
      }
    }

    return null;
  }

  /**
   * Xử lý hành động tải khi bấm nút.
   */
  async function triggerDownload(quality = 'compatible') {
    if (!activeTarget) return;

    const { element, mediaType, url, urlKind, platform, route } = activeTarget;

    setButtonState(element, 'busy');

    // Kiểm tra tính toàn vẹn của extension context
    if (!chrome.runtime || !chrome.runtime.id) {
      setButtonState(element, 'error', 'Extension vừa cập nhật — hãy tải lại trang (F5)');
      return;
    }

    try {
      if (route === 'direct') {
        let filename = undefined;
        if (urlKind === 'data') {
          filename = U.filenameForDataUrl(url, mediaType, new Date());
        }

        chrome.runtime.sendMessage({ type: 'DVI_DIRECT', url, filename }, (res) => {
          if (chrome.runtime.lastError) {
            const err = chrome.runtime.lastError.message || '';
            const msg = err.includes('Extension context invalidated')
              ? 'Extension vừa cập nhật — hãy tải lại trang (F5)'
              : 'Lỗi gửi lệnh tải';
            setButtonState(element, 'error', msg);
            return;
          }
          if (res && res.ok) {
            setButtonState(element, 'done');
          } else {
            setButtonState(element, 'error', (res && res.error) || 'Tải thất bại');
          }
        });
        return;
      }

      if (route === 'blob-image') {
        // Fetch blob và chuyển sang Data URL để gửi cho service worker
        const resp = await fetch(url);
        const blob = await resp.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result;
          const filename = U.filenameForDataUrl(dataUrl, 'image', new Date());
          chrome.runtime.sendMessage({ type: 'DVI_DIRECT', url: dataUrl, filename }, (res) => {
            if (res && res.ok) {
              setButtonState(element, 'done');
            } else {
              setButtonState(element, 'error', (res && res.error) || 'Tải thất bại');
            }
          });
        };
        reader.onerror = () => {
          setButtonState(element, 'error', 'Không đọc được blob');
        };
        reader.readAsDataURL(blob);
        return;
      }

      if (route === 'ytdlp') {
        // Định tuyến sang yt-dlp qua Service Worker
        let targetUrl;
        if (url && typeof url === 'string' && /^https?:\/\//i.test(url) && /\.(m3u8|mpd|vl)(\?|$)/i.test(url)) {
          // Luồng stream HLS / DASH trực tiếp
          targetUrl = url;
        } else {
          const levels = collectLevels(element);
          targetUrl = platform ? U.choosePermalink(platform, levels, window.location.href) : window.location.href;

          // Nếu trên mạng xã hội mà chưa lấy được permalink bài viết (vẫn là URL feed/homepage):
          // Quét bổ sung trong container bài viết gần nhất
          if (platform && !U.isPermalink(platform, targetUrl)) {
            const fallbackPermalink = findPostPermalink(platform, element);
            if (fallbackPermalink) {
              targetUrl = fallbackPermalink;
            } else if (url && typeof url === 'string' && /^https?:\/\//i.test(url) && !url.startsWith('blob:')) {
              // Dự phòng: dùng link media trực tiếp nếu có
              targetUrl = url;
            }
          }
        }

        // Chặn gửi URL trang chủ / bảng tin chung chung sang yt-dlp vì chắc chắn sẽ bị lỗi Unsupported URL
        if (platform && !U.isPermalink(platform, targetUrl) && !/^https?:\/\/.*(fbcdn|cdninstagram|googlevideo|tiktokcdn)/i.test(targetUrl)) {
          setButtonState(element, 'error', 'Không tìm thấy link bài viết — hãy nhấp mở bài viết để tải');
          return;
        }

        let pageTitle = document.title || '';
        try {
          if (window.top && window.top !== window && window.top.document && window.top.document.title) {
            pageTitle = window.top.document.title;
          }
        } catch {}

        chrome.runtime.sendMessage(
          {
            type: 'DVI_YTDLP',
            url: targetUrl,
            referer: window.location.href,
            platform,
            quality,
            title: pageTitle
          },
          (res) => {
            if (chrome.runtime.lastError) {
              const err = chrome.runtime.lastError.message || '';
              const msg = err.includes('Extension context invalidated')
                ? 'Extension vừa cập nhật — hãy tải lại trang (F5)'
                : 'Chưa cài trình hỗ trợ — chạy native-host\\setup.bat';
              setButtonState(element, 'error', msg);
              return;
            }
            if (res && res.ok) {
              if (res.jobId) {
                // Đăng ký jobId với element để nhận progress từ service worker
                window.__dviJobs = window.__dviJobs || new Map();
                window.__dviJobs.set(res.jobId, element);
              }
            } else {
              setButtonState(element, 'error', (res && res.error) || 'Không thể khởi tạo yt-dlp');
            }
          }
        );
        return;
      }

      setButtonState(element, 'error', 'Không tìm thấy nguồn để tải');
    } catch (e) {
      setButtonState(element, 'error', e.message || 'Lỗi không xác định');
    }
  }

  // Bắt sự kiện click vào nút
  btnDownload.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    triggerDownload('compatible');
  });

  btnMax.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    triggerDownload('best');
  });

  btnMp3.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    triggerDownload('mp3');
  });

  // Lắng nghe cập nhật tiến độ / kết quả từ service worker (phục vụ Task 8)
  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg || typeof msg !== 'object') return;
    const jobs = window.__dviJobs;
    if (!jobs) return;

    const el = jobs.get(msg.jobId);
    if (!el) return;

    if (msg.type === 'DVI_PROGRESS') {
      setButtonState(el, 'busy', msg.percent);
    } else if (msg.type === 'DVI_CANCELLED') {
      setButtonState(el, 'idle');
      jobs.delete(msg.jobId);
    } else if (msg.type === 'DVI_DONE') {
      setButtonState(el, 'done');
      jobs.delete(msg.jobId);
    } else if (msg.type === 'DVI_ERROR') {
      setButtonState(el, 'error', msg.message);
      jobs.delete(msg.jobId);
    }
  });
})();
