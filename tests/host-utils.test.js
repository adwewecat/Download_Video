/**
 * tests/host-utils.test.js
 * Unit test kiểm thử các hàm tiện ích PowerShell trong native-host/HostUtils.psm1.
 * Gọi powershell.exe thực tế để kiểm tra môi trường Windows.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const modulePath = path.resolve(__dirname, '..', 'native-host', 'HostUtils.psm1');

/**
 * Thực thi lệnh PowerShell với module HostUtils đã được nạp.
 */
function ps(command) {
  const script = `
    $OutputEncoding = [System.Text.Encoding]::UTF8
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    Import-Module '${modulePath.replace(/'/g, "''")}'
    ${command}
  `;
  const stdout = execFileSync('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
    script
  ], { encoding: 'utf8' });
  return stdout.trim();
}

test('Read/Write-NativeMessage: ghi và đọc message UTF-8 (Round-trip)', () => {
  const cmd = `
    $ms = New-Object System.IO.MemoryStream
    $payload = [PSCustomObject]@{ title = 'Nhạc Trịnh 🎵'; count = 10 }
    Write-NativeMessage -Stream $ms -Object $payload
    $ms.Position = 0
    $read = Read-NativeMessage -Stream $ms
    [PSCustomObject]@{ ok = ($read.title -eq 'Nhạc Trịnh 🎵' -and $read.count -eq 10) } | ConvertTo-Json -Compress
  `;
  const result = JSON.parse(ps(cmd));
  assert.equal(result.ok, true);
});

test('Read-NativeMessage: stream rỗng trả về $null', () => {
  const cmd = `
    $ms = New-Object System.IO.MemoryStream
    $read = Read-NativeMessage -Stream $ms
    [PSCustomObject]@{ isNull = ($null -eq $read) } | ConvertTo-Json -Compress
  `;
  const result = JSON.parse(ps(cmd));
  assert.equal(result.isNull, true);
});

test('ConvertTo-NetscapeCookieText: định dạng cookie chuẩn Netscape', () => {
  const cmd = `
    $cookies = @(
      [PSCustomObject]@{ domain = '.x.com'; hostOnly = $false; path = '/'; secure = $true; expirationDate = 1893456000.5; name = 'auth'; value = 'v' },
      [PSCustomObject]@{ domain = 'x.com'; hostOnly = $true; path = '/'; secure = $false; name = 's'; value = 'w' }
    )
    $text = ConvertTo-NetscapeCookieText -Cookies $cookies
    $lines = $text -split "\r?\n"
    [PSCustomObject]@{
      header = $lines[0]
      line1 = $lines[1]
      line2 = $lines[2]
    } | ConvertTo-Json -Compress
  `;
  const res = JSON.parse(ps(cmd));
  assert.equal(res.header, '# Netscape HTTP Cookie File');
  assert.equal(res.line1, '.x.com\tTRUE\t/\tTRUE\t1893456000\tauth\tv');
  assert.equal(res.line2, 'x.com\tFALSE\t/\tFALSE\t0\ts\tw');
});

test('Get-ProgressPercent: đọc phần trăm tiến độ từ dòng log yt-dlp', () => {
  const cmd = `
    $p1 = Get-ProgressPercent -Line 'download:[dvi]   42.5%'
    $p2 = Get-ProgressPercent -Line '[dvi] 100%'
    $p3 = Get-ProgressPercent -Line '[download] Destination: file.mp4'
    [PSCustomObject]@{
      p1 = $p1
      p2 = $p2
      p3 = ($null -eq $p3)
    } | ConvertTo-Json -Compress
  `;
  const res = JSON.parse(ps(cmd));
  assert.equal(res.p1, 42.5);
  assert.equal(res.p2, 100);
  assert.equal(res.p3, true);
});

test('Get-FinalFilePath: đọc đường dẫn file sau khi gộp xong', () => {
  const cmd = `
    $f1 = Get-FinalFilePath -Line 'after_move:[dvifile]D:\\Downloads\\Nhạc Trịnh 🎵 [abc].mp4'
    $f2 = Get-FinalFilePath -Line '[dvifile]C:\\file.mp4'
    $f3 = Get-FinalFilePath -Line 'random log message'
    [PSCustomObject]@{
      f1 = $f1
      f2 = $f2
      f3 = ($null -eq $f3)
    } | ConvertTo-Json -Compress
  `;
  const res = JSON.parse(ps(cmd));
  assert.equal(res.f1, 'D:\\Downloads\\Nhạc Trịnh 🎵 [abc].mp4');
  assert.equal(res.f2, 'C:\\file.mp4');
  assert.equal(res.f3, true);
});

test('Get-MetaInfo: đọc codec và độ cao video', () => {
  const cmd = `
    $m1 = Get-MetaInfo -Line 'after_move:[dvimeta]av01.0.08M.08;2160'
    $m2 = Get-MetaInfo -Line 'other'
    [PSCustomObject]@{
      vcodec = $m1.vcodec
      height = $m1.height
      m2Null = ($null -eq $m2)
    } | ConvertTo-Json -Compress
  `;
  const res = JSON.parse(ps(cmd));
  assert.equal(res.vcodec, 'av01.0.08M.08');
  assert.equal(res.height, 2160);
  assert.equal(res.m2Null, true);
});

test('Join-ProcessArguments: trích dẫn dòng lệnh chuẩn Windows CommandLineToArgvW', () => {
  const cmd = `
    $args1 = @('a', 'b c', '', 'say "hi"', 'C:\\dir\\')
    $res1 = Join-ProcessArguments -Arguments $args1
    $args2 = @('C:\\my dir\\')
    $res2 = Join-ProcessArguments -Arguments $args2
    [PSCustomObject]@{
      res1 = $res1
      res2 = $res2
    } | ConvertTo-Json -Compress
  `;
  const res = JSON.parse(ps(cmd));
  assert.equal(res.res1, 'a "b c" "" "say \\"hi\\"" C:\\dir\\');
  assert.equal(res.res2, '"C:\\my dir\\\\"');
});

test('Get-YtDlpArguments: tạo danh sách tham số chuẩn theo quality và cookie', () => {
  const cmd = `
    $a1 = Get-YtDlpArguments -Url 'https://yt.com/watch?v=1' -OutDir 'D:\\Down' -CookieFile 'C:\\temp\\c.txt' -Quality 'compatible'
    $a2 = Get-YtDlpArguments -Url 'https://yt.com/watch?v=1' -OutDir 'D:\\Down' -CookieFile $null -Quality 'best'
    [PSCustomObject]@{
      a1 = $a1
      a2 = $a2
    } | ConvertTo-Json -Compress
  `;
  const res = JSON.parse(ps(cmd));
  assert.ok(res.a1.includes('vcodec:h264,res,acodec:m4a'));
  assert.ok(res.a1.includes('--cookies'));
  assert.equal(res.a1[res.a1.length - 2], '--');
  assert.equal(res.a1[res.a1.length - 1], 'https://yt.com/watch?v=1');

  assert.ok(res.a2.includes('res,ext:mp4:m4a'));
  assert.ok(!res.a2.includes('--cookies'));
});

test('Get-ExtensionIdFromKey: khớp chính xác ID extension từ key manifest', () => {
  const manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'extension', 'manifest.json'), 'utf8'));
  const base64Key = manifest.key;

  // Tính bằng Node
  const der = Buffer.from(base64Key, 'base64');
  const hash = crypto.createHash('sha256').update(der).digest();
  const expectedId = hash.subarray(0, 16).toString('hex').split('').map(x => String.fromCharCode('a'.charCodeAt(0) + parseInt(x, 16))).join('');

  const cmd = `
    $id = Get-ExtensionIdFromKey -Base64Key '${base64Key}'
    [PSCustomObject]@{ id = $id } | ConvertTo-Json -Compress
  `;
  const res = JSON.parse(ps(cmd));
  assert.equal(res.id, expectedId);
  assert.equal(res.id, 'fdihdhkhfagoplcfmcpkjjpklcinfmbn');
});

test('Get-DownloadsFolder: trả về thư mục Downloads tồn tại', () => {
  const cmd = `
    $dir = Get-DownloadsFolder
    $exists = Test-Path $dir
    [PSCustomObject]@{ dir = $dir; exists = $exists } | ConvertTo-Json -Compress
  `;
  const res = JSON.parse(ps(cmd));
  assert.equal(res.exists, true);
});
