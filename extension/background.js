/**
 * background.js
 * Service worker chính của Chrome Extension "Download Video & Image".
 * Quản lý tải trực tiếp (chrome.downloads) và điều phối công việc tải qua yt-dlp Native Host.
 */

'use strict';

/**
 * Lắng nghe thông điệp gửi từ content script.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== 'object') {
    return false;
  }

  if (message.type === 'DVI_DIRECT') {
    handleDirectDownload(message)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ ok: false, error: err.message || String(err) }));
    return true; // Phản hồi bất đồng bộ
  }

  return false;
});

/**
 * Thực hiện tải trực tiếp media bằng API chrome.downloads.
 * Chỉ chấp nhận URL http, https hoặc data:.
 *
 * @param {Object} payload
 * @param {string} payload.url - URL media cần tải
 * @param {string} [payload.filename] - Tên file gợi ý lưu
 * @returns {Promise<{ ok: boolean, downloadId?: number, error?: string }>}
 */
async function handleDirectDownload({ url, filename }) {
  if (!url || typeof url !== 'string') {
    return { ok: false, error: 'URL không hợp lệ' };
  }

  const trimmed = url.trim();
  const isValidScheme = /^https?:\/\//i.test(trimmed) || /^data:/i.test(trimmed);
  if (!isValidScheme) {
    return { ok: false, error: 'Giao thức không được hỗ trợ tải trực tiếp' };
  }

  const options = {
    url: trimmed,
    conflictAction: 'uniquify'
  };

  if (filename && typeof filename === 'string' && filename.trim()) {
    options.filename = filename.trim();
  }

  try {
    const downloadId = await chrome.downloads.download(options);
    return { ok: true, downloadId };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
}
