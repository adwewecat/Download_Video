/**
 * Unit test cho extension/content/media-utils.js (các hàm thuần, không phụ thuộc DOM).
 * Chạy: node --test tests/
 *
 * media-utils.js là content script (không phải module), nên được nạp vào một
 * sandbox `vm` và lấy ra qua biến toàn cục `DVIMediaUtils`.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'extension', 'content', 'media-utils.js'),
  'utf8'
);
const sandbox = { URL };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
const U = sandbox.DVIMediaUtils;

const BASE = 'https://example.com/gallery/page.html';

test('pickLargestFromSrcset: chọn ứng viên có độ rộng (w) lớn nhất', () => {
  const srcset = 'small.jpg 320w, /img/large.jpg 1280w, medium.jpg 640w';
  assert.equal(U.pickLargestFromSrcset(srcset, BASE), 'https://example.com/img/large.jpg');
});

test('pickLargestFromSrcset: chọn mật độ (x) lớn nhất', () => {
  const srcset = 'a.jpg, b.jpg 2x, c.jpg 1.5x';
  assert.equal(U.pickLargestFromSrcset(srcset, BASE), 'https://example.com/gallery/b.jpg');
});

test('pickLargestFromSrcset: URL có dấu phẩy bên trong vẫn tách đúng', () => {
  const srcset = 'https://cdn.x.com/i/w_300,h_200/p.jpg 300w, https://cdn.x.com/i/w_900,h_600/p.jpg 900w';
  assert.equal(U.pickLargestFromSrcset(srcset, BASE), 'https://cdn.x.com/i/w_900,h_600/p.jpg');
});

test('pickLargestFromSrcset: rỗng hoặc không hợp lệ trả về null', () => {
  assert.equal(U.pickLargestFromSrcset('', BASE), null);
  assert.equal(U.pickLargestFromSrcset(undefined, BASE), null);
  assert.equal(U.pickLargestFromSrcset('   ', BASE), null);
});

test('extractCssUrl: lấy URL đầu tiên trong background-image', () => {
  assert.equal(U.extractCssUrl('url("https://a.com/b.png")'), 'https://a.com/b.png');
  assert.equal(U.extractCssUrl("url('https://a.com/c.jpg')"), 'https://a.com/c.jpg');
  assert.equal(U.extractCssUrl('url(https://a.com/d.webp)'), 'https://a.com/d.webp');
  assert.equal(
    U.extractCssUrl('linear-gradient(red, blue), url("https://a.com/e.png")'),
    'https://a.com/e.png'
  );
});

test('extractCssUrl: không có ảnh trả về null', () => {
  assert.equal(U.extractCssUrl('none'), null);
  assert.equal(U.extractCssUrl('linear-gradient(red, blue)'), null);
  assert.equal(U.extractCssUrl(''), null);
});

test('getUrlKind: phân loại scheme của URL', () => {
  assert.equal(U.getUrlKind('https://a.com/v.mp4'), 'http');
  assert.equal(U.getUrlKind('http://a.com/i.jpg'), 'http');
  assert.equal(U.getUrlKind('data:image/png;base64,AAAA'), 'data');
  assert.equal(U.getUrlKind('blob:https://a.com/1234-5678'), 'blob');
  assert.equal(U.getUrlKind(''), 'none');
  assert.equal(U.getUrlKind(null), 'none');
  assert.equal(U.getUrlKind('javascript:alert(1)'), 'none');
});

test('filenameForDataUrl: đặt tên theo loại media + đuôi từ MIME', () => {
  const now = new Date(2026, 10, 8, 13, 5, 9);
  assert.equal(
    U.filenameForDataUrl('data:image/png;base64,AAAA', 'image', now),
    'image-20261108-130509.png'
  );
  assert.equal(
    U.filenameForDataUrl('data:image/jpeg;base64,AAAA', 'image', now),
    'image-20261108-130509.jpg'
  );
  assert.equal(
    U.filenameForDataUrl('data:image/svg+xml;utf8,<svg/>', 'image', now),
    'image-20261108-130509.svg'
  );
  assert.equal(
    U.filenameForDataUrl('data:video/mp4;base64,AAAA', 'video', now),
    'video-20261108-130509.mp4'
  );
});

test('filenameForDataUrl: MIME lạ/thiếu dùng đuôi mặc định theo loại media', () => {
  const now = new Date(2026, 0, 2, 3, 4, 5);
  assert.equal(U.filenameForDataUrl('data:,hello', 'image', now), 'image-20260102-030405.jpg');
  assert.equal(U.filenameForDataUrl('data:,hello', 'video', now), 'video-20260102-030405.mp4');
});

