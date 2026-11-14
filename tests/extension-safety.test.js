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
const UTILS_PATH = path.join(ROOT, 'extension', 'content', 'media-utils.js');

test('tất cả script JS của extension và mobile phải hợp lệ cú pháp (không SyntaxError)', () => {
  const jsFiles = [
    BACKGROUND_PATH,
    UTILS_PATH,
    CONTENT_PATH,
    PROBE_PATH,
    MOBILE_PATH
  ];
  for (const filePath of jsFiles) {
    const code = fs.readFileSync(filePath, 'utf8');
    assert.doesNotThrow(() => new vm.Script(code, { filename: filePath }), `Lỗi cú pháp trong ${filePath}`);
  }
});

test('content.js: khởi tạo UI Shadow DOM an toàn CSP và hiện nút download khi hover video', () => {
  const utilsCode = fs.readFileSync(UTILS_PATH, 'utf8');
  const contentCode = fs.readFileSync(CONTENT_PATH, 'utf8');

  function createClassList() {
    const set = new Set();
    return {
      add(...tokens) { tokens.forEach((t) => set.add(t)); },
      remove(...tokens) { tokens.forEach((t) => set.delete(t)); },
      contains(t) { return set.has(t); }
    };
  }

  function createElementStub(tagName) {
    const children = [];
    const listeners = new Map();
    const attrs = new Map();
    const styleProps = new Map();
    const classList = createClassList();

    const style = {
      display: '',
      left: '',
      top: '',
      setProperty(k, v) { styleProps.set(k, v); },
      getPropertyValue(k) { return styleProps.get(k) || ''; }
    };

    const el = {
      tagName: String(tagName || 'div').toUpperCase(),
      id: '',
      title: '',
      textContent: '',
      children,
      style,
      classList,
      isConnected: true,
      offsetWidth: 160,
      offsetHeight: 34,
      set className(val) {
        String(val || '').split(/\s+/).filter(Boolean).forEach((t) => classList.add(t));
      },
      get className() {
        return '';
      },
      setAttribute(k, v) { attrs.set(k, String(v)); },
      getAttribute(k) { return attrs.get(k) || null; },
      appendChild(child) {
        children.push(child);
        return child;
      },
      append(...nodes) {
        nodes.forEach((n) => children.push(n));
      },
      contains(target) {
        if (target === el) return true;
        return children.some((c) => c === target || (c.contains && c.contains(target)));
      },
      addEventListener(type, fn) {
        if (!listeners.has(type)) listeners.set(type, []);
        listeners.get(type).push(fn);
      },
      querySelector(sel) {
        if (sel === '.dvi-busy-text') {
          for (const c of children) {
            if (c.classList && c.classList.contains('dvi-busy-text')) return c;
          }
        }
        return null;
      },
      querySelectorAll() { return []; },
      getBoundingClientRect() {
        return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
      },
      attachShadow() {
        const shadowChildren = [];
        const shadowRoot = {
          adoptedStyleSheets: [],
          children: shadowChildren,
          appendChild(node) {
            shadowChildren.push(node);
            return node;
          }
        };
        el._shadow = shadowRoot;
        return shadowRoot;
      }
    };
    return el;
  }

  const windowListeners = new Map();
  const documentListeners = new Map();
  const bodyChildren = [];
  const videoEl = createElementStub('video');
  videoEl.currentSrc = 'blob:https://www.youtube.com/abc-123';
  videoEl.getBoundingClientRect = () => ({ left: 100, top: 80, right: 900, bottom: 530, width: 800, height: 450 });

  const body = {
    children: bodyChildren,
    contains(node) { return bodyChildren.includes(node); },
    appendChild(node) { bodyChildren.push(node); return node; }
  };

  let rafQueue = [];
  class MockCSSStyleSheet {
    replaceSync(text) { this.cssText = text; }
  }
  class MockCustomEvent {
    constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
  }

  const sandbox = {
    URL,
    CSSStyleSheet: MockCSSStyleSheet,
    CustomEvent: MockCustomEvent,
    WeakMap,
    Map,
    Set,
    setTimeout: () => 0,
    requestAnimationFrame(cb) { rafQueue.push(cb); },
    chrome: {
      runtime: {
        id: 'test-extension-id',
        onMessage: { addListener() {} },
        sendMessage() {}
      }
    },
    window: {
      innerWidth: 1280,
      innerHeight: 800,
      location: { hostname: 'www.youtube.com', href: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
      addEventListener(type, fn) {
        if (!windowListeners.has(type)) windowListeners.set(type, []);
        windowListeners.get(type).push(fn);
      },
      dispatchEvent() { return true; },
      getComputedStyle() { return { backgroundImage: 'none' }; }
    },
    document: {
      readyState: 'complete',
      title: 'YouTube Video Test',
      baseURI: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      body,
      documentElement: body,
      scripts: [],
      createElement: createElementStub,
      createElementNS(_ns, tag) { return createElementStub(tag); },
      addEventListener(type, fn) {
        if (!documentListeners.has(type)) documentListeners.set(type, []);
        documentListeners.get(type).push(fn);
      },
      elementsFromPoint() { return [videoEl]; }
    }
  };
  sandbox.globalThis = sandbox;
  sandbox.window.document = sandbox.document;
  sandbox.window.window = sandbox.window;

  vm.createContext(sandbox);
  vm.runInContext(utilsCode, sandbox);
  sandbox.window.DVIMediaUtils = sandbox.DVIMediaUtils;
  vm.runInContext(contentCode, sandbox);

  // Kiểm tra container đã được gắn vào body và dùng adoptedStyleSheets (không chèn thẻ <style>)
  assert.equal(bodyChildren.length, 1);
  const container = bodyChildren[0];
  assert.equal(container.id, 'dvi-root-container');
  assert.equal(container._shadow.adoptedStyleSheets.length, 1);

  const bar = container._shadow.children.find((c) => c.classList.contains('dvi-bar'));
  assert.ok(bar, 'Phải tạo thanh công cụ .dvi-bar bên trong Shadow DOM');

  // Giả lập rê chuột qua thẻ video và chạy rAF
  const mouseMoveHandlers = windowListeners.get('mousemove') || [];
  assert.ok(mouseMoveHandlers.length > 0);
  mouseMoveHandlers.forEach((fn) => fn({ clientX: 200, clientY: 200 }));
  rafQueue.splice(0).forEach((cb) => cb());

  assert.equal(bar.classList.contains('visible'), true);
  assert.equal(bar.style.left, '108px');
  const buttons = bar.children.filter((c) => c.classList.contains('dvi-btn'));
  assert.equal(buttons.length, 3);
  assert.equal(buttons[1].style.display, 'inline-flex'); // MAX
  assert.equal(buttons[2].style.display, 'inline-flex'); // MP3
});

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

