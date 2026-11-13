/**
 * Kiểm thử hồi quy bảo mật CSP, cấu hình MV3 và hành vi Chrome API an toàn.
 * Chạy: node --test "tests/*.test.js"
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'extension', 'manifest.json');
const PROBE_PATH = path.join(ROOT, 'extension', 'content', 'page-probe.js');
const CONTENT_PATH = path.join(ROOT, 'extension', 'content', 'content.js');
const BACKGROUND_PATH = path.join(ROOT, 'extension', 'background.js');
const MOBILE_PATH = path.join(ROOT, 'android-app', 'app', 'src', 'main', 'assets', 'dvi_mobile_content.js');

test('manifest.json: khai báo page-probe.js chạy ở MAIN world và file tồn tại', () => {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const scripts = manifest.content_scripts || [];
  const mainScript = scripts.find(
    (entry) => Array.isArray(entry.js) && entry.js.includes('content/page-probe.js')
  );
  assert.ok(mainScript, 'manifest phải khai báo content/page-probe.js');
  assert.equal(mainScript.world, 'MAIN');
  assert.equal(mainScript.all_frames, true);
  assert.equal(fs.existsSync(PROBE_PATH), true);
});

test('page-probe.js: phát hiện stream từ jwplayer/__SRC và phản hồi __dvi_probe_request', () => {
  const probeCode = fs.readFileSync(PROBE_PATH, 'utf8');
  const emittedUrls = [];
  const listeners = new Map();

  class MockCustomEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail;
    }
  }

  const windowObj = {
    jwplayer() {
      return {
        getPlaylist() {
          return [{ file: 'https://cdn.example.com/live/master.m3u8' }];
        },
        on() {}
      };
    },
    __SRC: [{ file: 'https://cdn.example.com/backup.vl' }],
    addEventListener(type, fn) {
      listeners.set(type, fn);
    },
    dispatchEvent(evt) {
      if (evt.type === '__dvi_stream_found' && evt.detail && evt.detail.url) {
        emittedUrls.push(evt.detail.url);
      } else if (listeners.has(evt.type)) {
        listeners.get(evt.type)(evt);
      }
      return true;
    }
  };

  const sandbox = {
    window: windowObj,
    CustomEvent: MockCustomEvent,
    setTimeout: () => 0
  };
  vm.createContext(sandbox);
  vm.runInContext(probeCode, sandbox);

  assert.equal(emittedUrls.includes('https://cdn.example.com/live/master.m3u8'), true);
  assert.equal(emittedUrls.includes('https://cdn.example.com/backup.vl'), true);

  const countBefore = emittedUrls.length;
  windowObj.dispatchEvent(new MockCustomEvent('__dvi_probe_request'));
  assert.ok(emittedUrls.length > countBefore, 'Phải phát lại stream khi nhận __dvi_probe_request');
});

test('content.js: không chèn inline <script>, không dùng innerHTML, không gán style.cssText', () => {
  const contentSource = fs.readFileSync(CONTENT_PATH, 'utf8');
  assert.equal(/createElement\(\s*['"]script['"]\s*\)/i.test(contentSource), false);
  assert.equal(/\.appendChild\(\s*probe\s*\)/i.test(contentSource), false);
  assert.equal(/\.innerHTML\s*=/.test(contentSource), false);
  assert.equal(/\.style\.cssText\s*=/.test(contentSource), false);
  assert.equal(/referer:\s*window\.location\.href/.test(contentSource.match(/type:\s*'DVI_DIRECT'[^}]*/g)?.join(' ') || ''), false);
});

test('background.js: handleDirectDownload không truyền Referer header vào chrome.downloads.download', () => {
  const bgSource = fs.readFileSync(BACKGROUND_PATH, 'utf8');
  assert.equal(/options\.headers\s*=/.test(bgSource), false);
  assert.equal(/name:\s*['"]Referer['"]/.test(bgSource), false);
});

test('mobile script: siết chặt bộ lọc Zalo CDN tránh khớp URL API/font chứa chữ video', () => {
  const mobileSource = fs.readFileSync(MOBILE_PATH, 'utf8');
  assert.equal(/\/video\/i\.test\(name\)/.test(mobileSource), false);
  assert.equal(/videoplayback\|getvideo/.test(mobileSource), true);
});

