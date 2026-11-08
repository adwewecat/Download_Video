# Download_Video_Image — Kế hoạch triển khai

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chrome extension (MV3) hiện nút Download trên mọi ảnh/video; ảnh + video file thường tải trực tiếp, video nền tảng/stream tải qua yt-dlp trên máy.

**Architecture:** Content script vẽ một nút nổi (Shadow DOM) trên media dưới con trỏ và quyết định đường tải. Service worker tải trực tiếp bằng `chrome.downloads`, hoặc mở cổng Native Messaging tới host PowerShell chạy yt-dlp + ffmpeg + Deno, chuyển tiến độ về tab. `setup.bat` cài công cụ và đăng ký host một lần.

**Tech Stack:** JavaScript thuần (không build), Chrome MV3, Windows PowerShell 5.1, yt-dlp, ffmpeg, Deno, test bằng `node --test` (Node ≥ 20, không dependency).

**Spec:** `docs/superpowers/specs/2026-11-08-download-media-extension-design.md`

## Global Constraints

- Quy tắc trong `GEMINI.md` áp dụng cho **mọi task**: ghi nhật ký trước khi làm, comment giải thích mỗi file/hàm quan trọng, không code thừa / `console.log` debug, **commit + `git push origin main` cuối mỗi task**, cập nhật `README.md`/`GEMINI.md` khi đổi tính năng/cấu trúc.
- Không dependency npm; không build step. Test chạy bằng `node --test tests/`.
- Native host name: `com.adwewecat.download_video`.
- Quyền extension: `downloads`, `nativeMessaging`, `cookies`, `notifications`; `host_permissions: ["<all_urls>"]`.
- Media nhỏ hơn **60×60 px** không hiện nút; nút cách mép trên/phải media **8 px**. Video nền tảng/stream hiện **2 nút**: `⬇` (tương thích: H.264+AAC, tối đa 1080p trên YouTube) và `MAX` (2K/4K AV1/VP9 nếu có). Ảnh và video trực tiếp chỉ hiện 1 nút `⬇`.
- yt-dlp: `-f "bv*+ba/b" --merge-output-format mp4 --no-playlist`, tên file `%(title).150B [%(id)s].%(ext)s`, lưu vào known folder Downloads thật. Sắp xếp:
  - `compatible`: `-S "vcodec:h264,res,acodec:m4a"`
  - `best`: `-S "res,ext:mp4:m4a"`
- Cookie chỉ gửi cho nền tảng: X, Instagram, Threads, TikTok, Facebook (**không** gửi cookie YouTube — yt-dlp cảnh báo cookie YouTube bị xoay vòng/đánh dấu; YouTube công khai không cần). File cookie tạm `%TEMP%\dvi-cookies-<guid>.txt`, xoá trong `finally`.
- Chuỗi giao diện (tiếng Việt, dùng đúng nguyên văn):
  - Tooltip: `Tải ảnh` / `Tải video (tương thích cao)` / `Tải video nét nhất (2K/4K)` / `Đang tải… {n}%` / `Đã tải xong`
  - Lỗi: `Chưa cài trình hỗ trợ — chạy native-host\setup.bat` · `Extension vừa cập nhật — hãy tải lại trang (F5)` · `Không tìm thấy nguồn để tải` · `Trình hỗ trợ dừng đột ngột`
  - Thông báo: tiêu đề `Tải xong` (nội dung = tên file; nếu `vcodec` chứa `av01`/`vp09`/`vp9` hoặc `height > 1080` thì thêm dòng `Video 2K/4K (AV1/VP9) — nếu không mở được, hãy dùng VLC` kèm nút thông báo `Tải VLC` dẫn tới `https://www.videolan.org/vlc/`) / `Tải thất bại` (nội dung = lý do)

## Review Focus

1. **Tiêu đề video có tiếng Việt / emoji** (`Nhạc Trịnh 🎵`) → tên file, tiến độ và đường dẫn trả về phải nguyên vẹn UTF-8. *Test ở Task 5 (`Write/Read-NativeMessage` round-trip, `Get-FinalFilePath`).*
2. **Repo clone vào đường dẫn có dấu cách** (`D:\My Projects\...`) → host vẫn chạy, tham số yt-dlp không vỡ. *Test ở Task 5 (`Join-ProcessArguments`), kiểm tay ở Task 7.*
3. **Chưa chạy setup / extension vừa reload** → bấm tải phải báo lỗi rõ, không im lặng. *Kiểm tay ở Task 8 (bước "chưa cài helper").*
4. **yt-dlp lỗi (URL sai, video riêng tư)** → trả `{type:"error"}` với dòng `ERROR:` của yt-dlp và **không còn file `dvi-cookies-*.txt`** trong `%TEMP%`. *Test ở Task 6 (smoke test).*
5. **Rê chuột từ media sang chính nút** → nút không biến mất / nhấp nháy; bấm nút không kích hoạt click của trang (mở bài viết, play/pause). *Kiểm tay ở Task 4.*

---

## File Structure

| File | Trách nhiệm |
|---|---|
| `.gitignore` | Bỏ `native-host/bin/`, `native-host/com.adwewecat.download_video.json`, `node_modules/` |
| `extension/manifest.json` | Khai báo MV3, `key` cố định, quyền, content scripts (`media-utils.js` rồi `content.js`, `all_frames`, `document_idle`) |
| `extension/content/media-utils.js` | Hàm thuần, global `DVIMediaUtils` (đóng băng bằng `Object.freeze`) |
| `extension/content/content.js` | Nút nổi, hit-test, thu thập permalink, gửi lệnh, hiển thị tiến độ |
| `extension/background.js` | Tải trực tiếp, job yt-dlp qua Native Messaging, cookie, badge, notification |
| `extension/icons/icon{16,32,48,128}.png` | Icon (vuông bo góc xanh, mũi tên trắng hướng xuống) |
| `native-host/HostUtils.psm1` | Hàm PowerShell thuần (có test) |
| `native-host/host.ps1` / `host.bat` | Vòng xử lý Native Messaging, chạy yt-dlp |
| `native-host/setup.ps1` / `setup.bat` | Cài yt-dlp/ffmpeg/Deno, ghi manifest host, ghi registry |
| `tests/media-utils.test.js` | (đã có) + test nền tảng/permalink/route |
| `tests/host-utils.test.js` | Test `HostUtils.psm1` qua `powershell.exe` |
| `tests/native-host.smoke.test.js` | Smoke test host thật (tự skip nếu chưa có `native-host/bin/yt-dlp.exe`) |
| `tests/manual/test-page.html` | Trang thử tay: img, srcset, ảnh nền, data:, blob:, mp4 trực tiếp |

---

### Task 1: `media-utils.js` — hàm ảnh & URL (hợp đồng test đã có)

**Files:**
- Create: `.gitignore`, `extension/content/media-utils.js`
- Test: `tests/media-utils.test.js` (đã có, không sửa assertion)

**Interfaces:**
- Produces (trên `globalThis.DVIMediaUtils`):
  - `pickLargestFromSrcset(srcset: string|undefined, baseUrl: string): string|null` — URL tuyệt đối; so `w` trước, không có `w` thì so `x` (thiếu descriptor = `1x`)
  - `extractCssUrl(cssValue: string): string|null`
  - `getUrlKind(url: string|null): 'http'|'data'|'blob'|'none'`
  - `filenameForDataUrl(dataUrl: string, mediaType: 'image'|'video', now: Date): string` — `<mediaType>-YYYYMMDD-HHMMSS.<ext>` (giờ địa phương)

- [ ] **Step 1:** Ghi nhật ký "Định làm" vào `GEMINI.md`.
- [ ] **Step 2:** Chạy `node --test tests/` → Expected: FAIL (`ENOENT ... media-utils.js`).
- [ ] **Step 3:** Viết `media-utils.js` dạng IIFE gán `globalThis.DVIMediaUtils`. Tách `srcset`: URL kết thúc ở khoảng trắng (URL có thể chứa dấu phẩy), ứng viên ngăn bởi `,` sau descriptor. Bảng MIME → đuôi: `jpeg→jpg, png, gif, webp, avif, bmp, svg+xml→svg, x-icon→ico, mp4, webm, ogg→ogv, quicktime→mov`; MIME thiếu/lạ → `jpg` (image) / `mp4` (video).
- [ ] **Step 4:** `node --test tests/` → Expected: 9 test PASS.
- [ ] **Step 5:** Commit `feat: add media-utils (srcset, css url, url kind, data-url filename)` + push.

### Task 2: `media-utils.js` — nền tảng, permalink, route

**Files:**
- Modify: `extension/content/media-utils.js`
- Test: `tests/media-utils.test.js` (thêm test)

**Interfaces:**
- Produces:
  - `detectPlatform(hostname: string): 'youtube'|'x'|'instagram'|'threads'|'tiktok'|'facebook'|null` — khớp domain và subdomain: `youtube.com, youtu.be, youtube-nocookie.com` · `x.com, twitter.com` · `instagram.com` · `threads.net, threads.com` · `tiktok.com` · `facebook.com, fb.watch`
  - `isPermalink(platform, url: string): boolean` — theo bảng 5.3 của spec
  - `choosePermalink(platform, levels: string[][], pageUrl: string): string` — `levels[i]` = mọi href tuyệt đối trong tổ tiên thứ i (gần → xa). Duyệt lần lượt: tầng có **đúng 1** permalink khác nhau → trả về nó; tầng có **> 1** → dừng, trả `pageUrl`; hết tầng → `pageUrl`. (Ngăn lấy nhầm link video đề xuất khi đi lên quá rộng, ví dụ trình phát chính của YouTube.)
  - `chooseRoute(mediaType: 'image'|'video', urlKind, platform): 'direct'|'blob-image'|'ytdlp'|'none'`

- [ ] **Step 1: Viết test fail**

```js
test('detectPlatform', () => {
  assert.equal(U.detectPlatform('www.youtube.com'), 'youtube');
  assert.equal(U.detectPlatform('m.youtube.com'), 'youtube');
  assert.equal(U.detectPlatform('youtu.be'), 'youtube');
  assert.equal(U.detectPlatform('twitter.com'), 'x');
  assert.equal(U.detectPlatform('www.threads.com'), 'threads');
  assert.equal(U.detectPlatform('web.facebook.com'), 'facebook');
  assert.equal(U.detectPlatform('notyoutube.com'), null);
  assert.equal(U.detectPlatform('example.com'), null);
});
test('isPermalink', () => {
  assert.ok(U.isPermalink('youtube', 'https://www.youtube.com/watch?v=abc123'));
  assert.ok(U.isPermalink('youtube', 'https://www.youtube.com/shorts/abc123'));
  assert.ok(!U.isPermalink('youtube', 'https://www.youtube.com/@channel'));
  assert.ok(U.isPermalink('x', 'https://x.com/user/status/123456'));
  assert.ok(!U.isPermalink('x', 'https://x.com/user'));
  assert.ok(U.isPermalink('instagram', 'https://www.instagram.com/reel/Cx1/'));
  assert.ok(U.isPermalink('instagram', 'https://www.instagram.com/p/Cx1/'));
  assert.ok(U.isPermalink('threads', 'https://www.threads.com/@u/post/Cx1'));
  assert.ok(U.isPermalink('tiktok', 'https://www.tiktok.com/@u/video/7300000000000000000'));
  assert.ok(U.isPermalink('facebook', 'https://www.facebook.com/watch/?v=123'));
  assert.ok(U.isPermalink('facebook', 'https://www.facebook.com/reel/123'));
  assert.ok(U.isPermalink('facebook', 'https://www.facebook.com/somepage/videos/123/'));
});
test('choosePermalink', () => {
  const page = 'https://x.com/home';
  const a = 'https://x.com/u/status/1', b = 'https://x.com/v/status/2';
  assert.equal(U.choosePermalink('x', [['https://x.com/u'], [a, a + '/photo/1', a]], page), a);
  assert.equal(U.choosePermalink('x', [[], [a, b]], page), page);
  assert.equal(U.choosePermalink('x', [[a, b], [a]], page), page);
  assert.equal(U.choosePermalink('x', [], page), page);
});
test('chooseRoute', () => {
  assert.equal(U.chooseRoute('image', 'http', 'instagram'), 'direct');
  assert.equal(U.chooseRoute('image', 'data', null), 'direct');
  assert.equal(U.chooseRoute('image', 'blob', null), 'blob-image');
  assert.equal(U.chooseRoute('image', 'none', null), 'none');
  assert.equal(U.chooseRoute('video', 'http', 'tiktok'), 'ytdlp');
  assert.equal(U.chooseRoute('video', 'http', null), 'direct');
  assert.equal(U.chooseRoute('video', 'data', null), 'direct');
  assert.equal(U.chooseRoute('video', 'blob', null), 'ytdlp');
  assert.equal(U.chooseRoute('video', 'none', null), 'ytdlp');
});
```

Lưu ý `a + '/photo/1'` cũng khớp mẫu status → so khớp phải **chuẩn hoá về `/<user>/status/<id>`** trước khi đếm "khác nhau". Thêm hàm `normalizePermalink(platform, url): string|null` (trả dạng chuẩn hoặc `null` nếu không phải permalink); `isPermalink` = `normalizePermalink(...) !== null`.

- [ ] **Step 2:** `node --test tests/` → Expected: FAIL (`U.detectPlatform is not a function`).
- [ ] **Step 3:** Cài đặt các hàm trên.
- [ ] **Step 4:** `node --test tests/` → Expected: tất cả PASS.
- [ ] **Step 5:** Commit `feat: platform detection, permalink and route selection` + push.

### Task 3: Khung extension — manifest, key, icon, tải trực tiếp

**Files:**
- Create: `extension/manifest.json`, `extension/background.js`, `extension/icons/icon{16,32,48,128}.png`

**Interfaces:**
- Produces (message `chrome.runtime.sendMessage` từ content → background):
  - `{ type: 'DVI_DIRECT', url: string, filename?: string }` → `{ ok: true } | { ok: false, error: string }`. Chỉ nhận scheme `http:`, `https:`, `data:`; gọi `chrome.downloads.download({ url, filename?, conflictAction: 'uniquify' })` (chỉ thêm `filename` khi có).

- [ ] **Step 1:** Sinh key (private key bỏ đi, không lưu):
  `node -e "const c=require('crypto');const {publicKey}=c.generateKeyPairSync('rsa',{modulusLength:2048,publicKeyEncoding:{type:'spki',format:'der'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});console.log(publicKey.toString('base64'))"` → dán vào `manifest.json` trường `"key"`.
- [ ] **Step 2:** Viết `manifest.json` (`manifest_version: 3`, `name: "Download Video & Image"`, `version: "1.0.0"`, quyền theo Global Constraints, `background.service_worker: "background.js"`, `content_scripts` như File Structure, `icons`).
- [ ] **Step 3:** Tạo 4 icon PNG bằng `System.Drawing` trong PowerShell (lệnh dùng một lần, không commit script).
- [ ] **Step 4:** Viết `background.js` phần `DVI_DIRECT` (listener trả `true` để phản hồi bất đồng bộ).
- [ ] **Step 5:** Tạm tạo `extension/content/content.js` rỗng chỉ có comment đầu file (Task 4 viết tiếp) để manifest hợp lệ.
- [ ] **Step 6:** `node --check extension/background.js` → không lỗi. Load unpacked trong `chrome://extensions` → **không có thẻ "Errors"**; ghi lại ID extension hiển thị (dùng ở Task 5).
- [ ] **Step 7:** Commit `feat: extension skeleton with fixed key, icons, direct download` + push.

### Task 4: Nút nổi + tải ảnh / video trực tiếp

**Files:**
- Modify: `extension/content/content.js`
- Create: `tests/manual/test-page.html`

**Interfaces:**
- Consumes: `DVIMediaUtils.*` (Task 1–2), `DVI_DIRECT` (Task 3).
- Produces (dùng ở Task 8): `setButtonState(element, state: 'idle'|'busy'|'done'|'error', detail?: number|string)` — trạng thái lưu trong `WeakMap<Element, {state, detail}>`, nút hiển thị theo trạng thái của media đang hover.

- [ ] **Step 1:** Viết `tests/manual/test-page.html`: `<img>` thường; `<img srcset>` (1x nhỏ, 2x lớn khác ảnh); `<div>` có `background-image`; `<img src="data:image/png;base64,...">`; `<img>` có `src` là `blob:` (tạo bằng script từ canvas); `<img>` 32×32 (không được hiện nút); `<video controls src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4">`; một ảnh bị phủ bởi `<div>` trong suốt; một `<a href>` bọc ảnh (bấm nút không được điều hướng).
- [ ] **Step 2:** Viết `content.js`:
  - Host `<div>` + `attachShadow({mode:'closed'})`, `position:fixed; z-index:2147483647; pointer-events:none`; nút bên trong `pointer-events:auto`, icon SVG.
  - `mousemove` (passive) → lưu toạ độ, throttle `requestAnimationFrame` → `findMediaAt(x, y)`: lấy tối đa 20 phần tử từ `document.elementsFromPoint`; nếu gặp host của mình → giữ nguyên mục tiêu hiện tại. Ưu tiên: `<video>` đủ cỡ → `<img>` đủ cỡ → phần tử có `background-image` đủ cỡ. Trả `{ element, mediaType, url } | null`.
  - Giải URL: img = `pickLargestFromSrcset(img.srcset, document.baseURI) || img.currentSrc || img.src`; video = `currentSrc || src || source[src]` đầu tiên; ảnh nền = `extractCssUrl(getComputedStyle(el).backgroundImage)`.
  - Vị trí: góc trên-phải `getBoundingClientRect()` lệch 8px, kẹp trong viewport; cập nhật khi `scroll` (capture, passive) / `resize`; mục tiêu bị gỡ khỏi DOM → ẩn.
  - Nút chặn `pointerdown`, `mousedown`, `mouseup`, `click` (`preventDefault` + `stopPropagation`).
  - Click: `chooseRoute(...)`: `direct` → `DVI_DIRECT` (thêm `filename` từ `filenameForDataUrl` nếu URL `data:`); `blob-image` → `fetch` → `FileReader.readAsDataURL` → `DVI_DIRECT`; `none` → lỗi `Không tìm thấy nguồn để tải`; `ytdlp` → để Task 8 (tạm thời báo lỗi `Không tìm thấy nguồn để tải`).
  - Lỗi `Extension context invalidated` → `Extension vừa cập nhật — hãy tải lại trang (F5)`.
  - Trạng thái `done`/`error` tự về `idle` sau 3 giây.
- [ ] **Step 3:** `node --check extension/content/content.js` và `node --test tests/` → sạch.
- [ ] **Step 4:** Reload extension, mở `tests/manual/test-page.html` (bật "Allow access to file URLs" cho extension). Kiểm từng mục ở Step 1: nút hiện/không hiện đúng, ảnh srcset tải bản 2x, ảnh data/blob có tên `image-YYYYMMDD-HHMMSS.png`, mp4 tải được, rê từ ảnh sang nút không mất nút, bấm nút trong `<a>` không điều hướng (Review Focus 5). Thử thêm 1 trang báo thật (vd. vnexpress.net) → ảnh tải được, trang không vỡ layout.
- [ ] **Step 5:** Cập nhật `README.md` (cài đặt + dùng phần ảnh/video thường), `GEMINI.md`. Commit `feat: floating download button for images and direct videos` + push.

### Task 5: `HostUtils.psm1` — hàm PowerShell thuần

**Files:**
- Create: `native-host/HostUtils.psm1`, `tests/host-utils.test.js`

**Interfaces:**
- Produces (export):
  - `Read-NativeMessage([IO.Stream]$Stream)` → `PSCustomObject` hoặc `$null` khi hết stream (4 byte little-endian độ dài + JSON UTF-8)
  - `Write-NativeMessage([IO.Stream]$Stream, $Object)` → ghi + `Flush()`; JSON bằng `ConvertTo-Json -Compress -Depth 5`
  - `ConvertTo-NetscapeCookieText([object[]]$Cookies)` → string. Cookie: `{domain, hostOnly, path, secure, expirationDate?, name, value}`. Dòng đầu `# Netscape HTTP Cookie File`; mỗi cookie: `domain<TAB>TRUE|FALSE(includeSubdomains = !hostOnly; nếu !hostOnly và domain thiếu '.' đầu thì thêm)<TAB>path<TAB>TRUE|FALSE<TAB>[int]expirationDate (thiếu = 0)<TAB>name<TAB>value`; xuống dòng `\n`
  - `Get-ProgressPercent([string]$Line)` → `[double]` hoặc `$null` (dòng dạng `[dvi] 42.5%`)
  - `Get-FinalFilePath([string]$Line)` → string hoặc `$null` (dòng dạng `[dvifile]<path>`)
  - `Join-ProcessArguments([string[]]$Arguments)` → string theo quy tắc trích dẫn CommandLineToArgvW (bọc `"` khi có khoảng trắng/`"`/rỗng; nhân đôi `\` đứng trước `"` và trước `"` đóng)
  - `Get-YtDlpArguments([string]$Url, [string]$OutDir, [string]$CookieFile, [string]$Quality = 'compatible')` → `string[]`: `--encoding utf-8 --newline --progress --progress-template "download:[dvi] %(progress._percent_str)s" --print "after_move:[dvifile]%(filepath)s" --print "after_move:[dvimeta]%(vcodec)s;%(height)s" -f "bv*+ba/b" <sort-args> --merge-output-format mp4 --no-playlist -P <OutDir> -o "%(title).150B [%(id)s].%(ext)s"` + (`--cookies <CookieFile>` nếu có) + `-- <Url>`. Với `$Quality -eq 'best'`: `-S "res,ext:mp4:m4a"`; ngược lại: `-S "vcodec:h264,res,acodec:m4a"`.
  - `Get-MetaInfo([string]$Line)` → `@{ vcodec = string; height = int }` hoặc `$null` (dòng dạng `[dvimeta]av01.0.08M.08;2160`)
  - `Get-ExtensionIdFromKey([string]$Base64Key)` → 32 ký tự `a`–`p` (SHA-256 của DER, 16 byte đầu, mỗi nibble hex → `'a' + giá trị`)
  - `Get-DownloadsFolder()` → `(New-Object -ComObject Shell.Application).NameSpace('shell:Downloads').Self.Path`, lỗi thì `$env:USERPROFILE\Downloads`

- [ ] **Step 1: Viết test fail** — `tests/host-utils.test.js` có helper `ps(script)` gọi `execFileSync('powershell.exe', ['-NoProfile','-ExecutionPolicy','Bypass','-Command', "Import-Module '<abs path>\\HostUtils.psm1'; " + script])`, đọc stdout UTF-8 (`[Console]::OutputEncoding = [Text.Encoding]::UTF8` ở đầu script). Test:
  - Round-trip: ghi `{ title: 'Nhạc Trịnh 🎵', n: 1 }` vào `MemoryStream`, tua về 0, đọc lại → `title` giống hệt; stream rỗng → `$null`.
  - Netscape: `[{domain:'.x.com',hostOnly:false,path:'/',secure:true,expirationDate:1893456000.5,name:'auth',value:'v'},{domain:'x.com',hostOnly:true,path:'/',secure:false,name:'s',value:'w'}]` → dòng 2 = `.x.com\tTRUE\t/\tTRUE\t1893456000\tauth\tv`, dòng 3 = `x.com\tFALSE\t/\tFALSE\t0\ts\tw`.
  - `Get-ProgressPercent '[dvi]  42.5%'` → `42.5`; `'[download] foo'` → rỗng.
  - `Get-FinalFilePath '[dvifile]D:\Down\Nhạc Trịnh 🎵 [abc].mp4'` → đúng nguyên chuỗi đường dẫn.
  - `Join-ProcessArguments @('a','b c','','say "hi"','C:\dir\')` → `a "b c" "" "say \"hi\"" C:\dir\`; `@('C:\my dir\')` → `"C:\my dir\\"`.
  - `Get-YtDlpArguments` có `-S`,`vcodec:h264,res,acodec:m4a` liền nhau; có `--cookies` chỉ khi truyền file; phần tử cuối là URL, ngay trước là `--`.
  - `Get-ExtensionIdFromKey` khớp với ID tính bằng Node (`crypto.createHash('sha256')` trên key trong `extension/manifest.json`) **và** khớp ID ghi lại ở Task 3 Step 6.
- [ ] **Step 2:** `node --test tests/` → Expected: FAIL (module chưa có).
- [ ] **Step 3:** Viết `HostUtils.psm1` (comment mỗi hàm; `Export-ModuleMember` liệt kê đúng các hàm trên).
- [ ] **Step 4:** `node --test tests/` → tất cả PASS.
- [ ] **Step 5:** Commit `feat: native host utility module with tests` + push.

### Task 6: Native host — `host.ps1` + `host.bat`

**Files:**
- Create: `native-host/host.ps1`, `native-host/host.bat`, `tests/native-host.smoke.test.js`

**Interfaces:**
- Consumes: `HostUtils.psm1` (Task 5).
- Produces — giao thức (một tiến trình host / một job, host thoát sau phản hồi cuối):
  - `{action:'ping'}` → `{type:'pong', version:'1.0.0', ytdlp: string|null, ffmpeg: bool, deno: bool}`
  - `{action:'download', url, quality?: 'compatible'|'best', cookies?: Cookie[]}` → nhiều `{type:'progress', percent:number}` → `{type:'done', file:string, vcodec?:string, height?:number}` | `{type:'error', message:string}`

- [ ] **Step 1:** `host.bat`: `@echo off` + `powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%~dp0host.ps1"` (trích dẫn để chịu được dấu cách).
- [ ] **Step 2:** `host.ps1`: `$ErrorActionPreference='Stop'`, `$ProgressPreference='SilentlyContinue'`; **không** dùng `Write-Host`/`Write-Output` (stdout là kênh giao thức). Đọc 1 message từ `[Console]::OpenStandardInput()`, xử lý, ghi vào `[Console]::OpenStandardOutput()`.
  - Tự cập nhật: file `bin\last-update.txt` chứa ngày `yyyy-MM-dd`; khác hôm nay → **ghi ngày trước** (giành lượt, tránh 2 job cùng cập nhật) rồi chạy `yt-dlp -U` và `deno upgrade`, bỏ qua lỗi.
  - Download: cookie (nếu có) → ghi `%TEMP%\dvi-cookies-<guid>.txt` (UTF-8 không BOM); `Process` với `FileName=bin\yt-dlp.exe`, `Arguments=Join-ProcessArguments (Get-YtDlpArguments ...)`, `CreateNoWindow`, redirect stdout/stderr với encoding UTF-8, `PATH` = `bin;` + PATH cũ. Đọc stderr bất đồng bộ (tránh deadlock), stdout từng dòng: tiến độ → gửi `progress` (chỉ gửi khi % tăng ≥ 1 so với lần gửi trước); `[dvifile]` → nhớ đường dẫn. Kết thúc: exit 0 + có file → `done`; ngược lại `error` với dòng `ERROR:` cuối của stderr (bỏ tiền tố `ERROR: `), không có thì `yt-dlp thoát với mã <n>`. Xoá file cookie trong `finally`.
  - Mọi exception chưa bắt → gửi `{type:'error', message}`.
- [ ] **Step 3:** `tests/native-host.smoke.test.js`: spawn `host.bat` qua `cmd.exe /c`, gửi message theo khung Native Messaging, đọc phản hồi. `{ skip: !fs.existsSync('native-host/bin/yt-dlp.exe') }`. Test: `ping` → `type==='pong'`, `ytdlp` khác `null`, `ffmpeg===true`, `deno===true`; `download` URL `https://www.youtube.com/watch?v=__invalid__` kèm 1 cookie giả → phản hồi cuối `type==='error'`, `message` không rỗng, và **không có** `dvi-cookies-*.txt` trong `os.tmpdir()` (Review Focus 4).
- [ ] **Step 4:** `node --test tests/` → test cũ PASS, smoke test **skipped** (chưa cài bin).
- [ ] **Step 5:** Commit `feat: PowerShell native messaging host running yt-dlp` + push.

### Task 7: `setup.bat` — cài helper một lần

**Files:**
- Create: `native-host/setup.ps1`, `native-host/setup.bat`

**Interfaces:**
- Consumes: `Get-ExtensionIdFromKey` (Task 5), key trong `extension/manifest.json`.

- [ ] **Step 1:** `setup.bat`: gọi `setup.ps1` như `host.bat`, rồi `pause` để người dùng đọc kết quả.
- [ ] **Step 2:** `setup.ps1` (bật TLS 1.2, `Invoke-WebRequest -UseBasicParsing`, in từng bước bằng `Write-Host` — ở đây được phép vì không phải host):
  1. Tạo `bin\`. Tải nếu **chưa có** (chạy lại không tải lại):
     - `https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe`
     - `https://github.com/yt-dlp/FFmpeg-Builds/releases/latest/download/ffmpeg-master-latest-win64-gpl.zip` → lấy `ffmpeg.exe`, `ffprobe.exe`
     - `https://github.com/denoland/deno/releases/latest/download/deno-x86_64-pc-windows-msvc.zip` → `deno.exe`
     (zip tải vào `%TEMP%`, giải nén bằng `Expand-Archive`, xoá zip và thư mục tạm.)
  2. Đọc `key` từ `..\extension\manifest.json` → ID → ghi `com.adwewecat.download_video.json`: `{name, description, path: <đường dẫn tuyệt đối host.bat>, type:'stdio', allowed_origins:['chrome-extension://<ID>/']}` (UTF-8 không BOM).
  3. Registry `HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.adwewecat.download_video` (Default) = đường dẫn file JSON.
  4. In tóm tắt: phiên bản yt-dlp, ID extension, "Hoàn tất — tải lại extension trong chrome://extensions".
  Lỗi bước nào → in rõ bước đó và thoát mã ≠ 0.
- [ ] **Step 3:** Chạy `native-host\setup.bat` → thành công; chạy lần 2 → vẫn thành công, không tải lại. Kiểm `reg query "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.adwewecat.download_video"`.
- [ ] **Step 4:** `node --test tests/` → **smoke test giờ chạy và PASS**.
- [ ] **Step 5:** Thử Review Focus 2: copy repo sang thư mục có dấu cách (vd. `%TEMP%\dvi test\`), chạy setup ở đó, chạy smoke test → PASS; chạy lại setup ở thư mục gốc để đăng ký về đúng chỗ, xoá bản copy.
- [ ] **Step 6:** Cập nhật `README.md` (bước chạy `setup.bat`), `GEMINI.md`. Commit `feat: one-time setup for yt-dlp, ffmpeg, deno and host registration` + push.

### Task 8: Nối extension ↔ host — job yt-dlp, tiến độ, cookie, badge, thông báo

**Files:**
- Modify: `extension/background.js`, `extension/content/content.js`

**Interfaces:**
- Consumes: giao thức host (Task 6), `setButtonState` (Task 4), `choosePermalink`/`detectPlatform` (Task 2).
- Produces:
  - Content → background: `{ type: 'DVI_YTDLP', url: string, platform: string|null, quality: 'compatible'|'best' }` → phản hồi ngay `{ ok: true, jobId: string }`
  - Background → tab (`chrome.tabs.sendMessage(tabId, msg, { frameId })`, bỏ qua lỗi nếu tab đã đóng): `{ type: 'DVI_PROGRESS', jobId, percent }`, `{ type: 'DVI_DONE', jobId, file, vcodec?, height? }`, `{ type: 'DVI_ERROR', jobId, message }`

- [ ] **Step 1:** `background.js`:
  - `COOKIE_DOMAINS = { x:['x.com','twitter.com'], instagram:['instagram.com'], threads:['threads.net','threads.com','instagram.com'], tiktok:['tiktok.com'], facebook:['facebook.com'] }`; lấy bằng `chrome.cookies.getAll({ domain })`, gộp, map sang dạng Cookie của host.
  - Mỗi job: `jobId = crypto.randomUUID()`, `chrome.runtime.connectNative('com.adwewecat.download_video')`, gửi `download`; tăng số job → `chrome.action.setBadgeText` (rỗng khi 0).
  - `progress` → chuyển về tab. `done` → chuyển + thông báo `Tải xong` (nội dung = tên file, không kèm thư mục). `error` → chuyển + thông báo `Tải thất bại`.
  - `onDisconnect` khi chưa có phản hồi cuối: `chrome.runtime.lastError.message` chứa `not found` → `Chưa cài trình hỗ trợ — chạy native-host\setup.bat`; ngược lại → `Trình hỗ trợ dừng đột ngột`. Luôn giảm số job đúng **một lần** mỗi job.
- [ ] **Step 2:** `content.js`: route `ytdlp` → `url = platform ? choosePermalink(platform, collectLevels(element), location.href) : location.href`, trong đó `collectLevels` đi lên tối đa 12 tổ tiên, mỗi tầng lấy `href` tuyệt đối của mọi `a[href]` trong tổ tiên đó. Gửi `DVI_YTDLP`, lưu `jobId → element`; nhận `DVI_PROGRESS/DONE/ERROR` → `setButtonState`.
- [ ] **Step 3:** `node --check` cả hai file; `node --test tests/` → PASS.
- [ ] **Step 4: Kiểm tay** (reload extension, đăng nhập sẵn các trang cần thiết), mỗi mục ghi Đạt/Không vào nhật ký `GEMINI.md`:
  - YouTube: trang xem video (tải đúng video đang xem, không phải video đề xuất), Shorts, video nhúng trên trang khác.
  - X: video trong feed `/home` (tải đúng bài đó), trang status.
  - Instagram: reel, bài viết có video, ảnh trong bài viết (đi đường tải trực tiếp).
  - Facebook: video feed, reel. TikTok: video feed, trang video. Threads: bài có video.
  - Trang lạ có video HLS (stream) → yt-dlp dùng URL trang.
  - Hai lượt tải cùng lúc → badge `2`, cả hai xong.
  - Tiêu đề tiếng Việt/emoji → tên file đúng (Review Focus 1).
  - **Chưa cài helper:** tạm đổi tên khoá registry → bấm tải video YouTube → nút báo lỗi + thông báo `Chưa cài trình hỗ trợ…`; khôi phục khoá (Review Focus 3).
- [ ] **Step 5:** Commit `feat: yt-dlp downloads via native host with progress, cookies, badge and notifications` + push.

### Task 9: Hoàn thiện tài liệu & kiểm tra cuối

**Files:**
- Modify: `README.md`, `GEMINI.md`

- [ ] **Step 1:** `README.md`: giới thiệu; cài đặt từ đầu (clone → Load unpacked `extension\` → chạy `native-host\setup.bat` → reload extension); cách dùng; nền tảng hỗ trợ; đổi sang chất lượng 4K (hằng số `-S` trong `HostUtils.psm1`); giới hạn đã biết (DRM, hotlink cần referer, nền tảng đổi cách làm → yt-dlp tự cập nhật hằng ngày); chạy test; cấu trúc thư mục.
- [ ] **Step 2:** `GEMINI.md`: trạng thái "v1.0.0 hoàn thành", việc tiếp theo (ý tưởng v2 nếu có), nhật ký kết quả kiểm tay Task 8.
- [ ] **Step 3:** Kiểm sạch: `node --test tests/` PASS toàn bộ; `node --check` mọi file `.js`; tìm `console.log` → không còn; `chrome://extensions` → không có lỗi; `git status` sạch sau commit.
- [ ] **Step 4:** Commit `docs: complete README and GEMINI.md for v1.0.0` + push.

