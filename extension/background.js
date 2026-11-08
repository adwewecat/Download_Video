/**
 * background.js
 * Service worker chính của Chrome Extension "Download Video & Image".
 * Quản lý tải trực tiếp (chrome.downloads) và điều phối công việc tải qua yt-dlp Native Host.
 */

'use strict';

const NATIVE_HOST_NAME = 'com.adwewecat.download_video';

// Danh sách domain cần thu thập cookie theo từng nền tảng mạng xã hội
const COOKIE_DOMAINS = {
  x: ['x.com', 'twitter.com'],
  instagram: ['instagram.com'],
  threads: ['threads.net', 'threads.com', 'instagram.com'],
  tiktok: ['tiktok.com'],
  facebook: ['facebook.com']
};

let activeJobCount = 0;

/**
 * Cập nhật số lượng tiến trình tải đang chạy trên icon extension.
 */
function updateBadge(delta) {
  activeJobCount = Math.max(0, activeJobCount + delta);
  if (chrome.action) {
    if (activeJobCount > 0) {
      chrome.action.setBadgeText({ text: String(activeJobCount) });
      chrome.action.setBadgeBackgroundColor({ color: '#1E88E5' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  }
}

/**
 * Lắng nghe thông điệp gửi từ content script.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== 'object') {
    return false;
  }

  // Tải trực tiếp (ảnh hoặc video mp4 file thường)
  if (message.type === 'DVI_DIRECT') {
    handleDirectDownload(message)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ ok: false, error: err.message || String(err) }));
    return true; // Phản hồi bất đồng bộ
  }

  // Tải qua yt-dlp Native Host (video stream / mạng xã hội)
  if (message.type === 'DVI_YTDLP') {
    const jobId = crypto.randomUUID();
    sendResponse({ ok: true, jobId });

    startYtDlpJob({
      jobId,
      url: message.url,
      platform: message.platform,
      quality: message.quality || 'compatible',
      tabId: sender.tab ? sender.tab.id : null,
      frameId: sender.frameId || 0
    });
    return true;
  }

  return false;
});

/**
 * Thực hiện tải trực tiếp media bằng API chrome.downloads.
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

/**
 * Thu thập cookie đăng nhập của nền tảng tương ứng để gửi cho yt-dlp.
 * Lưu ý: Không gửi cookie của YouTube theo thiết kế.
 */
async function getCookiesForPlatform(platform) {
  if (!platform || platform === 'youtube' || !COOKIE_DOMAINS[platform]) {
    return [];
  }

  if (!chrome.cookies) {
    return [];
  }

  const domains = COOKIE_DOMAINS[platform];
  const cookieList = [];
  const seen = new Set();

  for (const domain of domains) {
    try {
      const cookies = await chrome.cookies.getAll({ domain });
      for (const c of cookies) {
        const key = `${c.domain}|${c.path}|${c.name}`;
        if (!seen.has(key)) {
          seen.add(key);
          cookieList.push({
            domain: c.domain,
            hostOnly: c.hostOnly,
            path: c.path,
            secure: c.secure,
            expirationDate: c.expirationDate,
            name: c.name,
            value: c.value
          });
        }
      }
    } catch {
      // Bỏ qua lỗi đọc cookie từng domain
    }
  }

  return cookieList;
}

/**
 * Trích xuất tên file rút gọn từ đường dẫn tuyệt đối (Windows hoặc Unix).
 */
function getBaseName(filePath) {
  if (!filePath || typeof filePath !== 'string') return 'Video';
  const parts = filePath.split(/[/\\]/);
  return parts[parts.length - 1] || 'Video';
}

/**
 * Gửi message về tab chứa nút tải (nếu tab và frame còn tồn tại).
 */
function sendToTab(tabId, frameId, msg) {
  if (tabId === null || tabId === undefined) return;
  try {
    chrome.tabs.sendMessage(tabId, msg, { frameId }, () => {
      // Bỏ qua lỗi nếu tab hoặc frame đã bị đóng / chuyển hướng
      if (chrome.runtime.lastError) {}
    });
  } catch {}
}

/**
 * Quản lý vòng đời của một tác vụ tải qua yt-dlp Native Host.
 */
async function startYtDlpJob({ jobId, url, platform, quality, tabId, frameId }) {
  updateBadge(1);

  let finished = false;
  function finishJob() {
    if (!finished) {
      finished = true;
      updateBadge(-1);
    }
  }

  let port;
  try {
    port = chrome.runtime.connectNative(NATIVE_HOST_NAME);
  } catch (err) {
    finishJob();
    const errMsg = 'Chưa cài trình hỗ trợ — chạy native-host\\setup.bat';
    sendToTab(tabId, frameId, { type: 'DVI_ERROR', jobId, message: errMsg });
    notifyError(errMsg);
    return;
  }

  // Xử lý mất kết nối cổng Native Host
  port.onDisconnect.addListener(() => {
    if (finished) return;
    finishJob();

    let errMsg = 'Trình hỗ trợ dừng đột ngột';
    if (chrome.runtime.lastError) {
      const lastMsg = chrome.runtime.lastError.message || '';
      if (lastMsg.includes('not found') || lastMsg.includes('specified native messaging host')) {
        errMsg = 'Chưa cài trình hỗ trợ — chạy native-host\\setup.bat';
      }
    }

    sendToTab(tabId, frameId, { type: 'DVI_ERROR', jobId, message: errMsg });
    notifyError(errMsg);
  });

  // Lắng nghe dữ liệu tiến độ và kết quả từ Native Host
  port.onMessage.addListener((msg) => {
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'progress') {
      sendToTab(tabId, frameId, {
        type: 'DVI_PROGRESS',
        jobId,
        percent: msg.percent
      });
      return;
    }

    if (msg.type === 'done') {
      finishJob();
      sendToTab(tabId, frameId, {
        type: 'DVI_DONE',
        jobId,
        file: msg.file,
        vcodec: msg.vcodec,
        height: msg.height
      });
      notifyDone(msg.file, msg.vcodec, msg.height);
      try { port.disconnect(); } catch {}
      return;
    }

    if (msg.type === 'error') {
      finishJob();
      const errMsg = msg.message || 'Lỗi tải video';
      sendToTab(tabId, frameId, {
        type: 'DVI_ERROR',
        jobId,
        message: errMsg
      });
      notifyError(errMsg);
      try { port.disconnect(); } catch {}
      return;
    }
  });

  // Thu thập cookie và gửi lệnh download tới Host
  try {
    const cookies = await getCookiesForPlatform(platform);
    port.postMessage({
      action: 'download',
      url,
      quality,
      cookies
    });
  } catch (e) {
    finishJob();
    const errMsg = e.message || 'Lỗi kết nối Native Host';
    sendToTab(tabId, frameId, { type: 'DVI_ERROR', jobId, message: errMsg });
    notifyError(errMsg);
    try { port.disconnect(); } catch {}
  }
}

/**
 * Hiển thị thông báo khi tải xong (kèm gợi ý trình phát VLC nếu là video 2K/4K).
 */
function notifyDone(filePath, vcodec, height) {
  if (!chrome.notifications) return;

  const fileName = getBaseName(filePath);
  const isHighResOrNewCodec =
    (typeof height === 'number' && height > 1080) ||
    (typeof vcodec === 'string' && /av01|vp09|vp9/i.test(vcodec));

  let message = fileName;
  const buttons = [];

  if (isHighResOrNewCodec) {
    message += '\nVideo 2K/4K (AV1/VP9) — nếu không mở được, hãy dùng VLC';
    buttons.push({ title: 'Tải VLC' });
  }

  const notifOptions = {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Tải xong',
    message,
    priority: 1
  };

  if (buttons.length > 0) {
    notifOptions.buttons = buttons;
  }

  const notifId = `dvi-done-${Date.now()}`;
  chrome.notifications.create(notifId, notifOptions);
}

/**
 * Hiển thị thông báo khi tải thất bại.
 */
function notifyError(errorMessage) {
  if (!chrome.notifications) return;

  chrome.notifications.create(`dvi-error-${Date.now()}`, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Tải thất bại',
    message: errorMessage,
    priority: 1
  });
}

// Bắt sự kiện click vào nút hành động trên thông báo (ví dụ nút "Tải VLC")
if (chrome.notifications && chrome.notifications.onButtonClicked) {
  chrome.notifications.onButtonClicked.addListener((notifId, buttonIndex) => {
    if (buttonIndex === 0 && notifId.startsWith('dvi-done-')) {
      chrome.tabs.create({ url: 'https://www.videolan.org/vlc/' });
    }
  });
}
