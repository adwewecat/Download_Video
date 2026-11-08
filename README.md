# Download Video & Image (Chrome Extension)

Chrome Extension giúp bạn tải **mọi hình ảnh và video** trên bất kỳ trang web nào bằng một cú bấm chuột:
- **Hình ảnh:** Tự động phát hiện thẻ `<img>`, chọn ảnh có độ phân giải cao nhất từ `srcset`, trích xuất ảnh nền CSS (`background-image`), ảnh `data:` base64 và ảnh `blob:`.
- **Video file thường:** Tải trực tiếp qua trình duyệt với định dạng `.mp4`, `.webm`.
- **Video nền tảng / video stream:** Tự động nhận diện và hỗ trợ đầy đủ các nền tảng lớn như **YouTube, Facebook, TikTok, Instagram, X (Twitter), Threads**, cũng như các trang stream HLS/DASH.
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
3. Một thanh công cụ nổi nhỏ gọn sẽ xuất hiện ở góc trên bên phải của media:
   - Với **hình ảnh**: Bấm nút **⬇** để tải về (tự động chọn bản nét nhất).
   - Với **video mạng xã hội / stream**:
     - Bấm nút **⬇**: Tải video chuẩn tương thích (H.264 + AAC, tối đa 1080p).
     - Bấm nút **MAX**: Tải video chất lượng cực đại (2K / 4K nếu nền tảng hỗ trợ).
4. Tiến độ tải sẽ hiển thị trực quan (theo %) ngay trên nút nổi và trên badge của icon extension.
5. Khi tải xong:
   - File được lưu thẳng vào thư mục **Downloads** của Windows.
   - Chrome hiển thị thông báo "Tải xong". Nếu là video 2K/4K sử dụng chuẩn AV1/VP9, thông báo sẽ gợi ý kèm nút bấm để tải trình phát **VLC** (miễn phí, mở được mọi định dạng).

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
- **`tests/manual/test-page.html`**: Trang HTML thử tay đầy đủ 9 trường hợp media (ảnh thường, srcset 2x, background CSS, data base64, blob URL, kích thước nhỏ < 60px, video mp4, ảnh có lớp phủ trong suốt, ảnh nằm trong thẻ `<a>`).

---

## 5. Cấu trúc thư mục

```
Download_Video_Image/
├── GEMINI.md                  # Sổ tay dự án cho AI / DEV (bắt buộc đọc)
├── README.md                  # Tài liệu hướng dẫn sử dụng và cài đặt
├── .gitignore                 # Loại trừ file nhị phân bin/ và manifest local
├── extension/                 # Thư mục Chrome Extension (Load unpacked)
│   ├── manifest.json          # Manifest V3 (ID extension cố định)
│   ├── background.js          # Service worker (tải trực tiếp & điều phối yt-dlp)
│   ├── content/
│   │   ├── media-utils.js     # Hàm thuần xử lý URL, srcset, permalink
│   │   └── content.js         # Nút nổi Shadow DOM, hit-test, hiển thị tiến độ
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
