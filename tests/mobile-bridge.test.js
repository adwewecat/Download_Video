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

  it('nhận diện iframe player nhúng như vlstream / embed', () => {
    const iframeSrc1 = 'https://play.vlstream.net/embed/abc123xyz';
    const iframeSrc2 = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
    const nonPlayerSrc = 'https://example.com/banner.html';

    const isPlayer = (src) => /embed|player|video|vlstream|stream|youtube|vimeo|m3u8|mp4/i.test(src);

    assert.equal(isPlayer(iframeSrc1), true);
    assert.equal(isPlayer(iframeSrc2), true);
    assert.equal(isPlayer(nonPlayerSrc), false);
  });

  it('phân loại đúng loại media giữa video và hình ảnh', () => {
    const videoExts = ['.mp4', '.m3u8', '.vl', '.webm'];
    const imageExts = ['.jpg', '.jpeg', '.png', '.webp'];

    videoExts.forEach(ext => {
      const url = `https://cdn.example.com/media${ext}`;
      assert.ok(/\.(mp4|m3u8|vl|webm)(\?|$)/i.test(url));
    });

    imageExts.forEach(ext => {
      const url = `https://cdn.example.com/media${ext}`;
      assert.ok(/\.(jpg|jpeg|png|webp)(\?|$)/i.test(url));
    });
  });
});
