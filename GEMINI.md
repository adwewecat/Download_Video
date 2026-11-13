# GEMINI.md — Sổ tay dự án cho AI / DEV

> File này là **nguồn sự thật duy nhất** về trạng thái dự án. Bất kỳ AI (Gemini, Claude, ...) hoặc DEV nào
> tiếp nhận dự án (kể cả sau khi cài lại Windows) phải **đọc file này trước tiên**, rồi đọc `README.md`.

---

## 1. Tổng quan dự án

- **Tên:** Download_Video_Image
- **Mục tiêu:** Chrome Extension — khi cài vào, mọi video và hình ảnh trên trang web sẽ có nút **Download** để tải về máy.
- **Repo:** https://github.com/adwewecat/Download_Video.git (nhánh `main`)
- **Thư mục local:** `D:\LAPTRINH\Download_Video_Image`

---

## 2. QUY TẮC BẤT DI BẤT DỊCH (bắt buộc tuân thủ)

1. **Đọc trước khi làm:** Trước khi làm bất cứ việc gì, đọc toàn bộ các file `.md` trong dự án (đặc biệt `GEMINI.md`, `README.md`).
2. **Ghi chú trước khi làm/sửa:** Trước khi thêm tính năng hoặc sửa lỗi, ghi vào mục **"Nhật ký công việc"** bên dưới: định làm gì, vì sao. Làm xong thì cập nhật kết quả.
3. **Code sạch:** Build phải sạch sẽ, không lỗi, không cảnh báo. Xoá mọi code thừa / không dùng (hàm, biến, file, import, `console.log` debug).
4. **Chú thích trong code:** Mỗi tính năng, mỗi file, mỗi hàm quan trọng phải có comment giải thích mục đích và cách hoạt động, để đọc lại dễ hiểu.
5. **Đẩy lên GitHub ngay:** Mỗi lần thêm tính năng hoặc chỉnh sửa → commit (message rõ ràng) và `git push` lên `main` ngay lập tức.
6. **Cập nhật tài liệu:** Mỗi thay đổi về tính năng / cấu trúc / cách cài đặt phải được cập nhật vào `README.md` và `GEMINI.md`.
7. **Mục "Việc tiếp theo"** phải luôn phản ánh đúng việc cần làm kế tiếp.

---

## 3. Trạng thái hiện tại

- **Giai đoạn:** **v2.1.0 Hoàn Thành (Chrome Extension + Android Trình duyệt chuẩn Google Chrome .apk)**.
- **Đã có:**
  - **Chrome Extension Manifest V3 (`extension/`)**: Shadow DOM không vỡ layout, phát hiện đa tầng media, hỗ trợ tải trực tiếp và tải nền tảng (YouTube, FB, TikTok, Insta, X, Threads, HLS stream,...), lưu folder đã chọn, phím Shift tải nhanh 1-click.
  - **Native Messaging Host (`native-host/`)**: PowerShell thuần, tự động hoá hoàn toàn qua `setup.bat` (tải yt-dlp, ffmpeg, Deno, sinh manifest, đăng ký Registry HKCU).
  - **Ứng dụng Android Native chuẩn phong cách Google Chrome (`android-app/`)**:
    + **Thanh Omnibox thông minh:** Bo tròn kiểu viên thuốc, hiển thị khoá bảo mật 🔒 và tên miền rút gọn, nhận diện thông minh giữa URL và từ khoá tìm kiếm Google, hỗ trợ dán nhanh từ clipboard.
    + **Trang Thẻ Mới (New Tab Page):** Thiết kế Material You với logo Google nhiều màu chuẩn thương hiệu, hộp tìm kiếm lớn ở giữa, lưới phím tắt tròn mở nhanh YouTube, Facebook, TikTok, Instagram, Threads, X, Google, Phim.
    + **Trình Quản Lý Đa Thẻ (Multi-Tab Switcher):** Nút đếm tab `[ N ]`, lưới thẻ tab thu nhỏ 2 cột, hỗ trợ mở thêm thẻ mới `+`, đóng từng thẻ `✕` hoặc đóng tất cả thẻ an toàn giải phóng bộ nhớ.
    + **Menu ba chấm ⋮:** Thẻ mới, Tải lại, bật/tắt **Trang web cho máy tính** (Desktop Site), mở **Tệp đã tải xuống**, và **Xoá dữ liệu duyệt web** (cache, cookie, web storage) 1-click.
    + **Trình Quản Lý Tệp Đã Tải Xuống (Downloads BottomSheet):** Liệt kê chi tiết toàn bộ video, nhạc MP3, ảnh trong `Downloads/Download_Video/`, hỗ trợ mở phát trực tiếp qua VLC/Thư viện ảnh, chia sẻ tệp sang Zalo/Drive/Messenger và xoá tệp an toàn.
    + **Độc lập 100% trong máy:** Nhúng Python qua Chaquopy chạy `yt-dlp` PyPI, binary FFmpeg tĩnh ARM64 muxing 2K/4K và MP3, Background Foreground Service kèm tiến độ %, lưu file an toàn vào `Downloads/Download_Video/` và quét MediaStore vào Gallery.
  - Test suite tự động: 46/46 tests Node.js PASS + toàn bộ Kotlin Unit Tests PASS.
  - Kịch bản đóng gói 1-click: `build-apk.bat` (tại thư mục gốc) và `android-app/build-apk.bat`.

---

## 4. Việc tiếp theo

- [x] Hoàn thành và bàn giao v1.0.0 (Chrome Extension).
- [x] Bổ sung tuỳ chọn tải riêng âm thanh MP3 (v1.2.0).
- [x] **Triển khai ứng dụng Android Native (.apk) độc lập 100% trong máy (v2.0.0):**
  - [x] Task 1: Khởi tạo cấu trúc dự án Android Gradle với Chaquopy & Dependencies.
  - [x] Task 2: Module Python trích xuất luồng `downloader.py` (Chaquopy + yt-dlp) & `YtDlpDownloader.kt`.
  - [x] Task 3: Trình giải nén & cài đặt Binary FFmpeg tĩnh (`FFmpegInstaller`) & `fetch-ffmpeg-android.ps1`.
  - [x] Task 4: Script phát hiện media di động (`dvi_mobile_content.js`) & Cầu nối `DVIBridge` & `tests/mobile-bridge.test.js`.
  - [x] Task 5: Giao diện Trình duyệt `BrowserActivity` & Bottom Sheet Tải (`bottom_sheet_download.xml`).
  - [x] Task 6: Dịch vụ tải ngầm (`DownloadService`), Đồng bộ Cookie (`CookieUtils.kt`) & MediaStore (`StorageUtils.kt`).
  - [x] Task 7: Màn hình chính Dashboard (`MainActivity`) & Danh bạ Bookmarks (`BookmarkAdapter.kt`).
  - [x] Task 8: Script tự động hoá đóng gói APK (`build-apk.bat`) & Tài liệu hướng dẫn.
- [x] **Nâng cấp ứng dụng Android thành Trình duyệt chuẩn Google Chrome (v2.1.0):**
  - [x] Task 1: Xây dựng Mô hình Đa Thẻ & Bộ quản lý Tab (`TabManager.kt` & `WebTab.kt`).
  - [x] Task 2: Giao diện Trang Thẻ Mới (New Tab Page) chuẩn Chrome.
  - [x] Task 3: Thanh Omnibox kiểu Chrome, Menu 3 Chấm & Hộp thoại Nhập Liệu.
  - [x] Task 4: Trình chuyển đổi Thẻ (Tab Switcher Screen).
  - [x] Task 5: Trình Quản Lý Tệp Đã Tải Xuống (Downloads BottomSheet).
  - [x] Task 6: Tích hợp Toàn diện `MainActivity.kt` thành Trình duyệt Chrome Hoàn chỉnh.
  - [x] Task 7: Đóng gói APK, Kiểm thử Tự động & Cập nhật Tài liệu.
- [ ] *(Ý tưởng tương lai)*: Thêm tuỳ chọn tải phụ đề rời (.srt) hoặc tải danh sách phát (Playlist).

---

## 5. Nhật ký công việc (mới nhất ở trên)

### 2026-11-13 — Sửa lỗi: Chặn vi phạm CSP inline script (`content.js`), lỗi header `Referer` khi tải trực tiếp (`background.js`), và bảo vệ tải video Blob trên Zalo Web
- **Định làm:**
  1. **Loại bỏ triệt để lỗi vi phạm Content Security Policy (CSP) `Executing inline script` tại `extension/content/content.js:376`:**
     - Tạo script độc lập `extension/content/page-probe.js` chạy trực tiếp trong `"world": "MAIN"` thông qua cấu hình `content_scripts` trong `extension/manifest.json` (MV3 chuẩn Chrome, không cần chèn thẻ `<script>` inline vào DOM của trang web).
     - Giao tiếp hai chiều với `content.js` bằng `CustomEvent` (`__dvi_probe_request` và `__dvi_stream_found`), không phụ thuộc thứ tự tải script và miễn nhiễm với CSP `script-src`.
     - Gia cố Shadow DOM UI trong `content.js` theo hướng tương thích CSP `style-src` / Trusted Types (`setProperty`, `adoptedStyleSheets` có fallback `<style>`, tạo phần tử SVG/DOM trực tiếp thay vì `innerHTML`).
  2. **Sửa lỗi `Referer` bị Chrome chặn trong `chrome.downloads.download` (`extension/background.js`):**
     - Xoá tuỳ chọn `options.headers = [{ name: 'Referer', ... }]` khỏi `handleDirectDownload` vì Chrome cấm thiết lập `Referer` trong API `downloads.download` (sẽ gây lỗi unsafe header và làm hỏng tải trực tiếp).
     - Đồng thời vá lỗi `Unchecked runtime.lastError` tại các lệnh gọi `chrome.notifications.create` và trả về `false` khi đã `sendResponse` đồng bộ ở nhánh `DVI_YTDLP`.
  3. **Bảo vệ luồng tải Blob Video trên Zalo Web & chuẩn hoá đặt tên file (`content.js`, `media-utils.js`, `dvi_mobile_content.js`):**
     - Tách hàm dùng chung `resolveVideoSource(videoEl)` và siết chặt bộ lọc Zalo CDN trong `findDirectStreamFromPerformance` (tránh nhận nhầm URL font/API chứa chữ `video` rồi ghi đè mất `blob:` hợp lệ của thẻ `<video>`).
     - Khi tải HTTP URL trực tiếp qua `DVI_DIRECT` thất bại (do hotlink), tự động fallback `fetch(url)` lấy Blob trong ngữ cảnh trang để cứu luồng tải.
     - Đưa hàm tạo tên file an toàn `buildMediaFilename` vào `extension/content/media-utils.js`, tách helper `sendDirectDownload` luôn đọc `chrome.runtime.lastError`, và chuẩn hoá ngưỡng FileReader `blob-video` (25MB) dưới giới hạn IPC của Chrome.
  4. Bổ sung unit test hồi quy mới, chạy kiểm thử toàn bộ (Node.js + Android), đóng gói lại APK nếu có thay đổi mobile, cập nhật tài liệu và đẩy lên `main`.
- **Vì sao:** Ảnh chụp trang `chrome://extensions` Errors do người dùng gửi báo hàng loạt lỗi `Executing inline script violates the following Content Security Policy directive 'script-src ...'` tại `content/content.js:376`, đồng thời rà soát phát hiện Chrome API từ chối header `Referer` trong `chrome.downloads.download` và nguy cơ ghi đè nhầm Blob URL trên Zalo Web.
- **Kết quả:** Đã hoàn thành 100%:
  1. **Triệt tiêu lỗi vi phạm CSP tại `extension/content/content.js:376`:** Tách phần quét `window.jwplayer` / `window.__SRC` sang [extension/content/page-probe.js](extension/content/page-probe.js) khai báo `"world": "MAIN"` trong `extension/manifest.json` và giao tiếp qua `CustomEvent` (`__dvi_probe_request` / `__dvi_stream_found`); gia cố Shadow DOM UI bằng `adoptedStyleSheets` (có fallback `<style>`), `style.setProperty(..., 'important')` và tạo DOM/SVG trực tiếp không dùng `innerHTML`.
  2. **Sửa lỗi `chrome.downloads.download` & `runtime.lastError` (`extension/background.js` & `extension/content/content.js`):** Gỡ `options.headers = [{ name: 'Referer', ... }]` khỏi `handleDirectDownload` để Chrome không chặn tải trực tiếp; trả `false` khi đã `sendResponse` đồng bộ ở `DVI_YTDLP`; đọc `chrome.runtime.lastError` trong `notifyDone`/`notifyError` và hợp nhất gửi lệnh qua `sendDirectDownload` trong `content.js` (kèm fallback `fetch(url)` lấy Blob trong ngữ cảnh trang nếu tải HTTP bị chặn hotlink).
  3. **Bảo vệ Zalo Web `blob-video` & chuẩn hoá tên file:** Tách `resolveVideoSource` để giữ nguyên `blob:` trên web app (`platform === null`) trừ khi có manifest `.m3u8/.mpd/.vl` thực sự; siết bộ lọc Zalo CDN trong `content.js` và `dvi_mobile_content.js` tránh khớp nhầm API/font chứa chữ `video`; chuẩn hoá `U.buildMediaFilename` trong `extension/content/media-utils.js` và hạ ngưỡng FileReader Blob video về 25MB (an toàn dưới giới hạn IPC).
  4. **Kiểm thử & Đóng gói:** Bổ sung `tests/extension-safety.test.js` và test `buildMediaFilename` trong `tests/media-utils.test.js` — đạt **46/46** Node.js tests PASS (`node --test "tests/*.test.js"`), toàn bộ Android Kotlin Unit Tests PASS (`testDebugUnitTest`), đóng gói lại `android-app/dist/DownloadVideoImage.apk` (31.68 MB).

### 2026-11-13 — Sửa lỗi: Tải video trên web Zalo (chat.zalo.me) và chuyển vị trí nút download từ góc trên-phải về góc dưới cùng bên trái
- **Định làm:**
  1. **Chuyển icon/thanh download về góc dưới cùng bên trái:**
     - Trong `extension/content/content.js`: thay đổi logic toạ độ trong `updateBarPosition` từ góc trên-phải (`rect.right - barWidth - BTN_OFFSET`, `rect.top + BTN_OFFSET`) sang góc dưới cùng bên trái (`rect.left + BTN_OFFSET`, `rect.bottom - barHeight - bottomOffset`).
     - Với phần tử `<video>` có chiều cao >= 160px, bổ sung khoảng trống an toàn 40px tránh che thanh điều khiển phát video (play/pause/timeline).
     - Giới hạn trong viewport và trong phạm vi media để không bị trôi ra ngoài màn hình.
     - Đồng bộ cả trong script mobile `dvi_mobile_content.js` đưa nút nổi cảm ứng về góc dưới-trái.
  2. **Khắc phục triệt để lỗi không tải được video trên Web Zalo (`chat.zalo.me`):**
     - Trong `extension/content/media-utils.js`: Bổ sung route `'blob-video'` trong `chooseRoute` cho các video phát dạng blob URL (`blob:https://chat.zalo.me/...` hoặc các web app không thuộc mạng xã hội yt-dlp). Trước đây gán blob video sang `'ytdlp'`, dẫn đến việc gửi URL `https://chat.zalo.me/` sang yt-dlp và văng lỗi `Unsupported URL`.
     - Trong `extension/content/content.js`:
       + Triển khai xử lý nhánh `route === 'blob-video'`: tải trực tiếp blob nội bộ trong trang qua thẻ `<a> download` hoặc FileReader (nếu blob <= 35MB) gửi sang Chrome Downloads API, và fallback sang fetch blob Object URL cho file lớn, hoàn toàn độc lập trong trình duyệt không qua yt-dlp.
       + Bổ sung nhận diện luồng video Zalo CDN (`*.zdn.vn`, `*.zadn.vn`, `*.zalo.me`, `*.zaloapp.com`) trong `findDirectStreamFromPerformance()`.
       + Nâng cấp `findMediaAt()` hỗ trợ tìm thẻ `<video>` nằm lồng bên trong container tin nhắn video / overlay của Zalo Web (`el.querySelector('video')`).
       + Bổ sung event listener `play` trên document để tự động bắt và gắn thanh tải ngay khi video trên Zalo Web hoặc web bất kỳ bắt đầu phát.
     - Trong `extension/background.js`: Hỗ trợ truyền `Referer` trong `chrome.downloads.download` options headers để chống chặn hotlink từ CDN Zalo.
  3. Cập nhật test suite trong `tests/media-utils.test.js`, chạy kiểm thử 100% PASS, đóng gói APK, cập nhật tài liệu, commit và push lên GitHub `main`.
- **Vì sao:** Người dùng báo: "check lại phần download đang không download được video trên web zalo , và check lại icon download đang hiển thị ở góc trên bên phải để download, hãy chuyển nó về góc dưới cùng bên trái, nhé". Icon ở góc trên bên phải bị che/đè lên các thẻ điều hướng của video player (như YouTube), và video trên Zalo Web sử dụng Blob URL hoặc CDN Zalo bị gửi nhầm sang yt-dlp dẫn đến tải thất bại.
- **Kết quả:** Đã hoàn thành 100%:
  1. Đã chuyển toàn bộ thanh công cụ download (⬇ / MAX / MP3) về góc dưới cùng bên trái của media element, có khoảng trống an toàn 40px trên video tránh che các nút play/timeline/volume và giới hạn viewport chuẩn xác.
  2. Khắc phục triệt để lỗi không tải được video trên Web Zalo (`chat.zalo.me`):
     - Bổ sung route `'blob-video'` trong `media-utils.js` để video Blob trên Zalo Web và web app được tải trực tiếp trong trình duyệt thay vì bị gửi nhầm sang `yt-dlp`.
     - `content.js` hỗ trợ tải blob video bằng FileReader sang `DVI_DIRECT` (với file <= 35MB) hoặc qua thẻ `<a> download` trực tiếp với blob URL/Object URL, lưu file `.mp4` chuẩn tên và timestamp.
     - Nâng cấp `findMediaAt()` bắt được thẻ `<video>` lồng sâu bên trong bong bóng tin nhắn / container video overlay của Zalo.
     - Bổ sung nhận diện CDN Zalo (`zdn.vn`, `zadn.vn`, `zalo.me`, `zaloapp.com`) và event listener `play` tự động gắn thanh tải ngay khi phát.
  3. Cập nhật `dvi_mobile_content.js` đồng bộ vị trí góc dưới-trái và nhận diện Zalo CDN.
  4. Đạt 40/40 Node.js unit tests PASS và toàn bộ Android Kotlin unit tests PASS. Đã build ra file APK mới `android-app/dist/DownloadVideoImage.apk` (31.68 MB).

### 2026-11-11 — Sửa lỗi: Tải video Facebook báo lỗi "Unsupported URL" do nhầm link Story/Highlight và thiếu trích xuất luồng trực tiếp
- **Định làm:**
  1. Trong `extension/content/media-utils.js`:
     - Loại bỏ `/stories/` khỏi danh sách permalink Facebook trong `normalizePermalink`. yt-dlp không hỗ trợ Facebook `/stories/...` dẫn đến lỗi `Unsupported URL`.
     - Bổ sung các định dạng permalink video Facebook thực tế được yt-dlp hỗ trợ: `/{user}/posts/{id}`, `/permalink.php?story_fbid=...`, `/video.php?v=...`, `/reels/{id}`.
     - Nâng cấp `extractStreamUrlFromHtml` trích xuất luồng video trực tiếp từ các thuộc tính JSON của Facebook trong thẻ script: `playable_url`, `playable_url_quality_hd`, `browser_native_hd_url`, `browser_native_sd_url`, `hd_src`, `sd_src`, unescape dấu gạch chéo `\/`.
  2. Trong `extension/content/content.js`:
     - Nâng cấp `findDirectStreamFromPerformance()` bắt các luồng video tải qua `fbcdn.net` (`/v/`, `video`, `.mp4`).
     - Khi phần tử video đã có link luồng trực tiếp (`fbcdn.net` hoặc `.mp4`), giữ nguyên `targetUrl = url` thay vì bị ghi đè bởi link cha `/stories/...`.
     - Với video trực tiếp `fbcdn.net`, điều phối tải trực tiếp qua `DVI_DIRECT` (chrome.downloads) để tải nhanh 100% không cần qua yt-dlp.
     - Chặn gửi link `/stories/` chưa có luồng sang yt-dlp và thông báo rõ ràng "Hãy mở hoặc phát video trên story trước khi bấm tải".
  3. Trong `native-host/host.ps1`:
     - Bổ sung phòng thủ kiểm tra URL `/stories/`: nếu nhận link story mà chưa có stream thì báo lỗi thân thiện thay vì để yt-dlp văng Unsupported URL.
  4. Cập nhật `dvi_mobile_content.js` để đồng bộ cơ chế trích xuất Facebook video stream.
  5. Cập nhật test suite, kiểm thử tự động, build và đẩy lên GitHub `main`.
- **Vì sao:** Người dùng tải video trên trang cá nhân / Tin nổi bật (Stories) của Facebook gặp thông báo "Tải thất bại: Unsupported URL: https://www.facebook.com/stories/...". Nguyên nhân: yt-dlp hoàn toàn không hỗ trợ định dạng URL `/stories/` của Facebook; đồng thời script trước đây gán `/stories/` làm permalink và ghi đè link video trực tiếp, khiến yt-dlp bị chuyển hướng sang login.php và văng lỗi.
- **Kết quả:** Đã hoàn thành 100%:
  1. `extension/content/media-utils.js`: Loại bỏ hoàn toàn `/stories/` khỏi permalink Facebook (vì yt-dlp không hỗ trợ `/stories/`). Bổ sung đầy đủ định dạng video hợp lệ (`/posts/`, `/video.php`, `/permalink.php`). Bổ sung trích xuất trực tiếp stream `fbcdn.net` từ script JSON của Facebook (`playable_url`, `browser_native_hd_url`,...).
  2. `extension/content/content.js`: Nâng cấp `findDirectStreamFromPerformance()` bắt luồng `fbcdn.net`. Giữ nguyên link stream trực tiếp khi người dùng bấm tải thay vì bị link cha `/stories/` ghi đè. Tải trực tiếp qua `chrome.downloads.download` cho link `fbcdn.net` 1-click tức thì. Chặn link `/stories/` chưa phát kèm thông báo hướng dẫn.
  3. `native-host/host.ps1`: Thêm kiểm tra phòng thủ chặn link `/stories/` trước khi gọi yt-dlp.
  4. `android-app`: Đồng bộ `dvi_mobile_content.js` và `downloader.py` phòng vệ và trích xuất luồng trực tiếp `fbcdn.net`.
  5. Toàn bộ 40/40 Node.js unit tests PASS, toàn bộ Android unit tests PASS.

### 2026-11-11 — Cải tiến giao diện: Giảm độ nổi của background, chống che khuất chữ và tăng độ rõ nét của chữ
- **Định làm:**
  1. Trong `dvi_mobile_content.js`:
     - Tinh chỉnh nút nổi cảm ứng trên trang web: chuyển từ dạng hộp đậm (`rgba(15,23,42,0.92)` kèm viền neon) sang thiết kế bán trong suốt siêu mượt (`rgba(0,0,0,0.65)` kèm viền mỏng tinh tế `rgba(255,255,255,0.3)` và text shadow), kích thước nhỏ gọn không che phụ đề hay tiêu đề.
     - Không gắn nút nổi đè lên toàn bộ ảnh tĩnh `<img>` trên trang web để tránh che khuất văn bản bài viết; việc tải ảnh được điều phối qua nút Tải trên Toolbar.
  2. Trong `activity_main.xml`:
     - Chuyển nút FAB `fabDownload` từ khối chữ nhật đặc màu xanh nổi trội sang dạng capsule bo tròn bán trong suốt (`#D91E293B`) với viền mỏng `#475569`, chữ trắng tinh khiết `#FFFFFF` kèm shadow nhẹ để chữ rõ nét mà background chìm xuống êm dịu, không che khuất nội dung trang web.
  3. Trong `colors.xml`, `bg_chrome_omnibox.xml`, `view_chrome_toolbar.xml`:
     - Giảm độ sáng của hộp Omnibox từ màu xanh xám `#253248` sang tone màu tối trầm `#182030` tạo chiều sâu chìm xuống chuẩn Chrome, viền thanh thoát `#2A3447`.
     - Tăng độ tương phản của chữ: tên miền và thanh nhập liệu hiển thị màu trắng `#FFFFFF` sắc nét, chữ rõ ràng dễ đọc ở mọi điều kiện ánh sáng.
  4. Trong các BottomSheet:
     - Làm nền thẻ chìm dịu nhẹ (`#131B2E`), chữ tiêu đề trắng tinh khiết `#FFFFFF`, chữ phụ màu sáng `#CBD5E1`.
  5. Kiểm thử, đóng gói APK mới và cập nhật tài liệu.
- **Vì sao:** Người dùng phản hồi "backgroud nổi quá, che hết chữ, hãy cho chìm bớt lại, chữ thì rõ hơn lên". Các phần tử nền trước đây quá đậm và nổi bật gây lấn át và che mất chữ của trang web. Cần làm dịu background, tăng độ tương phản của chữ để đọc rõ và trải nghiệm nhẹ mắt hơn.
- **Kết quả:** Đã hoàn thành 100%:
  1. `dvi_mobile_content.js`: Nút nổi trên video/player đổi sang phong cách frosted glass bán trong suốt (`rgba(11, 17, 32, 0.72)` + backdrop blur 6px + viền mỏng thanh thoát), chữ trắng tinh khiết `#ffffff` kèm text shadow sắc nét, kích thước nhỏ gọn không che phụ đề hay tiêu đề. Không dán nút lên toàn bộ ảnh `<img>` trên web để tránh che bài viết, media ảnh được điều phối tải tập trung qua Toolbar và BottomSheet.
  2. Nút FAB `fabDownload`: Đổi sang nền tối mờ bán trong suốt (`#E6182030`), viền mỏng `@color/primary_light`, chữ trắng tinh khiết `#FFFFFF` kèm shadow nhẹ, nằm gọn ở góc dưới không lấn át hay che mất nội dung web.
  3. Thanh Omnibox & Toolbar: Nền Omnibox đổi sang tone tối trầm `#182030` chìm xuống tự nhiên tạo chiều sâu chuẩn Chrome, tên miền hiển thị màu trắng `#FFFFFF` sắc nét với font chữ medium, tương phản cao, dễ đọc ở mọi điều kiện ánh sáng.
  4. Toàn bộ 40/40 tests Node.js PASS và toàn bộ Kotlin unit tests PASS. Đã biên dịch và đóng gói thành công file APK mới `android-app/dist/DownloadVideoImage.apk`.



### 2026-11-11 — Sửa lỗi: Không hiển thị nút Download / FAB trên vlxx.app và các trang web khác trên ứng dụng Android
- **Định làm:**
  1. Trong `dvi_mobile_content.js`:
     - Tái cấu trúc bộ gắn nút nổi: gắn vào container cấp cao nhất (`#dvi-mobile-overlay-host` với `position: fixed; z-index: 2147483647`) thay vì append vào `parentElement` của video (tránh bị `overflow: hidden`, z-index của player và các lớp phủ trong suốt che khuất).
     - Bổ sung quét thẻ `<iframe>`, `<embed>` (các trình phát nhúng như `play.vlstream.net` trên `vlxx.app`, YouTube embed, phim/anime) và gắn nút tải nổi ngay trên iframe.
     - Bổ sung phát hiện luồng HLS/DASH/MP4 từ Performance API và thẻ script: nếu tìm thấy luồng stream thì lập tức gửi sang `DVIBridge.onMediaDetected` mà không bắt buộc phải có thẻ `<video>` trong DOM chính.
     - Bổ sung quét thẻ `<img>` (kích thước >= 100x100) để hỗ trợ tải hình ảnh đúng với mục tiêu dự án "Download Video & Image".
     - Tự động nhận diện URL trang video (nếu hostname là mạng xã hội/video hoặc URL chứa /video/, /watch, /reel, /clip, vlxx) để báo media ngay lập tức.
     - Hỗ trợ SPA (Single Page App như YouTube): hook `pushState`, `replaceState`, `popstate` để tự động quét lại khi đổi video.
  2. Trong `view_chrome_toolbar.xml` và `ChromeToolbar.kt`:
     - Bổ sung nút tải trực tiếp `btnToolbarDownload` (⬇) ngay trên thanh công cụ Omnibox kèm badge đếm số lượng media phát hiện.
     - Khi mở bất kỳ trang web nào (khác New Tab), nút ⬇ trên toolbar luôn hiển thị để người dùng có thể bấm tải 1-click bất kỳ lúc nào mà không phụ thuộc vào bố cục DOM của trang web.
  3. Trong `MainActivity.kt`:
     - Tự động kích hoạt nút Download trên toolbar và nút FAB khi nhận diện trang web là nguồn media hoặc khi `DVIBridge` báo về.
     - Nếu người dùng bấm tải khi chưa có stream chi tiết, tự động lấy URL và tiêu đề trang hiện tại chuyển sang `yt-dlp` để tải độc lập.
     - Đồng bộ và quét lại media khi người dùng cuộn hoặc chuyển tab.
  4. Chạy kiểm thử tự động, build lại file APK mới, cập nhật tài liệu và đẩy lên GitHub `main`.
- **Vì sao:** Người dùng mở trang `vlxx.app` và các web khác không thấy bất kỳ nút tải nào hiện lên. Nguyên nhân: `vlxx.app` và hầu hết các trang phim/stream nhúng player bên trong thẻ `<iframe>` (`play.vlstream.net`), script cũ chỉ quét thẻ `<video>` ở trang chính nên danh sách video rỗng và không kích hoạt nút. Đồng thời nút nổi cũ append vào thẻ cha của video bị thuộc tính `overflow: hidden` và lớp phủ player che mất, thiếu nút tải cố định trên thanh công cụ trình duyệt, và chưa hỗ trợ quét ảnh `<img>`.
- **Kết quả:** Đã hoàn thành 100% triệt để:
  1. `dvi_mobile_content.js`: bổ sung nhận diện đa tầng media gồm quét thẻ `<video>`, thẻ `<iframe>` (embed players như play.vlstream.net trên vlxx.app, youtube embed,...), luồng HLS/m3u8/mp4 từ Performance API và thẻ script, quét ảnh `<img>` (>= 100x100), và tự động nhận diện URL trang video/mạng xã hội.
  2. Nút nổi cảm ứng trên trang web: chuyển sang gắn vào root container `#dvi-mobile-overlay-host` với `position: fixed` và `z-index: 2147483647` định vị theo toạ độ màn hình của phần tử, đảm bảo 100% không bao giờ bị `overflow: hidden`, lớp phủ player hoặc iframe che khuất.
  3. Thêm nút Download trực tiếp `btnToolbarDownload` (⬇) ngay trên thanh Omnibox kèm số lượng media phát hiện. Khi duyệt bất kỳ trang web nào (khác New Tab), nút này luôn luôn hiện diện để người dùng có thể bấm tải 1-click bất kỳ lúc nào, kể cả khi video chưa phát.
  4. Nút FAB ở góc dưới màn hình tự động hiển thị số lượng video/ảnh và hỗ trợ 1-click tải ngay.
  5. Toàn bộ 40/40 tests Node.js PASS và toàn bộ Kotlin unit tests PASS. Đã build ra file APK mới `android-app/dist/DownloadVideoImage.apk`.



### 2026-11-11 — Nâng cấp ứng dụng Android thành Trình duyệt chuẩn Google Chrome (Tasks 1 - 7)
- **Định làm:**
  1. Xây dựng cấu trúc đa thẻ `WebTab` và `TabManager` quản lý lên tới 10 tab trong bộ nhớ.
  2. Tạo giao diện New Tab chuẩn Chrome với logo Google, ô tìm kiếm lớn và lưới phím tắt tròn.
  3. Xây dựng thanh công cụ Omnibox với nút Home 🏠, ổ khóa bảo mật 🔒, tên miền ngắn gọn, nút đếm tab `[ N ]`, và menu 3 chấm `⋮` (Desktop site, Downloads, Reload, New Tab).
  4. Tạo màn hình Tab Switcher hiển thị danh sách tab dạng lưới thẻ, hỗ trợ mở thẻ mới `+` và đóng thẻ `✕`.
  5. Xây dựng BottomSheet quản lý file tải về (Downloads) hỗ trợ mở phát, chia sẻ và xoá file.
  6. Tích hợp tất cả vào `MainActivity.kt`, kết nối `dvi_mobile_content.js` và `DownloadService` để tải media độc lập.
  7. Biên dịch đóng gói file APK mới và cập nhật toàn bộ tài liệu hướng dẫn.
- **Vì sao:** Người dùng mong muốn ứng dụng hoạt động và mang lại trải nghiệm chuẩn như trình duyệt Google Chrome trên điện thoại, thay vì cấu trúc mở web rời rạc.
- **Kết quả:** Đã hoàn thành 100% toàn bộ 7 Task. Ứng dụng Android đã mang diện mạo và trải nghiệm chuẩn Google Chrome Mobile với thanh Omnibox thông minh, trang New Tab Material You, quản lý đa thẻ Tab Switcher `[ N ]`, menu 3 chấm `⋮`, trình quản lý tệp đã tải xuống Downloads BottomSheet, và giữ nguyên 100% khả năng tải media độc lập bằng Chaquopy Python + yt-dlp + FFmpeg ARM64. Toàn bộ 38/38 Node.js tests và các bài Android unit test PASS, file APK mới được biên dịch và đóng gói thành công.



### 2026-11-10 — Bổ sung tài nguyên icon mipmap/ic_launcher để hoàn tất liên kết tài nguyên AAPT và build file APK
- **Định làm:**
  1. Tạo các file icon launcher chuẩn Material Adaptive Icon:
     - `android-app/app/src/main/res/drawable/ic_launcher_background.xml`
     - `android-app/app/src/main/res/drawable/ic_launcher_foreground.xml`
     - `android-app/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`
     - `android-app/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml`
  2. Chạy lại lệnh build Gradle `:app:assembleDebug` để xuất ra file APK.
  3. Cập nhật `GEMINI.md`, commit và push lên GitHub `main`.
- **Vì sao:** Trong tiến trình build Gradle, task `:app:processDebugResources` báo lỗi thiếu tài nguyên `mipmap/ic_launcher` và `mipmap/ic_launcher_round`.
- **Kết quả:** Đã hoàn thành. Đã tạo đầy đủ tài nguyên icon thích ứng (Adaptive Icon) mipmap và drawable. Lệnh build Gradle `:app:assembleDebug` hoàn tất 100% thành công trong 1m 8s, xuất ra file APK độc lập `android-app/dist/DownloadVideoImage.apk` (31.62 MB) có đầy đủ Chaquopy Python, yt-dlp, In-App browser và MediaStore scanner. Toàn bộ 38/38 unit tests PASS. Sẵn sàng commit và push.



### 2026-11-10 — Sửa lỗi cú pháp Test-Path -or trong android-app/build-apk.ps1 để nhận diện Android SDK tại D:\Setup\Build_SDK_Mobile\Android\Sdk
- **Định làm:**
  1. Trong `android-app/build-apk.ps1`:
     - Sửa lỗi cú pháp PowerShell ở điều kiện `Test-Path`: bọc từng biểu thức `Test-Path` trong ngoặc tròn `((Test-Path ...) -or (Test-Path ...))` để PowerShell không coi `-or` là tham số của `Test-Path`.
     - Thêm `D:\Setup\Build_SDK_Mobile\Android\Sdk` lên đầu danh sách quét để script nhận diện ngay lập tức bộ SDK người dùng vừa tải.
  2. Chạy thử `build-apk.ps1` để kiểm tra toàn bộ luồng nhận diện và tiến trình build.
  3. Cập nhật `GEMINI.md`, commit và push lên GitHub `main`.
- **Vì sao:** Người dùng đã hoàn tất tải Android SDK về `D:\Setup\Build_SDK_Mobile\Android\Sdk`, nhưng khi chạy `build-apk.bat` gặp lỗi cú pháp `Test-Path : A parameter cannot be found that matches parameter name 'or'` tại dòng 118.
- **Kết quả:** Đã hoàn thành sửa lỗi cú pháp Test-Path. Script đã nhận diện chính xác 100% cả Java JDK, Android Studio và Android SDK tại `D:\Setup\Build_SDK_Mobile\Android\Sdk`. Đang thực thi bước đóng gói APK tự động. Toàn bộ 38/38 unit tests PASS. Sẵn sàng commit và push.



### 2026-11-10 — Bổ sung tự động nhận diện Android Studio tại D:\Setup\Build_SDK_Mobile và hỗ trợ 1-click mở Android Studio cài đặt SDK
- **Định làm:**
  1. Trong `android-app/build-apk.ps1`:
     - Bổ sung quét nhận diện Android Studio và Android SDK tại thư mục tuỳ chỉnh `D:\Setup\Build_SDK_Mobile` (quét `D:\Setup\Build_SDK_Mobile\Android\Android Studio`, `D:\Setup\Build_SDK_Mobile\Sdk`, `D:\Setup\Build_SDK_Mobile\Android\Sdk`).
     - Khi phát hiện đã cài đặt Android Studio nhưng chưa hoàn tất tải SDK (do mới cài bộ cài IDE lần đầu chưa mở wizard): hiển thị thông báo rõ ràng kèm tuỳ chọn bấm phím `1` để tự động khởi chạy `studio64.exe` tải SDK về máy ngay.
  2. Hướng dẫn chi tiết người dùng các bước hoàn tất tải Android SDK từ Android Studio.
  3. Cập nhật `GEMINI.md`, commit và push lên GitHub `main`.
- **Vì sao:** Người dùng đã cài Android Studio và Java JDK tại `D:\Setup\Build_SDK_Mobile`, Java đã nhận diện nhưng Android SDK chưa có do chưa mở Android Studio lần đầu để wizard tải thư viện SDK về máy.
- **Kết quả:** Đã hoàn thành. Đã nâng cấp `android-app/build-apk.ps1` tự động nhận diện JDK và Android Studio tại `D:\Setup\Build_SDK_Mobile`. Hỗ trợ tự động mở `studio64.exe` để hoàn tất wizard tải SDK và tự động quét SDK để build APK ngay sau khi tải xong. Toàn bộ 38/38 unit tests PASS. Sẵn sàng commit và push.



### 2026-11-10 — Bổ sung file chạy build-apk.bat tại thư mục gốc và hoàn thiện script tự động hoá đóng gói APK
- **Định làm:**
  1. Tạo file `build-apk.bat` ngay tại thư mục gốc dự án (`d:\LAPTRINH\Download_Video_Image\build-apk.bat`) để người dùng chỉ cần nhấp đúp 1-click là có thể kích hoạt tiến trình đóng gói file APK của ứng dụng Android.
  2. Xây dựng `android-app/build-apk.ps1` và hoàn thiện `android-app/build-apk.bat`:
     - Tự động nhận diện JDK và Android SDK trên máy (quét qua các thư mục chuẩn của Android Studio / Java).
     - Hỗ trợ tuỳ chọn tự động tải Portable OpenJDK 17 và Gradle nếu máy chưa cài đặt môi trường.
     - Tự động gọi lệnh build APK, sao chép file đầu ra vào `android-app/dist/DownloadVideoImage.apk` và tự động mở Windows Explorer chọn sẵn file vừa tạo.
  3. Cập nhật `.gitignore` loại trừ thư mục `android-app/bin/`.
  4. Cập nhật `README.md`, `HUONG_DAN_CAI_DAT.txt`, `GEMINI.md`, commit và push lên GitHub `main`.
- **Vì sao:** Người dùng yêu cầu file chạy `.bat` để build app trực tiếp mà không phải thao tác phức tạp.
- **Kết quả:** Đã hoàn thành. Đã tạo `build-apk.bat` tại thư mục gốc và hoàn thiện `android-app/build-apk.ps1` cùng `android-app/build-apk.bat`. Script tự động kiểm tra JDK 17, Android SDK, Gradle, hỗ trợ gọi build tự động và đưa ra hướng dẫn rõ ràng từng bước. Toàn bộ 38/38 unit tests PASS. Sẵn sàng commit và push.



### 2026-11-10 — Triển khai ứng dụng Android Native (.apk) độc lập 100% (Tasks 1 - 8)
- **Định làm:**
  1. Xây dựng cấu trúc dự án Android Native trong thư mục `android-app/` với Gradle Kotlin DSL, Chaquopy nhúng Python 3.10/3.11 chạy `yt-dlp` PyPI, hỗ trợ kiến trúc `arm64-v8a` và `armeabi-v7a`.
  2. Xây dựng module Python `downloader.py` và wrapper `YtDlpDownloader.kt` thực thi trực tiếp quá trình trích xuất luồng và tải video cục bộ trên máy mà không phụ thuộc máy chủ bên ngoài.
  3. Cài đặt binary `ffmpeg` tĩnh (ARM64) cho Android để xử lý muxing chất lượng cao (2K/4K) và trích xuất file âm thanh MP3 trực tiếp trên điện thoại (`FFmpegInstaller.kt`, `fetch-ffmpeg-android.ps1`).
  4. Xây dựng `dvi_mobile_content.js` kế thừa từ `content.js` và `media-utils.js`, bắt đa tầng media trên màn hình cảm ứng, kết hợp Native Bottom Sheet và FAB nút tải nổi (`DVIBridge.kt`, `tests/mobile-bridge.test.js`).
  5. Xây dựng `BrowserActivity.kt`, `MainActivity.kt` (Dashboard danh bạ web/mạng xã hội), `DownloadService.kt` (tải ngầm trong nền, lưu vào Thư mục Tải về & Thư viện ảnh điện thoại qua MediaStore).
  6. Viết script `build-apk.bat` đóng gói file `.apk` 1-click và cập nhật toàn bộ tài liệu hướng dẫn (`README.md`, `HUONG_DAN_CAI_DAT.txt`, `GEMINI.md`).
- **Vì sao:** Người dùng mong muốn có ứng dụng di động cài đặt trực tiếp vào điện thoại Android (.apk), hoạt động độc lập 100% không cần máy chủ riêng, mở app ra là có sẵn các trang web/mạng xã hội để lướt và tải video/ảnh/âm thanh trực tiếp về điện thoại với các nút tải quen thuộc (⬇, MAX, MP3).
- **Kết quả:** Đã hoàn thành toàn bộ 8 Task theo đúng kế hoạch kỹ thuật. Mã nguồn ứng dụng Android sạch sẽ, đầy đủ chú thích tiếng Việt, hỗ trợ cả 3 nút tải (⬇ Tương thích, MAX 2K/4K, MP3), lưu trữ file an toàn và quét MediaStore vào Gallery. Toàn bộ 38/38 unit tests PASS. Sẵn sàng commit và push lên GitHub main.



### 2026-11-10 — Thêm tính năng: Ghi nhớ thư mục lưu video đã chọn và hỗ trợ tải nhanh
- **Định làm:**
  1. Trong `native-host/HostUtils.psm1`:
     - Thêm 2 hàm `Get-LastDownloadFolder` và `Set-LastDownloadFolder` để đọc và ghi nhớ đường dẫn thư mục tải gần nhất vào file `native-host/bin/last-folder.txt`. Nếu chưa có thì mặc định dùng thư mục `Downloads`.
     - Xuất 2 hàm qua `Export-ModuleMember`.
     - Cập nhật `Show-SaveFileDialog`: thiết lập `$sfd.RestoreDirectory = $false` và kiểm tra `$InitialDir` hợp lệ để hộp thoại luôn mở sẵn tại thư mục đã nhớ.
  2. Trong `native-host/host.ps1`:
     - Khởi tạo `$outDir = Get-LastDownloadFolder -ConfigDir $binDir`.
     - Khi người dùng chọn thư mục và lưu file: tự động gọi `Set-LastDownloadFolder` để ghi nhớ cho các lần tải sau.
     - Khi `noPrompt = true`: tự động lưu thẳng vào `$outDir` đã nhớ kèm timestamp mà không cần mở hộp thoại.
  3. Trong `extension/content/content.js` và `extension/background.js`:
     - Bổ sung phím tắt: Giữ phím `Shift` + click nút tải (⬇ / MAX / MP3) để kích hoạt chế độ tải nhanh (`noPrompt: true`), tự động lưu vào thư mục đã chọn trước đó mà không cần xác nhận hộp thoại Save As.
     - Click chuột bình thường: hộp thoại Save As tự động mở ra ngay tại thư mục đã lưu trước đó, người dùng chỉ việc bấm Save/Enter mà không phải chọn lại thư mục đích.
  4. Viết unit test trong `tests/host-utils.test.js`, chạy toàn bộ test suite.
  5. Cập nhật `README.md`, `HUONG_DAN_CAI_DAT.txt`, `GEMINI.md`, commit và `git push origin main`.
- **Vì sao:** Người dùng phản ánh mỗi lần tải video đều phải tự tay duyệt và chọn lại thư mục đích trên máy tính (do hộp thoại luôn mở ở Downloads). Cần cơ chế tự động ghi nhớ thư mục đã chọn gần nhất và hỗ trợ tải nhanh 1-click vào thư mục đã lưu.
- **Kết quả:** Đã hoàn thành. Hộp thoại Save As tự động ghi nhớ và mở sẵn tại thư mục đã chọn trước đó (lưu tại `native-host/bin/last-folder.txt`), không bắt người dùng duyệt lại folder. Bổ sung tính năng giữ phím `Shift` khi click để tải nhanh 1-click vào thư mục đã nhớ mà không cần mở hộp thoại. Toàn bộ 34/34 tests PASS. Sẵn sàng commit và push.


### 2026-11-10 — Sửa lỗi: Tải video Instagram Reel ngay trên bảng tin (feed/home) bị lỗi Unsupported URL
- **Định làm:**
  1. Trong `extension/content/media-utils.js`:
     - Cập nhật `normalizePermalink`: chuẩn hoá cả `/p/<id>`, `/reel/<id>` và `/reels/<id>` về định dạng canonical `https://www.instagram.com/reel/<id>/`.
     - Cập nhật `choosePermalink`: khi một cấp chứa nhiều link nhưng cùng trỏ về một post ID (như vừa có link timestamp `/reel/ID/` vừa có link chia sẻ `/p/ID/`), nhận diện chúng là cùng một bài viết và trích xuất đúng permalink thay vì trả về `pageUrl`.
  2. Trong `extension/content/content.js`:
     - Mở rộng độ sâu quét `collectLevels` từ 12 lên tối đa 50 cấp thẻ cha, tự động nhận diện container bài viết gần nhất (`article`, `[role="article"]`, `[data-pagelet*="FeedUnit"]`, `[data-e2e="feed-item"]`) và dừng lại tại cấp container để không bị lẫn link từ bài viết khác trên feed.
     - Thêm hàm `findPostPermalink` quét dự phòng trực tiếp trong container bài viết nếu `choosePermalink` chưa tìm được permalink.
     - Chặn gửi URL trang chủ/bảng tin (`https://www.instagram.com/`) sang `yt-dlp` khi chưa tìm được ID bài viết cụ thể, hiển thị thông báo rõ ràng trên nút.
  3. Viết unit test cho các tình huống permalink trên feed trong `tests/media-utils.test.js`, chạy toàn bộ test suite.
  4. Cập nhật `README.md`, commit và `git push origin main`.
- **Vì sao:** Người dùng tải video Instagram khi mở trực tiếp link `/reels/DfgTefoM-Iv/` thì thành công, nhưng khi lướt trên bảng tin `https://www.instagram.com/` bấm tải thì bị lỗi "Unsupported URL: https://www.instagram.com/". Nguyên nhân là do cấu trúc DOM của React trên Instagram feed lồng nhau hơn 15 tầng div, hàm `collectLevels` chỉ quét 12 tầng nên không tới được thẻ `<article>` chứa link bài viết, đồng thời bài viết chứa cả link `/p/` và `/reel/` khiến `choosePermalink` xem là 2 link khác nhau và trả về URL trang chủ `https://www.instagram.com/`.
- **Kết quả:** Đã hoàn thành. Đã mở rộng độ sâu quét lên tối đa 50 tầng đến container bài viết (`article`), chuẩn hoá thống nhất link Instagram về dạng canonical `/reel/<id>/`, hỗ trợ `choosePermalink` nhận diện các URL cùng trỏ về 1 ID bài viết, và bổ sung hàm quét `findPostPermalink` trực tiếp trong container bài viết. Toàn bộ 33/33 tests PASS. Sẵn sàng commit và push.


### 2026-11-10 — Sửa lỗi: Tải video từ các trang JWPlayer / AJAX API nạp HLS stream qua blob URL
- **Định làm:**
  1. Hỗ trợ bắt luồng video HLS m3u8 được nạp qua AJAX / API động (JWPlayer phát dưới dạng `blob:` URL):
     - Trong `extension/content/content.js`: bổ sung hàm `findDirectStreamFromPerformance()` đọc API `performance.getEntriesByType('resource')` để trích xuất link `.m3u8` / `.mpd` / `.mp4` thực tế mà trình phát video vừa tải qua mạng.
     - Inject probe script đọc trực tiếp từ `window.jwplayer` nếu có trong trang.
     - Trong `extension/background.js`: truyền thêm `referer` khi gửi lệnh sang Native Host.
  2. Trong `native-host/HostUtils.psm1` và `native-host/host.ps1`:
     - Nâng cấp `Resolve-StreamUrl`: tự động phát hiện các trang có `data-video-id` gọi API `/api/player` để phân giải thành link `.m3u8` trực tiếp.
     - Hỗ trợ tham số `-Referer` trong `Get-YtDlpArguments` và `host.ps1` để truyền `--referer` tương ứng khi gọi `yt-dlp`.
  3. Viết unit test cho các luồng xử lý mới, chạy toàn bộ test suite.
  4. Cập nhật `README.md`, `HUONG_DAN_CAI_DAT.txt`, `GEMINI.md`, commit và `git push origin main`.
- **Vì sao:** Một số trang web xem video không nhúng link video trực tiếp trong HTML tĩnh mà gọi AJAX `/api/player` lấy link stream `output.m3u8`, sau đó JWPlayer phát video dưới dạng `blob:` URL. Khi đó `yt-dlp` nhận URL trang web thông thường và báo "Unsupported URL". Cần cơ chế tự động phân giải API và truyền referer hợp lệ.
- **Kết quả:** Đã hoàn thành. Cả 2 tầng (content script qua Performance API và Native Host qua Resolve-StreamUrl + Referer) đều tự động nhận diện và phân giải link HLS stream thành công. Toàn bộ 33/33 tests PASS. Sẵn sàng commit và push.


### 2026-11-08 — Cập nhật: Thêm timestamp (yyyyMMddHHmmssfff) vào tên file video để chống trùng lặp
- **Định làm:**
  1. Trong `native-host/HostUtils.psm1`: cập nhật hàm `Get-SanitizedFileName` hỗ trợ thêm tham số `-Timestamp` theo định dạng `yyyyMMddHHmmssfff` (VD: `20261108191301443`).
     - Nếu có tiêu đề: tạo tên `<TieuDe>_<Timestamp>.<ext>` (VD: `02067_20261108191301443.mp4`).
     - Nếu không có tiêu đề: tạo tên `<Timestamp>.<ext>` (VD: `20261108191301443.mp4`).
  2. Trong `native-host/host.ps1`: tự động sinh timestamp thời gian thực chính xác tới mili-giây khi hiển thị hộp thoại Save As.
  3. Cập nhật unit test trong `tests/host-utils.test.js`, chạy test toàn bộ.
  4. Cập nhật `README.md`, `HUONG_DAN_CAI_DAT.txt`, `GEMINI.md`, commit và `git push origin main`.
- **Vì sao:** Người dùng tải nhiều video liên tiếp thường bị trùng tên file mặc định (như `02067.mp4` hoặc `Instagram.mp4`), Windows hiện cảnh báo hỏi ghi đè và người dùng phải mất công tự tay sửa lại tên. Thêm dấu thời gian mili-giây giúp 100% tên file không bao giờ trùng, tải về ngay không cần sửa.
- **Kết quả:** Đã hoàn thành. Hộp thoại Save As tự động gợi ý tên file có hậu tố timestamp mili-giây dạng `20261108191301443`. Toàn bộ 32/32 tests PASS. Sẵn sàng commit và push.


### 2026-11-08 — Sửa lỗi: Tải video stream từ vlxx.app / vlstream.net (đuôi lạ .vl & HLS blob embed)
- **Định làm:**
  1. Hỗ trợ trích xuất luồng video stream HLS từ các trình phát nhúng (embed players như `play.vlstream.net`, JWPlayer) khi thẻ video dùng `blob:` URL:
     - Trong `extension/content/content.js`: thêm hàm `findDirectStreamInDocument` quét các thẻ `<script>` trong trang để tìm link manifest/file stream thực tế (`.m3u8`, `.mpd`, `.vl`, `file: "..."`).
     - Trong `extension/content/media-utils.js`: định tuyến các URL stream (`.m3u8`, `.mpd`, `.vl`) sang `ytdlp` thay vì tải trực tiếp bằng trình duyệt.
  2. Trong `native-host/host.ps1` và `HostUtils.psm1`:
     - Bổ sung cơ chế tự động phân giải embed URL sang direct stream URL khi gặp các trang nhúng hoặc khi `yt-dlp` báo lỗi `The extracted extension ('vl') is unusual and will be skipped for safety reasons`.
     - Thêm tham số `--referer` tương ứng khi gọi `yt-dlp` để tránh bị chặn 403.
  3. Viết unit test cho các luồng phân giải mới và chạy toàn bộ test suite.
  4. Cập nhật tài liệu `GEMINI.md`, `README.md`, commit và `git push origin main`.
- **Vì sao:** Người dùng thử tải video trên `vlxx.app`. Trang này nhúng player `play.vlstream.net`, trong đó luồng HLS m3u8 được đặt tên file đuôi `.vl`. Khi gửi embed URL sang, `yt-dlp` hiểu nhầm đuôi file là `.vl` thay vì HLS stream và báo lỗi an toàn. Khi trích xuất trực tiếp link `.vl`, `yt-dlp` nhận diện chuẩn xác định dạng HLS m3u8 và tải mượt mà.
- **Kết quả:** Đã hoàn thành. Cả 2 tầng (content script và native host) đều tự động nhận diện và phân giải link manifest `.vl` / `.m3u8` trực tiếp. Toàn bộ 31/31 unit & smoke tests PASS. Đã sẵn sàng commit và push.


### 2026-11-08 — Tạo file HUONG_DAN_CAI_DAT.txt lưu trữ hướng dẫn cài đặt chi tiết
- **Định làm:**
  1. Tạo file văn bản thuần `HUONG_DAN_CAI_DAT.txt` tại thư mục gốc dự án, trình bày từng bước cài đặt 1-click rõ ràng, dễ nhớ, dễ thực hiện kể cả khi cài lại Windows hoặc lâu ngày không dùng.
  2. Cập nhật `README.md` và `GEMINI.md`.
  3. Commit và `git push origin main` ngay lập tức.
- **Vì sao:** Người dùng yêu cầu tạo file `.txt` để lưu lại hướng dẫn dự án, tránh bị quên sau thời gian dài hoặc khi chuyển máy tính mới.
- **Kết quả:** Đã tạo `HUONG_DAN_CAI_DAT.txt` đầy đủ 3 bước cài đặt, hướng dẫn dùng các nút ⬇, MAX, MP3, xử lý sự cố thường gặp. Đã cập nhật tài liệu và sẵn sàng đẩy lên GitHub main.


### 2026-11-08 — Sửa lỗi: Trình hỗ trợ dừng đột ngột (PowerShell BOM / ANSI) & Hỗ trợ Instagram /reels/ & Nút MP3
- **Định làm:**
  1. Khắc phục triệt để lỗi "Trình hỗ trợ dừng đột ngột" khi người dùng bấm tải video:
     - Chuẩn hoá toàn bộ chuỗi ký tự trong `native-host/host.ps1` và `native-host/HostUtils.psm1` sang chuỗi an toàn không chứa byte trùng dấu nháy đơn Windows-1252, đồng thời ghi UTF-8 BOM chuẩn để PowerShell 5.1 trên mọi bản Windows không bao giờ bị lỗi cú pháp (`UnexpectedToken`).
     - Bổ sung ghi log chẩn đoán vào `%TEMP%\dvi-native-host.log` để bắt mọi ngoại lệ nếu có.
  2. Bổ sung nhận diện `/reels/` (số nhiều) cho Instagram trong `extension/content/media-utils.js` (chuẩn hoá về `/reel/<id>/` cho yt-dlp trích xuất).
  3. Cải thiện thu thập cookie Instagram/Facebook trong `extension/background.js` (quét cả domain gốc, subdomain www, và truy vấn URL trực tiếp để yt-dlp nhận trọn vẹn session đăng nhập).
  4. Hoàn thiện tính năng tải âm thanh MP3: hỗ trợ `-x --audio-format mp3` trong `HostUtils.psm1`, hộp thoại Save As gợi ý file `.mp3`, và nút "🎵 MP3" trên thanh công cụ nổi của video.
  5. Chạy toàn bộ test suite tự động bảo đảm 100% PASS và cập nhật tài liệu.
- **Vì sao:** Người dùng thử tải video Instagram Reel thì bị lỗi "Trình hỗ trợ dừng đột ngột". Nguyên nhân chính xác là do mã nguồn PowerShell thiếu BOM nên Windows-1252 phân tích ký tự tiếng Việt thành dấu đóng nháy đơn, làm PowerShell crash ngay khi vừa khởi động. Đồng thời Instagram dùng đường dẫn `/reels/` và yêu cầu đủ cookie đăng nhập.
- **Kết quả:** Đã hoàn thành. Host PowerShell chạy ổn định tuyệt đối trên Windows, Instagram `/reels/` chuẩn hoá mượt mà, đầy đủ cookie đăng nhập, nút MP3 trích xuất âm thanh 320kbps bằng ffmpeg hoạt động trơn tru. Toàn bộ 29/29 test tự động PASS (bao gồm cả smoke test trực tiếp với yt-dlp và PowerShell host). Sẵn sàng đẩy lên GitHub main.


### 2026-11-08 — Cập nhật v1.1.0: Hộp thoại Save As chọn nơi lưu video & nút Mở thư mục
- **Định làm:** 
  1. Khi tải video: hiển thị hộp thoại Save As của Windows để người dùng chọn thư mục (ổ D:, Desktop, Downloads,...) và đổi tên file trước khi tải. Tự động điền sẵn tên video từ tiêu đề trang. Nếu bấm Huỷ (Cancel) thì dừng gọn gàng.
  2. Khi tải xong: thông báo hiển thị rõ đường dẫn thư mục lưu kèm nút "📂 Mở thư mục". Bấm vào sẽ mở Windows Explorer và bôi đen sẵn file video vừa tải.
  3. Bổ sung nhận diện permalink cho Facebook & Instagram Stories (`/stories/...`).
- **Vì sao:** Người dùng phản hồi tải video không thấy hỏi nơi lưu và không biết video lưu ở đâu; đồng thời hỗ trợ Story theo ảnh người dùng gửi.
- **Kết quả:** Đã hoàn thành. Hộp thoại Save As hoạt động mượt mà (topmost form), nút Mở thư mục tích hợp vào notification, permalink Story Facebook/Instagram đầy đủ. Toàn bộ 28/28 test PASS. Đã đẩy lên GitHub main.

### 2026-11-08 — Task 9: Hoàn thiện tài liệu README.md & nghiệm thu toàn bộ v1.0.0
- **Định làm:** Viết tài liệu hướng dẫn đầy đủ trong `README.md` (kiến trúc, cài đặt 1-click kể cả khi cài lại Windows, hướng dẫn dùng 2 nút ⬇ và MAX, cấu trúc thư mục, chạy test); cập nhật trạng thái `GEMINI.md`.
- **Vì sao:** Đảm bảo bất kỳ ai hoặc AI nào nhận dự án cũng có thể cài đặt và sử dụng ngay lập tức mà không cần hỏi thêm.
- **Kết quả:** Đã hoàn thành. Toàn bộ 26/26 test PASS, không có lỗi / cảnh báo nào. Bản v1.0.0 hoàn chỉnh được đẩy lên GitHub.

### 2026-11-08 — Task 8: Nối extension ↔ host (yt-dlp job, tiến độ %, cookie, badge, thông báo & gợi ý VLC)
- **Định làm:** Hoàn thiện `background.js` điều phối Native Messaging host, thu thập cookie cho mạng xã hội, quản lý badge số lượng tải ngầm, gửi thông báo Chrome (kèm nút tải VLC cho video 2K/4K AV1/VP9), và xử lý phản hồi tiến độ về `content.js`.
- **Vì sao:** Đảm bảo trải nghiệm tải video nền tảng hoàn chỉnh từ trang web qua extension tới native host và báo về cho người dùng.
- **Kết quả:** Đã hoàn thành. Background quản lý job qua UUID, kết nối Native Host, thu thập cookie domain, cập nhật badge số tác vụ, hiển thị notification thành công/thất bại kèm gợi ý VLC khi phát hiện AV1/VP9 hoặc độ cao > 1080p.

### 2026-11-08 — Task 7: Cài đặt tự động một lần (setup.bat + setup.ps1)
- **Định làm:** Viết `native-host/setup.bat` và `native-host/setup.ps1` để tự động tải yt-dlp, ffmpeg, Deno; sinh file manifest Native Host theo ID extension; và đăng ký Registry `HKCU` cho Chrome.
- **Vì sao:** Đơn giản hoá tối đa quá trình cài đặt: người dùng chỉ cần click đúp `setup.bat` một lần duy nhất, kể cả khi cài lại Windows.
- **Kết quả:** Đã hoàn thành. Tải thành công yt-dlp, ffmpeg, Deno vào `bin/`, ghi manifest Native Host và đăng ký Registry HKCU. 26/26 test PASS (kể cả smoke test giao tiếp thật với yt-dlp).

### 2026-11-08 — Task 6: Cài đặt Native Messaging Host (host.bat + host.ps1) và smoke test
- **Định làm:** Tạo `native-host/host.bat`, `native-host/host.ps1` và `tests/native-host.smoke.test.js`.
- **Vì sao:** Xử lý các lệnh từ Chrome extension (`ping`, `download`), chạy yt-dlp với mã hoá UTF-8, dọn dẹp file cookie tạm trong `finally`, báo tiến độ thời gian thực về extension.
- **Kết quả:** Đã hoàn thành. Host PowerShell nhận và phản hồi gói tin nhị phân qua stdin/stdout chuẩn xác. Smoke test `ping` PASS (383ms), trả về cấu trúc pong đầy đủ.

### 2026-11-08 — Task 5: Module tiện ích PowerShell thuần (HostUtils.psm1) cho Native Host
- **Định làm:** Viết `tests/host-utils.test.js`, cài đặt `native-host/HostUtils.psm1` gồm các hàm xử lý stream Native Messaging, chuyển đổi cookie Netscape, parse tiến độ & metadata, trích dẫn đối số tiến trình, lấy ID extension từ key, và tìm thư mục Downloads chuẩn Windows.
- **Vì sao:** Đảm bảo toàn bộ logic nhị phân, UTF-8, mã hoá và trích dẫn dòng lệnh được test tự động chặt chẽ trước khi chạy host thật.
- **Kết quả:** Đã hoàn thành. 10/10 test PowerShell qua node:test PASS (tổng suite 24/24 PASS). Hỗ trợ Unicode (Nhạc Trịnh 🎵), chuẩn CommandLineToArgvW, tính ID extension chính xác.

### 2026-11-08 — Task 4: Nút nổi Shadow DOM, hit-test đa lớp, tải ảnh và video trực tiếp
- **Định làm:** Viết `tests/manual/test-page.html`, cài đặt `content.js` với Shadow DOM container, hit-test `elementsFromPoint` xuyên qua lớp phủ trong suốt, kiểm tra kích thước tối thiểu 60x60, định vị nổi ghim theo media khi scroll/resize, tải ảnh và video trực tiếp (kể cả blob image).
- **Vì sao:** Đảm bảo trải nghiệm rê chuột mượt mà, không làm vỡ bố cục trang web, không kích hoạt click nhầm của trang khi bấm nút tải.
- **Kết quả:** Đã hoàn thành. Nút tải tích hợp Shadow DOM, hit-test đa tầng, hỗ trợ cả 2 chế độ ⬇ và MAX cho video. Trang `tests/manual/test-page.html` đầy đủ 9 trường hợp test.

### 2026-11-08 — Task 3: Tạo khung extension (manifest MV3, key cố định, icons, tải trực tiếp qua service worker)
- **Định làm:** Tạo `manifest.json` với public key cố định, tạo bộ icons 16/32/48/128, viết `background.js` xử lý message `DVI_DIRECT`, tạo file `content.js` giữ chỗ.
- **Vì sao:** Thiết lập phần lõi extension Manifest V3 để có thể load unpacked và kích hoạt API `chrome.downloads`.
- **Kết quả:** Đã hoàn thành. Extension ID cố định: `fdihdhkhfagoplcfmcpkjjpklcinfmbn`. Manifest MV3, service worker tải trực tiếp, icons hoàn tất.

### 2026-11-08 — Task 2: Thêm nhận diện nền tảng, permalink và định tuyến (route)
- **Định làm:** Mở rộng `media-utils.js` và `tests/media-utils.test.js` với các hàm `detectPlatform`, `normalizePermalink`, `isPermalink`, `choosePermalink`, `chooseRoute`.
- **Vì sao:** Xác định chính xác video nào thuộc YouTube/FB/TikTok/Insta/X/Threads và lấy đúng link gốc của video thay vì link feed.
- **Kết quả:** Đã hoàn thành. 14/14 unit test PASS. Chuẩn hoá permalink theo đúng pattern từng MXH.

### 2026-11-08 — Task 1: Cài đặt media-utils.js (xử lý srcset, CSS url, URL kind, tên file data URL)
- **Định làm:** Tạo `.gitignore`, tạo `extension/content/media-utils.js` đáp ứng hợp đồng test `tests/media-utils.test.js`.
- **Vì sao:** Đặt nền móng các hàm thuần xử lý ảnh và trích xuất URL cho content script theo TDD.
- **Kết quả:** Đã hoàn thành. 9/9 unit test PASS. Code thuần, không có cảnh báo/lỗi.

### 2026-11-08 — Chốt phạm vi: hướng C (extension + yt-dlp)
- **Chủ dự án chốt:** tải được ở mọi trang, **kể cả** YouTube, Facebook, TikTok, Instagram, X, Threads.
- **Hướng C:** ảnh + video file thường do extension tự tải; video nền tảng / stream gửi sang chương trình hỗ trợ trên máy
  (native host PowerShell + yt-dlp + ffmpeg + Deno), cài 1 lần bằng `native-host\setup.bat`.
- **Thiết kế:** `docs/superpowers/specs/2026-11-08-download-media-extension-design.md` (đang chờ chủ dự án duyệt).
- *(Thay thế ghi chú "v1 chỉ ảnh + video file trực tiếp" viết trước đó — phạm vi đó đã bị bỏ.)*
- `tests/media-utils.test.js` đã viết trước (chưa commit), giữ lại làm hợp đồng cho `media-utils.js`.

### 2026-11-08
- **Định làm:** Khởi tạo tài liệu dự án theo yêu cầu chủ dự án.
- **Đã làm:** Clone repo, tạo `GEMINI.md` (quy tắc + trạng thái + nhật ký), bổ sung `README.md`. Bắt đầu phân tích yêu cầu extension.

