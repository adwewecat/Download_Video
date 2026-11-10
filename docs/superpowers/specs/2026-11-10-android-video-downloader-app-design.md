# Design Document: Android In-App Media Browser & Downloader

**Ngày:** 2026-11-10  
**Tác giả:** Antigravity & adwewecat  
**Trạng thái:** Đang chờ duyệt  
**Đường dẫn file:** `docs/superpowers/specs/2026-11-10-android-video-downloader-app-design.md`

---

## 1. Bối cảnh & Mục tiêu (Intent & The Why)

### 1.1. Bối cảnh
Dự án hiện tại là Chrome Extension trên Windows (`Download_Video_Image`), hỗ trợ tải mọi video và hình ảnh trên trang web bằng nút bấm nổi và phân giải stream đa nền tảng qua `yt-dlp`. 
Người dùng muốn mang toàn bộ trải nghiệm này lên thiết bị di động Android: mở một ứng dụng, có sẵn các liên kết (icon) đến các nền tảng và trang web yêu thích, mở trang ngay trong ứng dụng, tự động hiển thị nút Download nổi trên video/ảnh và tải trực tiếp vào bộ nhớ điện thoại mà không cần bất kỳ máy chủ (backend) nào.

### 1.2. Mục tiêu (Goals)
- Xây dựng ứng dụng Android Native đóng gói thành file cài đặt `.apk` độc lập 100%.
- Màn hình chính (Dashboard) hiển thị danh bạ các biểu tượng trang web/nền tảng phổ biến (YouTube, Facebook, TikTok, Instagram, X, Threads, các trang xem phim/video) kèm thanh nhập địa chỉ URL tuỳ ý.
- Trình duyệt nhúng (In-App WebView) có đầy đủ thanh điều hướng (Back, Forward, Home, Refresh).
- Tự động nhúng (inject) mã JavaScript phát hiện media và thanh nút nổi Shadow DOM (⬇ / MAX / MP3) kế thừa từ Extension hiện tại.
- Tải độc lập 100% trên điện thoại bằng `yt-dlp` chạy qua Python nhúng cục bộ (Chaquopy) và `FFmpegKit`, lưu thẳng vào thư mục `Downloads` và hiển thị ngay trên ứng dụng `Bộ sưu tập / Video` của điện thoại.
- Dung lượng APK từ 80MB - 150MB là hoàn toàn chấp nhận được.

### 1.3. Không thuộc phạm vi (Non-Goals)
- Không phát hành lên Google Play Store (phân phối trực tiếp qua file `.apk` cài ngoài để không bị Google hạn chế chính sách tải video).
- Không xây dựng phiên bản iOS trong giai đoạn này.
- Không cần máy chủ trung gian (Backend API / Cloud server) để bóc tách link.

### 1.4. Chống mục tiêu (Anti-Goals)
- Không bắt người dùng phải cài thêm ứng dụng phụ (như Termux, Python for Android riêng lẻ). Tất cả phải nằm trọn vẹn trong 1 file `.apk` duy nhất.
- Không phụ thuộc vào kết nối máy tính hay extension trên máy tính khi sử dụng trên điện thoại.

---

## 2. Các phương án kiến trúc đã xem xét (Approaches Considered)

### Phương án 1: Android Native (Kotlin) + Chaquopy Python (yt-dlp) + Static FFmpeg CLI + Android WebView (ĐƯỢC CHỌN)
- **Mô tả:** Viết ứng dụng Android Native bằng Kotlin. Sử dụng `Android System WebView` với `JavaScriptInterface` để cầu nối hai chiều giữa Web và Android. Nhúng runtime Python 3 qua thư viện `Chaquopy` vào trong file APK để thực thi `yt-dlp` trực tiếp từ bộ nhớ máy. Đóng gói binary thực thi `ffmpeg` tĩnh (static standalone binary cho ARM64-v8a) và truyền đường dẫn `ffmpeg_location` cho `yt-dlp`.
- **Ưu điểm:**
  - Hoàn toàn độc lập 100% trên điện thoại (đúng yêu cầu người dùng).
  - Sử dụng trực tiếp gói PyPI `yt-dlp` mới nhất, tương thích mọi mạng xã hội y hệt như trên máy tính.
  - `yt-dlp` tự động gọi binary `ffmpeg` tĩnh để gộp luồng video/audio và trích xuất MP3 mà không cần viết mã gộp trung gian phức tạp ở tầng Kotlin.
  - Hiệu năng WebView mượt mà, lưu file trực tiếp vào MediaStore/Downloads của Android.
- **Đánh đổi:** File APK có kích thước khoảng 80MB - 120MB (người dùng đã xác nhận không thành vấn đề).

### Phương án 2: Flutter App + flutter_inappwebview + Chaquopy Bridge (Bị loại)
- **Mô tả:** Dùng Flutter làm UI, cầu nối Kotlin để chạy Chaquopy.
- **Lý do loại:** Tăng thêm 1 tầng giao tiếp phức tạp giữa Dart và Kotlin mà không mang lại lợi ích kỹ thuật vượt trội nào cho tác vụ tải media.

### Phương án 3: Android App + API Cloud Server trung gian (Bị loại)
- **Mô tả:** Điện thoại chỉ gửi URL lên Cloud API để lấy link direct.
- **Lý do loại:** Vi phạm yêu cầu tiên quyết của người dùng là muốn app "hoạt động độc lập 100% trong máy", không muốn phụ thuộc máy chủ bên ngoài.

---

## 3. Kiến trúc chi tiết (Detailed Architecture)

```
[ Giao diện Android Native (Kotlin) ]
   ├─ DashboardActivity: Màn hình chính chứa Grid các Bookmark (Icon web) + URL Bar
   ├─ BrowserActivity: Màn hình duyệt web (Android WebView)
   │    ├─ Navigation Bar: Back, Forward, Home, Refresh, Download Manager Shortcut
   │    ├─ Native Floating Action Button (FAB): Nút tải nổi Native ở góc dưới màn hình khi phát hiện media
   │    └─ WebView Client & JavaScript Bridge
   │         └─ Inject script: dvi_mobile_content.js (kế thừa content.js & media-utils.js)
   ▼
[ Cầu nối JavaScriptInterface: @JavascriptInterface "DVIBridge" ]
   ├─ onMediaDetected(mediaInfoJson): Báo về cho Native để bật sáng nút tải FAB
   ├─ startDownload(url, platform, quality, title, referer): Nhận lệnh bấm tải
   ▼
[ Tầng xử lý tải & phân giải nền tảng (Kotlin Services) ]
   ├─ DirectDownloadManager (OkHttp / Android DownloadManager):
   │    └─ Tải trực tiếp ảnh và video file thường (.mp4, .webm)
   ├─ CookieSynchronizer:
   │    └─ Trích xuất cookie đăng nhập từ CookieManager.getInstance().getCookie(url)
   ├─ YtDlpExtractionService (Chaquopy Embedded Python 3):
   │    ├─ Chạy module Python: `import yt_dlp`
   │    ├─ Cấu hình `ffmpeg_location` trỏ tới binary ffmpeg tĩnh độc lập ARM64
   │    ├─ Truyền cookie và referer từ WebView để tải Instagram/Facebook/YouTube
   │    └─ Trích xuất và tải stream HLS/DASH đa nguồn, tự động convert MP3/mux
   ▼
[ Quản lý lưu trữ & Hệ thống Android ]
   ├─ Storage: Lưu vào /storage/emulated/0/Download/Download_Video/
   ├─ MediaStore Scanner: Cập nhật thư viện ảnh/video hệ thống
   └─ Android Notification: Hiển thị thanh tiến độ %, nút dừng, nút mở file
```

---

## 4. Các thành phần chính (Detailed Components)

### 4.1. Màn hình Dashboard (Giao diện chính)
- Lưới các icon phím tắt nhanh (Bookmarks):
  - Mạng xã hội: YouTube, Facebook, TikTok, Instagram, Threads, X (Twitter).
  - Giải trí & Phim: Trang xem phim trực tuyến, video stream.
  - Nút thêm/sửa bookmark tuỳ biến của người dùng.
- Thanh tìm kiếm và nhập URL trực tiếp ở trên cùng.

### 4.2. Trình duyệt In-App WebView
- Sử dụng `android.webkit.WebView` cấu hình đầy đủ:
  - Bật `JavaScriptEnabled = true`, `DomStorageEnabled = true`, `MediaPlaybackRequiresUserGesture = false`.
  - Cấu hình User-Agent di động chuẩn Chrome Mobile.
  - Lớp `WebViewClient` lắng nghe `onPageFinished` để tự động inject script nhận diện media.

### 4.3. Giao diện tải trên Mobile & Script phát hiện media (`dvi_mobile_content.js`)
- **Giải quyết đặc thù màn hình cảm ứng di động (Không có hover chuột):**
  - **Mô hình Hybrid (Kết hợp 2 tầng):**
    1. *Tầng In-Page Badge:* Khi video/ảnh xuất hiện trên viewport, một badge nhỏ gọn nổi ở góc trên bên phải container của video (không che thanh điều khiển play/pause hoặc timeline dưới đáy của player). Người dùng chạm vào là hiện menu tải ⬇ / MAX / MP3.
    2. *Tầng Native Floating Action Button (FAB):* Trên thanh công cụ Android bên dưới WebView, một nút tròn FAB tải video sẽ tự động sáng lên và hiển thị số lượng media phát hiện được trên trang. Khi chạm vào FAB, một Bottom Sheet Native sẽ trượt lên từ đáy màn hình liệt kê các lựa chọn: Tải MP4 chuẩn (⬇), Tải nét nhất (MAX), Tải âm thanh (MP3) kèm kích thước và codec.
- Tái sử dụng lõi logic từ `extension/content/media-utils.js` và `content.js`:
  - Trích xuất ảnh phân giải cao nhất từ `srcset`, ảnh nền CSS.
  - Bắt luồng HLS/DASH (`.m3u8`, `.mpd`, `.vl`) từ Performance API và DOM.
  - Chuẩn hoá permalink cho YouTube, TikTok, Facebook, Instagram (`/reel/<id>/`).
- Khi bấm tải, gọi hàm native:
  `window.DVIBridge.startDownload(targetUrl, platform, quality, pageTitle, referer);`

### 4.4. Module Chaquopy Python & Binary FFmpeg tĩnh (`downloader.py`)
- **Tích hợp FFmpeg tĩnh:** Đóng gói file binary thực thi `ffmpeg` tĩnh (build cho Android Linux ARM64-v8a) vào thư mục `jniLibs` hoặc `assets/bin/ffmpeg`. Khi app khởi động, cấp quyền thực thi `chmod 755` và truyền `ffmpeg_location` cho `yt-dlp`. Nhờ đó `yt-dlp` tự động gọi ffmpeg để mux video+audio và trích xuất MP3 320kbps mượt mà mà không cần tầng gộp phụ trợ ở Kotlin.
- Nhúng mã nguồn Python trong thư mục `src/main/python/`:
  ```python
  import yt_dlp
  import os

  def download_media(url, out_dir, quality='compatible', referer=None, cookies=None, ffmpeg_path=None, progress_callback=None):
      ydl_opts = {
          'outtmpl': os.path.join(out_dir, '%(title).100B [%(id)s].%(ext)s'),
          'encoding': 'utf-8',
          'no_playlist': True,
      }
      if ffmpeg_path and os.path.exists(ffmpeg_path):
          ydl_opts['ffmpeg_location'] = ffmpeg_path
      if referer:
          ydl_opts['http_headers'] = {'Referer': referer}
      if cookies:
          ydl_opts['http_headers'] = ydl_opts.get('http_headers', {})
          ydl_opts['http_headers']['Cookie'] = cookies

      # Cấu hình format theo quality (h264/aac vs best vs mp3) tương tự HostUtils
      if quality == 'mp3':
          ydl_opts['format'] = 'bestaudio/best'
          ydl_opts['postprocessors'] = [{
              'key': 'FFmpegExtractAudio',
              'preferredcodec': 'mp3',
              'preferredquality': '320',
          }]
      elif quality == 'best':
          ydl_opts['format'] = 'bv*+ba/b'
          ydl_opts['merge_output_format'] = 'mp4'
      else:
          ydl_opts['format'] = 'bv*[vcodec^=avc1]+ba[acodec^=mp4a]/b[ext=mp4]/best'
          ydl_opts['merge_output_format'] = 'mp4'

      with yt_dlp.YoutubeDL(ydl_opts) as ydl:
          ydl.download([url])
  ```
- Chaquopy tự động tải và đóng gói wheel `yt-dlp` từ PyPI khi build APK.

### 4.5. Đồng bộ Cookie xác thực từ WebView (Cookie Synchronization)
- Để tải được video cần đăng nhập (như Instagram Reels của bạn bè, nhóm kín Facebook, video giới hạn độ tuổi YouTube):
- Khi tải một URL thuộc mạng xã hội, Kotlin đọc session cookie từ `CookieManager.getInstance().getCookie(currentUrl)`.
- Chuỗi cookie này được chuyển trực tiếp vào `ydl_opts['http_headers']['Cookie']` của Python, giúp `yt-dlp` vượt qua các cổng xác thực y như khi dùng extension trên máy tính.

### 4.6. Quản lý lưu trữ & Bộ sưu tập
- Lưu vào thư mục `Environment.DIRECTORY_DOWNLOADS + "/Download_Video/"`.
- Tự động gọi `MediaScannerConnection.scanFile()` sau khi tải xong để video/ảnh xuất hiện ngay lập tức trong ứng dụng Google Photos / Thư viện Gallery của máy.
- Hỗ trợ Android 8.0 (API 26) tới Android 14+ (API 34).

---

## 5. Những phần giao lại cho người lập trình (What's Left to the Builder)
- Lựa chọn phiên bản Gradle, Chaquopy plugin và Android NDK tương thích trên môi trường build.
- Thiết kế bộ icon và giao diện màu sắc Material Design 3.
- Cơ chế lưu trữ danh sách lịch sử tải về và bookmark qua Android Room Database hoặc Preferences DataStore.

