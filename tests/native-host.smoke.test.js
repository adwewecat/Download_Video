/**
 * tests/native-host.smoke.test.js
 * Smoke test giao thức Native Messaging thực tế qua host.bat.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { spawn } = require('node:child_process');

const hostBat = path.resolve(__dirname, '..', 'native-host', 'host.bat');
const ytdlpBin = path.resolve(__dirname, '..', 'native-host', 'bin', 'yt-dlp.exe');

/**
 * Gửi một message tới host.bat và nhận danh sách tất cả các response trả về cho đến khi process kết thúc.
 */
function sendNativeMessage(messageObj) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `"${hostBat}"`], {
      windowsVerbatimArguments: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const responses = [];
    let buffer = Buffer.alloc(0);

    child.stdout.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);

      while (buffer.length >= 4) {
        const msgLen = buffer.readUInt32LE(0);
        if (buffer.length < 4 + msgLen) {
          break; // Chưa đủ cả gói tin
        }

        const jsonBytes = buffer.subarray(4, 4 + msgLen);
        buffer = buffer.subarray(4 + msgLen);

        try {
          const parsed = JSON.parse(jsonBytes.toString('utf8'));
          responses.push(parsed);
        } catch (e) {
          reject(new Error(`JSON decode error: ${e.message}`));
        }
      }
    });

    let stderrOutput = '';
    child.stderr.on('data', (chunk) => {
      stderrOutput += chunk.toString('utf8');
    });

    child.on('error', (err) => reject(err));
    child.on('close', (code) => {
      resolve({ code, responses, stderr: stderrOutput });
    });

    // Gửi message
    const jsonStr = JSON.stringify(messageObj);
    const bodyBytes = Buffer.from(jsonStr, 'utf8');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32LE(bodyBytes.length, 0);

    child.stdin.write(lenBuf);
    child.stdin.write(bodyBytes);
    child.stdin.end();
  });
}

test('Native Host Smoke: ping trả về pong', async () => {
  const res = await sendNativeMessage({ action: 'ping' });
  assert.equal(res.code, 0, `Process exited with ${res.code}: ${res.stderr}`);
  assert.ok(res.responses.length >= 1);
  const pong = res.responses[0];
  assert.equal(pong.type, 'pong');
  assert.equal(pong.version, '1.0.0');
  assert.ok('ffmpeg' in pong);
  assert.ok('deno' in pong);
});

test('Native Host Smoke: open_folder trả về ok', async () => {
  const res = await sendNativeMessage({ action: 'open_folder', path: '' });
  assert.equal(res.code, 0);
  assert.ok(res.responses.length >= 1);
  assert.equal(res.responses[0].type, 'ok');
});

test('Native Host Smoke: download video lỗi & dọn sạch cookie tạm', { skip: !fs.existsSync(ytdlpBin) }, async () => {
  const fakeCookie = [
    {
      domain: '.youtube.com',
      hostOnly: false,
      path: '/',
      secure: true,
      name: 'test_token',
      value: 'secret123'
    }
  ];

  const res = await sendNativeMessage({
    action: 'download',
    url: 'https://www.youtube.com/watch?v=__non_existent_123456789__',
    cookies: fakeCookie,
    noPrompt: true
  });

  assert.ok(res.responses.length >= 1);
  const lastMsg = res.responses[res.responses.length - 1];
  assert.equal(lastMsg.type, 'error');
  assert.ok(lastMsg.message && lastMsg.message.length > 0);

  // Review Focus 4: Đảm bảo không còn bất kỳ file dvi-cookies-*.txt nào trong %TEMP%
  const tmpFiles = fs.readdirSync(os.tmpdir());
  const lingeringCookies = tmpFiles.filter((f) => f.startsWith('dvi-cookies-'));
  assert.equal(lingeringCookies.length, 0, `Tìm thấy cookie tạm chưa được xoá: ${lingeringCookies.join(', ')}`);
});
