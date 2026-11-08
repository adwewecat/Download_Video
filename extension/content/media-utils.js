/**
 * media-utils.js
 * Thư viện các hàm thuần tiện ích xử lý URL, srcset, CSS background và tên file media.
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
    // Tách các candidate trong srcset. Lưu ý URL có thể chứa dấu phẩy bên trong (như CDN resize).
    // Descriptor có dạng [số]w hoặc [số]x ngăn cách bởi khoảng trắng.
    const candidates = [];
    const regex = /\s*([^\s]+)(?:\s+([\d.]+[wx]))?(?:\s*,\s*|\s*$)/g;
    let match;
    while ((match = regex.exec(trimmed)) !== null) {
      let rawUrl = match[1];
      const descriptor = match[2];

      // Nếu không có descriptor và rawUrl kết thúc bằng dấu phẩy (do regex ăn vào), cắt bỏ
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

    // Kiểm tra xem có candidate nào có descriptor width (w) không
    const hasWidth = candidates.some((c) => c.width !== null && !Number.isNaN(c.width));
    if (hasWidth) {
      candidates.sort((a, b) => (b.width || 0) - (a.width || 0));
      return candidates[0].url;
    }

    // Nếu không có width, so sánh theo pixel density (x), mặc định là 1x
    candidates.sort((a, b) => (b.density || 1) - (a.density || 1));
    return candidates[0].url;
  }

  /**
   * Trích xuất URL hình ảnh đầu tiên trong giá trị CSS background-image.
   * Xử lý cả dạng url("..."), url('...'), url(...) và trường hợp có gradient phía trước.
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
   * Định dạng: <mediaType>-YYYYMMDD-HHMMSS.<ext>
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

  const DVIMediaUtils = Object.freeze({
    pickLargestFromSrcset,
    extractCssUrl,
    getUrlKind,
    filenameForDataUrl
  });

  // Gán vào môi trường toàn cục (window hoặc global vm sandbox)
  global.DVIMediaUtils = DVIMediaUtils;
})(typeof globalThis !== 'undefined' ? globalThis : this);
