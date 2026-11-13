/**
 * page-probe.js — Script chạy trong MAIN world của trang web (qua manifest content_scripts)
 *
 * Mục đích:
 *   Đọc trực tiếp các biến toàn cục của trình phát trong trang (như `window.jwplayer`,
 *   `window.__SRC`) mà Content Script ở ISOLATED world không nhìn thấy được, rồi phát
 *   CustomEvent `__dvi_stream_found` về cho `content.js`.
 *
 * Bảo mật / CSP:
 *   Khai báo trực tiếp `"world": "MAIN"` trong `manifest.json` để trình duyệt nạp script
 *   hợp lệ, tuyệt đối KHÔNG chèn thẻ `<script>` inline vào DOM nên không bao giờ vi phạm
 *   Content Security Policy (`script-src`) trên bất kỳ trang web nào.
 */
(function () {
  'use strict';

  // Lưu URL luồng gần nhất để phản hồi tức thì nếu content.js nạp sau thời điểm quét đầu
  let lastStreamUrl = null;
  let jwReadyHooked = false;

  /**
   * Phát sự kiện thông báo URL stream tìm được sang ISOLATED world.
   */
  function emitStreamUrl(url) {
    if (!url || typeof url !== 'string') return;
    lastStreamUrl = url;
    try {
      window.dispatchEvent(new CustomEvent('__dvi_stream_found', { detail: { url } }));
    } catch {
      // Bỏ qua nếu cửa sổ đang bị đóng hoặc hạn chế dispatch
    }
  }

  /**
   * Quét cấu hình trình phát (jwplayer, __SRC) trong ngữ cảnh MAIN world của trang.
   */
  function scanPagePlayers() {
    try {
      if (typeof window.jwplayer === 'function') {
        const jw = window.jwplayer();
        if (jw && typeof jw.getPlaylist === 'function') {
          const playlist = jw.getPlaylist();
          if (playlist && playlist[0] && playlist[0].file) {
            emitStreamUrl(playlist[0].file);
          }
        }
        if (jw && typeof jw.on === 'function' && !jwReadyHooked) {
          jwReadyHooked = true;
          jw.on('ready', function () {
            try {
              const playlist = jw.getPlaylist();
              if (playlist && playlist[0] && playlist[0].file) {
                emitStreamUrl(playlist[0].file);
              }
            } catch {
              // Bỏ qua lỗi từ player bên thứ ba
            }
          });
        }
      }
    } catch {
      // Bỏ qua lỗi truy cập jwplayer của trang
    }

    try {
      if (Array.isArray(window.__SRC) && window.__SRC[0] && window.__SRC[0].file) {
        emitStreamUrl(window.__SRC[0].file);
      }
    } catch {
      // Bỏ qua lỗi đọc window.__SRC
    }
  }

  // Cho phép content.js chủ động yêu cầu quét lại hoặc lấy kết quả đã cache bất cứ lúc nào
  window.addEventListener('__dvi_probe_request', function () {
    if (lastStreamUrl) {
      emitStreamUrl(lastStreamUrl);
    }
    scanPagePlayers();
  });

  // Quét tự động theo các mốc khởi tạo phổ biến của player
  scanPagePlayers();
  setTimeout(scanPagePlayers, 800);
  setTimeout(scanPagePlayers, 2500);
})();

