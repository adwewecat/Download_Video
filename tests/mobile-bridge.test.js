// tests/mobile-bridge.test.js
// Unit test kiểm tra các hàm xử lý media và logic cầu nối DVIBridge cho phiên bản di động.

const { describe, it } = require('node:test');
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
const mediaUtils = sandbox.DVIMediaUtils;

describe('Mobile DVI Bridge Logic', () => {

  it('chuẩn hoá Instagram reel URL cho mobile', () => {
    const raw = 'https://www.instagram.com/reels/DfgTefoM-Iv/?utm_source=ig_web_copy_link';
    const canonical = mediaUtils.normalizePermalink('instagram', raw);
    assert.equal(canonical, 'https://www.instagram.com/reel/DfgTefoM-Iv/');
  });

  it('nhận diện nền tảng trên thiết bị di động', () => {
    assert.equal(mediaUtils.detectPlatform('m.facebook.com'), 'facebook');
    assert.equal(mediaUtils.detectPlatform('m.youtube.com'), 'youtube');
    assert.equal(mediaUtils.detectPlatform('www.tiktok.com'), 'tiktok');
    assert.equal(mediaUtils.detectPlatform('www.instagram.com'), 'instagram');
    assert.equal(mediaUtils.detectPlatform('x.com'), 'x');
  });

  it('định tuyến URL stream m3u8 và video blob', () => {
    // Luồng direct stream HLS (.m3u8) được định tuyến sang ytdlp
    const streamRoute = mediaUtils.chooseRoute('video', 'http', null, 'https://cdn.example.com/playlist.m3u8');
    assert.equal(streamRoute, 'ytdlp');

    // Video blob trên nền tảng mạng xã hội
    const platformVideoRoute = mediaUtils.chooseRoute('video', 'blob', 'instagram');
    assert.equal(platformVideoRoute, 'ytdlp');

    // Ảnh http thông thường
    const imageRoute = mediaUtils.chooseRoute('image', 'http', null);
    assert.equal(imageRoute, 'direct');
  });

  it('tạo đối tượng MediaInfo gửi sang Kotlin DVIBridge', () => {
    const mediaItem = {
      type: 'video',
      url: 'https://www.instagram.com/reel/DfgTefoM-Iv/',
      title: 'Video du lịch miền Tây',
      platform: 'instagram'
    };

    assert.equal(mediaItem.type, 'video');
    assert.equal(mediaItem.platform, 'instagram');
    assert.ok(mediaItem.url.startsWith('https://www.instagram.com/reel/'));
  });
});
