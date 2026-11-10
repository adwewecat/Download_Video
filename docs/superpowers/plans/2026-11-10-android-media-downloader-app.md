# Android In-App Media Browser & Downloader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng ứng dụng Android Native (.apk) độc lập 100% trong máy, tích hợp trình duyệt nhúng duyệt các trang web/mạng xã hội yêu thích, tự động phát hiện media và hiển thị nút tải video/âm thanh chất lượng cao thẳng vào Bộ sưu tập/Downloads của điện thoại.

**Architecture:** Ứng dụng Android Native viết bằng Kotlin sử dụng `Android System WebView` với `JavaScriptInterface` hai chiều để inject kịch bản phát hiện media (kế thừa từ Chrome extension). Tầng tải độc lập 100% cục bộ sử dụng thư viện `Chaquopy` nhúng Python 3 thực thi trực tiếp `yt-dlp` từ PyPI, kết hợp binary `ffmpeg` tĩnh cho ARM64 để xử lý muxing và trích xuất MP3, lưu file vào MediaStore/Downloads và phát thông báo hệ thống.

**Tech Stack:** Android (Kotlin, Coroutines, Material Design 3), AndroidX WebKit, Chaquopy (Embedded Python 3.10/3.11), `yt-dlp` (PyPI), Standalone Static `ffmpeg` (ARM64-v8a Linux), OkHttp3, Android MediaStore.

**Spec:** `docs/superpowers/specs/2026-11-10-android-video-downloader-app-design.md`

## Global Constraints
- Nền tảng: Android 8.0+ (Min SDK 26, Target SDK 34).
- Cấu trúc ABI: Tối ưu cho `arm64-v8a` và `armeabi-v7a`.
- Độc lập 100%: Toàn bộ quá trình phân giải link và tải video diễn ra trên điện thoại, không phụ thuộc vào bất kỳ máy chủ backend hay dịch vụ bên ngoài nào.
- Thư mục lưu mặc định: `Environment.DIRECTORY_DOWNLOADS + "/Download_Video/"`, tự động kích hoạt `MediaScannerConnection` để xuất hiện ngay trong Gallery/Google Photos.
- Giữ vững quy tắc: Code sạch, chú thích tiếng Việt rõ ràng, cập nhật `GEMINI.md` và commit/push GitHub ngay khi hoàn thành từng task.

## Review Focus
1. **Thiếu quyền thực thi FFmpeg binary:** Binary `ffmpeg` copy từ assets vào bộ nhớ trong chưa được gán `chmod 755` dẫn đến `Permission Denied` khi Python `subprocess` gọi -> Phải có bước kiểm tra và set executable trước khi gọi `yt-dlp`.
2. **Xung đột Cookie WebView:** `CookieManager.getCookie()` trả về chuỗi header thô; nếu trang yêu cầu nhiều domain cookie (như Instagram CDN `fbcdn.net`) -> Phải truyền đúng chuỗi cookie vào `http_headers['Cookie']` cho `yt-dlp`.
3. **Bộ nhớ RAM khi tải video 2K/4K:** Quá trình muxing stream video+audio chất lượng cao của `ffmpeg` trên điện thoại yếu -> Giới hạn buffer và chạy trong background thread/foreground service có wakelock.
4. **Trang web chặn phóng to/thu nhỏ hoặc chặn JavascriptInterface:** WebView phải bật đầy đủ DOM storage, hỗ trợ mixed content và chặn rò rỉ context.
5. **Định vị nút bấm trên màn hình cảm ứng di động:** Không dựa vào chuột hover; sử dụng nút bấm nổi Native FAB ở thanh công cụ dưới kết hợp badge trên video.

---

### Task 1: Khởi tạo cấu trúc dự án Android Gradle với Chaquopy & Dependencies

**Files:**
- Create: `android-app/build.gradle.kts`
- Create: `android-app/settings.gradle.kts`
- Create: `android-app/gradle.properties`
- Create: `android-app/app/build.gradle.kts`
- Create: `android-app/app/src/main/AndroidManifest.xml`
- Test: `android-app/app/src/test/java/com/adwewecat/downloadvideo/ProjectConfigTest.kt`

**Interfaces:**
- Produces: Cấu trúc dự án Android với Chaquopy plugin `com.chaquo.python`, target SDK 34, min SDK 26, cấu hình ABI `arm64-v8a`, `armeabi-v7a`.

- [ ] **Step 1: Viết test kiểm tra cấu hình dự án (`ProjectConfigTest.kt`)**
  - Kiểm tra các hằng số cấu hình: Min SDK >= 26, Target SDK >= 34, Application ID `com.adwewecat.downloadvideo`.
- [ ] **Step 2: Chạy test để xác nhận test chạy và kiểm tra môi trường**
- [ ] **Step 3: Tạo các file cấu hình Gradle (`settings.gradle.kts`, `build.gradle.kts`, `app/build.gradle.kts`)**
  - Cấu hình plugin Android Application và Chaquopy.
  - Cấu hình khối `defaultConfig.ndk.abiFilters` cho `arm64-v8a`, `armeabi-v7a`.
  - Cấu hình khối `chaquopy` cài đặt pip package `yt-dlp`.
- [ ] **Step 4: Tạo `AndroidManifest.xml` với các quyền `INTERNET`, `POST_NOTIFICATIONS`, `ACCESS_NETWORK_STATE`**
- [ ] **Step 5: Chạy test kiểm tra cấu hình**
- [ ] **Step 6: Commit code Task 1**

---

### Task 2: Module Python trích xuất luồng `downloader.py` (Chaquopy + yt-dlp)

**Files:**
- Create: `android-app/app/src/main/python/downloader.py`
- Create: `android-app/app/src/main/java/com/adwewecat/downloadvideo/downloader/YtDlpDownloader.kt`
- Test: `android-app/app/src/test/java/com/adwewecat/downloadvideo/YtDlpConfigTest.kt`

**Interfaces:**
- Consumes: URL, quality (`compatible`, `best`, `mp3`), referer, cookie, outDir, ffmpegPath.
- Produces: `YtDlpDownloader.download(url, quality, referer, cookies, outDir, ffmpegPath, onProgress, onDone, onError)`

- [ ] **Step 1: Viết unit test cho logic tạo tham số cấu hình yt-dlp trong `YtDlpConfigTest.kt`**
  - Kiểm tra ánh xạ `compatible` -> format H.264/AAC MP4.
  - Kiểm tra ánh xạ `best` -> format `bv*+ba/b` MP4.
  - Kiểm tra ánh xạ `mp3` -> `bestaudio` + `FFmpegExtractAudio`.
- [ ] **Step 2: Viết `downloader.py`**
  - Hàm `build_ydl_opts(out_dir, quality, referer, cookies, ffmpeg_path, progress_hook)`.
  - Hàm `extract_and_download(url, opts)`.
- [ ] **Step 3: Viết lớp Kotlin wrapper `YtDlpDownloader.kt`**
  - Gọi Python thông qua `Python.getInstance().getModule("downloader")`.
  - Chạy bất đồng bộ qua Kotlin Coroutines `Dispatchers.IO`.
- [ ] **Step 4: Chạy test và xác nhận các tham số khớp 100% với logic đã kiểm chứng trong `HostUtils.psm1`**
- [ ] **Step 5: Commit code Task 2**

---

### Task 3: Trình giải nén & cài đặt Binary FFmpeg tĩnh (`FFmpegInstaller`)

**Files:**
- Create: `android-app/app/src/main/java/com/adwewecat/downloadvideo/utils/FFmpegInstaller.kt`
- Create: `android-app/tools/fetch-ffmpeg-android.ps1`
- Test: `android-app/app/src/test/java/com/adwewecat/downloadvideo/FFmpegInstallerTest.kt`

**Interfaces:**
- Produces: `FFmpegInstaller.getExecutablePath(context): String` - trả về đường dẫn file binary ffmpeg đã được cấp quyền `chmod 755`.

- [ ] **Step 1: Viết test cho `FFmpegInstallerTest.kt`**
  - Kiểm tra đường dẫn trả về nằm trong thư mục nội bộ an toàn của app (`context.filesDir/bin/ffmpeg`).
- [ ] **Step 2: Tạo script tải binary `ffmpeg` tĩnh (ARM64) cho Android `fetch-ffmpeg-android.ps1`**
- [ ] **Step 3: Cài đặt `FFmpegInstaller.kt`**
  - Kiểm tra nếu file `ffmpeg` chưa tồn tại trong `filesDir/bin`: copy từ `assets` hoặc tải về.
  - Sử dụng `file.setExecutable(true, false)` hoặc `Runtime.getRuntime().exec("chmod 755 ...")` để đảm bảo quyền thực thi.
- [ ] **Step 4: Chạy test kiểm tra logic cài đặt**
- [ ] **Step 5: Commit code Task 3**

---

### Task 4: Script phát hiện media di động (`dvi_mobile_content.js`) & Cầu nối `DVIBridge`

**Files:**
- Create: `android-app/app/src/main/assets/dvi_mobile_content.js`
- Create: `android-app/app/src/main/java/com/adwewecat/downloadvideo/bridge/DVIBridge.kt`
- Test: `tests/mobile-bridge.test.js`

**Interfaces:**
- Consumes: Sự kiện từ WebView DOM.
- Produces: `DVIBridge` với `@JavascriptInterface`:
  - `onMediaDetected(type: String, url: String, title: String, platform: String)`
  - `startDownload(url: String, platform: String, quality: String, title: String, referer: String)`

- [ ] **Step 1: Viết test node cho `dvi_mobile_content.js` trong `tests/mobile-bridge.test.js`**
  - Kiểm tra trích xuất stream `.m3u8` và chuẩn hoá permalink Instagram/TikTok/Facebook.
- [ ] **Step 2: Xây dựng `dvi_mobile_content.js` kế thừa từ `extension/content/content.js` và `media-utils.js`**
  - Lắng nghe video và hình ảnh trên trang.
  - Khi phát hiện media hợp lệ (>= 60x60px), phát tín hiệu sang `window.DVIBridge.onMediaDetected(...)`.
  - Hiển thị badge nhỏ gọn cảm ứng ở góc trên container media.
- [ ] **Step 3: Cài đặt lớp Kotlin `DVIBridge.kt`**
  - Chuyển tiếp các lời gọi JavaScript sang các callback của Android Activity.
- [ ] **Step 4: Chạy test xác nhận script hoạt động trơn tru**
- [ ] **Step 5: Commit code Task 4**

---

### Task 5: Giao diện Trình duyệt `BrowserActivity` & Bottom Sheet Tải

**Files:**
- Create: `android-app/app/src/main/res/layout/activity_browser.xml`
- Create: `android-app/app/src/main/res/layout/bottom_sheet_download.xml`
- Create: `android-app/app/src/main/java/com/adwewecat/downloadvideo/BrowserActivity.kt`
- Create: `android-app/app/src/main/java/com/adwewecat/downloadvideo/ui/DownloadBottomSheet.kt`

**Interfaces:**
- Consumes: URL truyền qua Intent.
- Produces: Màn hình duyệt web với WebView, thanh điều hướng (Back, Forward, Home, Refresh), nút FAB sáng khi có media, Bottom Sheet chọn chất lượng tải.

- [ ] **Step 1: Thiết kế giao diện XML cho `activity_browser.xml`**
  - Gồm thanh địa chỉ URL nhỏ gọn, WebView toàn màn hình, nút điều hướng, và Floating Action Button (FAB).
- [ ] **Step 2: Thiết kế giao diện Bottom Sheet `bottom_sheet_download.xml`**
  - Nút tải MP4 tương thích (⬇), Nút tải nét nhất (MAX), Nút tải âm thanh (MP3).
- [ ] **Step 3: Cài đặt `BrowserActivity.kt`**
  - Cấu hình WebView, CookieManager, WebViewClient tự động nạp `dvi_mobile_content.js`.
  - Kết nối `DVIBridge` với FAB: khi nhận `onMediaDetected`, hiển thị FAB kèm số lượng media.
  - Khi bấm FAB, mở `DownloadBottomSheet` để chọn chất lượng và bắt đầu tải.
- [ ] **Step 4: Commit code Task 5**

---

### Task 6: Dịch vụ tải ngầm (`DownloadService`), Đồng bộ Cookie & MediaStore

**Files:**
- Create: `android-app/app/src/main/java/com/adwewecat/downloadvideo/utils/StorageUtils.kt`
- Create: `android-app/app/src/main/java/com/adwewecat/downloadvideo/utils/CookieUtils.kt`
- Create: `android-app/app/src/main/java/com/adwewecat/downloadvideo/downloader/DownloadService.kt`
- Test: `android-app/app/src/test/java/com/adwewecat/downloadvideo/StorageUtilsTest.kt`

**Interfaces:**
- Consumes: Target URL, quality, title, referer từ `BrowserActivity`.
- Produces: Foreground Service tải ngầm, thông báo Android tiến độ %, lưu file vào `Download/Download_Video/` và quét MediaStore.

- [ ] **Step 1: Viết unit test cho `StorageUtilsTest.kt`**
  - Kiểm tra làm sạch tên file, thêm timestamp mili-giây chống trùng lặp theo format `yyyyMMddHHmmssfff`.
- [ ] **Step 2: Cài đặt `CookieUtils.kt`**
  - Trích xuất cookie từ `CookieManager.getInstance().getCookie(url)`.
- [ ] **Step 3: Cài đặt `StorageUtils.kt`**
  - Quản lý thư mục lưu trữ, tạo file đích an toàn, gọi `MediaScannerConnection.scanFile()`.
- [ ] **Step 4: Cài đặt `DownloadService.kt`**
  - Khởi tạo Foreground Notification với ProgressBar.
  - Điều phối `YtDlpDownloader` hoặc `DirectDownloader` (đối với ảnh/video trực tiếp).
  - Cập nhật tiến độ % lên notification; khi hoàn tất hiện thông báo thành công kèm Intent mở file.
- [ ] **Step 5: Chạy test kiểm tra `StorageUtils`**
- [ ] **Step 6: Commit code Task 6**

---

### Task 7: Màn hình chính Dashboard (`MainActivity`) & Danh bạ Bookmarks

**Files:**
- Create: `android-app/app/src/main/res/layout/activity_main.xml`
- Create: `android-app/app/src/main/res/layout/item_bookmark.xml`
- Create: `android-app/app/src/main/java/com/adwewecat/downloadvideo/MainActivity.kt`
- Create: `android-app/app/src/main/java/com/adwewecat/downloadvideo/model/Bookmark.kt`
- Create: `android-app/app/src/main/java/com/adwewecat/downloadvideo/ui/BookmarkAdapter.kt`

**Interfaces:**
- Produces: Màn hình Dashboard liệt kê các icon (YouTube, Facebook, TikTok, Instagram, Threads, X, VLXX, Web phim,...), thanh tìm kiếm/nhập link, chuyển tiếp sang `BrowserActivity`.

- [ ] **Step 1: Thiết kế `activity_main.xml` và `item_bookmark.xml`**
  - Header với thanh nhập URL / tìm kiếm.
  - Lưới RecyclerView hiển thị các icon trang web phổ biến.
- [ ] **Step 2: Cài đặt `MainActivity.kt` và `BookmarkAdapter.kt`**
  - Danh sách mặc định: YouTube, Facebook, TikTok, Instagram, X, Threads, các trang video stream.
  - Xử lý click mở `BrowserActivity` kèm URL tương ứng.
  - Xử lý nhập URL tuỳ ý từ thanh tìm kiếm.
- [ ] **Step 3: Commit code Task 7**

---

### Task 8: Script tự động hoá đóng gói APK (`build-apk.bat`) & Tài liệu hướng dẫn

**Files:**
- Create: `android-app/build-apk.bat`
- Modify: `README.md`
- Modify: `GEMINI.md`
- Modify: `HUONG_DAN_CAI_DAT.txt`

**Interfaces:**
- Produces: File `android-app/build-apk.bat` 1-click tạo file `app-release.apk` (hoặc `app-debug.apk`) và cập nhật toàn bộ tài liệu hướng dẫn.

- [ ] **Step 1: Viết script `android-app/build-apk.bat`**
  - Tự động kiểm tra Android SDK / Gradle, build file APK và xuất ra thư mục `android-app/dist/DownloadVideoImage.apk`.
- [ ] **Step 2: Cập nhật `README.md`, `GEMINI.md` và `HUONG_DAN_CAI_DAT.txt`**
  - Thêm mục giới thiệu phiên bản Mobile App Android (.apk).
  - Hướng dẫn cài đặt file APK lên điện thoại qua Zalo / Google Drive / cáp USB.
- [ ] **Step 3: Chạy toàn bộ test suite (Node tests & Android unit tests)**
- [ ] **Step 4: Commit và git push lên GitHub main**
