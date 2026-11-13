# Download Video & Image (Chrome Extension)

Chrome Extension giúp bạn tải **mọi hình ảnh và video** trên bất kỳ trang web nào bằng một cú bấm chuột:
- **Hình ảnh:** Tự động phát hiện thẻ `<img>`, chọn ảnh có độ phân giải cao nhất từ `srcset`, trích xuất ảnh nền CSS (`background-image`), ảnh `data:` base64 và ảnh `blob:`.
- **Video file thường & Zalo Web:** Tải trực tiếp qua trình duyệt với định dạng `.mp4`, `.webm`, hỗ trợ tải mượt mà video Blob trên **Zalo Web** (`chat.zalo.me`) và các web app 100% trong trình duyệt.
- **Video nền tảng / video stream:** Tự động nhận diện và hỗ trợ đầy đủ các nền tảng lớn như **YouTube, Facebook, TikTok, Instagram, X (Twitter), Threads**, cũng như các trang stream HLS/DASH và trình phát nhúng (JWPlayer, Video.js, VLStream,...).
  - Nút **⬇**: Tải bản tương thích cao (H.264 + AAC trong `.mp4`), dễ mở trên mọi thiết bị và trình phát Windows.
  - Nút **MAX**: Tải bản nét nhất có thể (2K / 4K AV1/VP9 nếu nguồn có hỗ trợ).

> **Lưu ý dành cho AI / DEV tiếp nhận dự án:** Luôn đọc [`GEMINI.md`](GEMINI.md) trước tiên. Đó là sổ tay chứa toàn bộ quy tắc bất di bất dịch, trạng thái hiện tại và nhật ký kỹ thuật của dự án.

---

## 1. Kiến trúc hoạt động

Hệ thống kết hợp giữa Chrome Extension Manifest V3 và một Native Messaging Host chạy ngầm trên Windows:

```
[ Trình duyệt Chrome ]
  ├─ Content Script (Shadow DOM khép kín, nút nổi tự căn góc media khi hover)
  ├─ Service Worker (background.js)
  │    ├─ Tải trực tiếp (chrome.downloads) đối với ảnh và file trực tiếp
  │    └─ Mở cổng Native Messaging gửi lệnh sang máy tính
  ▼
[ Native Helper trên máy ]
  ├─ host.bat -> host.ps1 (PowerShell thuần, giao thức nhị phân chuẩn Native Messaging)
  ├─ yt-dlp.exe (Trích xuất và tải stream đa nền tảng)
  ├─ ffmpeg.exe (Ghép nối video & âm thanh chất lượng cao)
  └─ deno.exe (Bộ giải mã JavaScript hỗ trợ YouTube mới nhất)
```

---

## 2. Hướng dẫn cài đặt (kể cả sau khi cài lại Windows)

Chỉ cần thực hiện 3 bước đơn giản:

### Bước 1: Tải mã nguồn về máy
Mở PowerShell hoặc Git Bash và clone repository:
```bash
git clone https://github.com/adwewecat/Download_Video.git
cd Download_Video
```

### Bước 2: Cài đặt Native Helper (Chỉ cần 1 lần duy nhất)
- Vào thư mục `native-host`, nhấp đúp vào file **`setup.bat`**.
- File sẽ tự động:
  1. Tải bộ công cụ `yt-dlp.exe`, `ffmpeg.exe`, `deno.exe` vào thư mục `native-host\bin\`.
  2. Tạo file manifest cấu hình host với ID extension cố định.
  3. Đăng ký Native Messaging Host vào Registry Windows (`HKCU`).

### Bước 3: Nạp Extension vào Chrome
1. Mở Google Chrome và truy cập địa chỉ: `chrome://extensions/`
2. Bật công tắc **Developer mode** (Chế độ dành cho nhà phát triển) ở góc trên bên phải.
3. Bấm nút **Load unpacked** (Tải tiện ích đã giải nén).
4. Chọn thư mục **`extension`** trong thư mục dự án này.

---

## 3. Cách sử dụng

1. Truy cập bất kỳ trang web nào (Youtube, Facebook, TikTok, Instagram, X, trang báo điện tử,...).
2. **Rê chuột lên hình ảnh hoặc video** bất kỳ (kích thước tối thiểu 60×60 px).
3. Một thanh công cụ nổi nhỏ gọn sẽ xuất hiện ở **góc dưới cùng bên trái** của media (tránh che khuất các thẻ thông tin và thanh điều khiển):
   - Với **hình ảnh**: Bấm nút **⬇** để tải về (tự động chọn bản nét nhất).
   - Với **video mạng xã hội / stream**:
     - Bấm nút **⬇**: Tải video chuẩn tương thích (H.264 + AAC, tối đa 1080p).
     - Bấm nút **MAX**: Tải video chất lượng cực đại (2K / 4K nếu nền tảng hỗ trợ).
     - Bấm nút **MP3**: Tải riêng âm thanh chất lượng cao (320kbps MP3 trích xuất bằng ffmpeg).
     - Hộp thoại **Save As** của Windows sẽ hiện lên:
       - **Tự động ghi nhớ thư mục:** Tự động mở sẵn tại thư mục bạn đã chọn tải về trước đó (ví dụ `D:\Videos`), không bắt bạn phải tìm lại folder đích mỗi lần tải.
       - **Không trùng tên:** Tự động điền tên kèm dấu thời gian mili-giây (VD: `Tên_20261108191301443.mp4`) để không bao giờ bị trùng tên hoặc bị hỏi ghi đè, cho phép bạn chọn lưu hoặc bấm Enter là xong (bấm Cancel để huỷ tải).
       - **Tải nhanh 1-click (không cần mở hộp thoại):** Giữ phím **Shift** khi bấm nút tải (⬇ / MAX / MP3) để tải thẳng vào thư mục đã lưu trước đó mà không cần xác nhận hộp thoại Save As.
4. Tiến độ tải sẽ hiển thị trực quan (theo %) ngay trên nút nổi và trên badge của icon extension.
5. Khi tải xong:
   - Chrome hiển thị thông báo "Tải xong" kèm đường dẫn chi tiết nơi lưu file.
   - Bấm nút **📂 Mở thư mục** (hoặc bấm thẳng vào thông báo) để File Explorer mở ra và bôi đen sẵn file vừa tải.
   - Nếu là video 2K/4K sử dụng chuẩn AV1/VP9, thông báo sẽ gợi ý kèm nút bấm để tải trình phát **VLC** (miễn phí, mở được mọi định dạng).

---

## 4. Kiểm thử tự động (Unit Tests & Smoke Tests)

Dự án có bộ test tự động đầy đủ sử dụng runner chuẩn của Node.js (không cần cài đặt thư viện ngoài):

```bash
node --test "tests/*.test.js"
```

Bao gồm:
- **`tests/media-utils.test.js`**: Kiểm tra trích xuất `srcset`, CSS `background-image`, nhận diện nền tảng (YouTube, X, Insta, FB, TikTok, Threads), chuẩn hoá permalink và quyết định đường tải.
- **`tests/host-utils.test.js`**: Kiểm tra xử lý stream Native Messaging nhị phân UTF-8, chuyển đổi cookie Netscape, trích dẫn tham số an toàn chuẩn Windows, và giải mã Extension ID.
- **`tests/native-host.smoke.test.js`**: Smoke test giao tiếp thực tế với tiến trình `host.bat` và `yt-dlp.exe`.
- **`tests/extension-safety.test.js`**: Kiểm thử hồi quy bảo mật CSP (`world: "MAIN"`), an toàn DOM/Trusted Types, loại bỏ header `Referer` và lọc Zalo CDN.
- **`tests/manual/test-page.html`**: Trang HTML thử tay đầy đủ 9 trường hợp media (ảnh thường, srcset 2x, background CSS, data base64, blob URL, kích thước nhỏ < 60px, video mp4, ảnh có lớp phủ trong suốt, ảnh nằm trong thẻ `<a>`).

---

## 5. Phiên bản Ứng dụng Mobile Android Native (.apk) — Chuẩn Google Chrome

Dự án cung cấp ứng dụng Android Native hoạt động **độc lập 100% trong máy điện thoại** (không cần máy chủ, không phụ thuộc bên ngoài), được thiết kế hoàn chỉnh theo phong cách **Google Chrome di động**:
- **Trình duyệt chuẩn Chrome:**
  - **Thanh Omnibox thông minh:** Bo tròn kiểu viên thuốc, hiển thị biểu tượng khoá bảo mật 🔒 và tên miền rút gọn, tự động nhận diện URL hoặc từ khóa tìm kiếm qua Google.
  - **Trang Thẻ Mới (New Tab Page):** Thiết kế Material You với logo Google nhiều màu, ô tìm kiếm lớn ở giữa và lưới phím tắt tròn mở nhanh các mạng xã hội (YouTube, Facebook, TikTok, Instagram, Threads, X, Phim, Google).
  - **Trình Quản Lý Đa Thẻ (Multi-Tab Switcher):** Nút đếm số thẻ `[ N ]`, hiển thị danh sách thẻ dạng lưới thu nhỏ, hỗ trợ mở thêm thẻ mới `+`, đóng từng thẻ `✕` hoặc đóng tất cả thẻ.
  - **Menu ba chấm ⋮ chuẩn Chrome:** Hỗ trợ mở Thẻ mới, Tải lại trang, bật/tắt **Trang web cho máy tính** (Desktop Site), mở **Tệp đã tải xuống**, và **Xoá dữ liệu duyệt web** (cache, cookie, storage) 1-click.
  - **Trình Quản Lý Tệp Đã Tải Xuống (Downloads BottomSheet):** Liệt kê chi tiết toàn bộ video, nhạc MP3, ảnh trong thư mục `Downloads/Download_Video/`, hỗ trợ mở phát trực tiếp qua VLC/Bộ sưu tập, chia sẻ sang Zalo/Drive/Messenger và xoá tệp an toàn.
- **Phát hiện media tự động & Tải độc lập:**
  - Nút nổi cảm ứng **⬇ Tải về** xuất hiện ngay trên video và nút **FAB nổi ở góc màn hình** sáng lên kèm số lượng media phát hiện trên thẻ hiện tại.
  - Nhúng Python 3 qua Chaquopy chạy trực tiếp `yt-dlp` trên chip điện thoại (ARM64-v8a / armeabi-v7a).
  - Tích hợp binary `ffmpeg` tĩnh để muxing video 2K/4K và trích xuất file âm thanh MP3 (320kbps).
  - Đồng bộ Cookie từ WebView để tải cả video riêng tư, Reels cá nhân đã đăng nhập.
  - Tự động lưu vào thư mục `Downloads/Download_Video/` và kích hoạt `MediaScannerConnection` để video/ảnh/nhạc xuất hiện ngay trong Thư viện ảnh / Google Photos / Trình phát nhạc của điện thoại.
- **Đóng gói file .apk:**
  - Chạy file `build-apk.bat` ngay tại thư mục gốc dự án hoặc vào `android-app/build-apk.bat`.
  - File `.apk` tạo ra tại `android-app/dist/DownloadVideoImage.apk` có thể cài đặt trực tiếp vào điện thoại Android.

---

## 6. Cấu trúc thư mục

```
Download_Video_Image/
├── GEMINI.md                  # Sổ tay dự án cho AI / DEV (bắt buộc đọc)
├── README.md                  # Tài liệu hướng dẫn sử dụng và cài đặt
├── HUONG_DAN_CAI_DAT.txt      # Hướng dẫn cài đặt nhanh dạng văn bản thuần
├── .gitignore                 # Loại trừ file nhị phân bin/ và manifest local
├── android-app/               # ỨNG DỤNG MOBILE ANDROID NATIVE (.APK)
│   ├── build.gradle.kts       # Cấu hình Gradle dự án
│   ├── settings.gradle.kts    # Quản lý module và kho Maven (Chaquopy)
│   ├── build-apk.bat          # Script 1-click đóng gói file .apk
│   ├── app/
│   │   ├── build.gradle.kts   # Cấu hình Chaquopy, yt-dlp pip, ABI filters
│   │   └── src/
│   │       ├── main/
│   │       │   ├── AndroidManifest.xml   # Quyền mạng, foreground service, FileProvider
│   │       │   ├── java/...              # MainActivity, BrowserActivity, DownloadService, DVIBridge
│   │       │   ├── python/downloader.py  # Module Python yt-dlp cục bộ
│   │       │   ├── assets/               # Kịch bản phát hiện media di động dvi_mobile_content.js
│   │       │   └── res/                  # Giao diện XML Dashboard, Browser, Bottom Sheet
│   │       └── test/...                  # Unit tests Kotlin kiểm tra cấu hình & storage
│   └── tools/
│       └── fetch-ffmpeg-android.ps1      # Tự động tải binary FFmpeg ARM64 cho Android
├── extension/                 # Thư mục Chrome Extension (Load unpacked)
│   ├── manifest.json          # Manifest V3 (ID extension cố định)
│   ├── background.js          # Service worker (tải trực tiếp & điều phối yt-dlp)
│   ├── content/
│   │   ├── media-utils.js     # Hàm thuần xử lý URL, srcset, permalink
│   │   ├── content.js         # Nút nổi Shadow DOM, hit-test, hiển thị tiến độ
│   │   └── page-probe.js      # Script MAIN world (MV3) quét luồng player an toàn CSP
│   └── icons/                 # Bộ icon 16, 32, 48, 128 px
├── native-host/               # Chương trình hỗ trợ Native Host trên Windows
│   ├── setup.bat              # Script cài đặt 1-click cho người dùng
│   ├── setup.ps1              # Tự động tải yt-dlp, ffmpeg, deno và đăng ký registry
│   ├── host.bat               # Cổng gọi từ Chrome tới host.ps1
│   ├── host.ps1               # Bộ xử lý lệnh từ Chrome, chạy yt-dlp
│   ├── HostUtils.psm1         # Module tiện ích PowerShell thuần
│   └── bin/                   # Chứa yt-dlp.exe, ffmpeg.exe, deno.exe (tự sinh, git-ignored)
├── docs/                      # Tài liệu thiết kế & kế hoạch triển khai
└── tests/                     # Toàn bộ test suite tự động và file test tay
```
