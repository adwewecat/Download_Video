# Android Chrome-Style Browser & Media Downloader Redesign

- **Date:** 2026-11-10
- **Platform:** Android Native (Kotlin, Chaquopy Python, Android System WebView)
- **Status:** Draft (Awaiting Builder Check & User Approval)

---

## 1. Context & Motivation

Phiên bản Android v2.0.0 ban đầu được thiết kế theo cấu trúc tách rời:
- Màn hình chính Dashboard (`MainActivity`) có thanh tìm kiếm và danh sách biểu tượng cố định.
- Khi người dùng bấm vào một biểu tượng, ứng dụng mở một Activity riêng (`BrowserActivity`) chứa một WebView duy nhất.

Người dùng đã phản hồi:
> *"Bạn làm ứng dụng giống như Chrome được không, vì về cơ bản app này tôi thấy đang theo dạng trình duyệt."*

Thay vì trải nghiệm Dashboard rời rạc, người dùng muốn một **trình duyệt di động hoàn chỉnh chuẩn Google Chrome** (Thanh Omnibox thông minh, trang New Tab chuẩn Material, quản lý đa Tab `[ 1 ]`, Menu 3 chấm `⋮`, chế độ Desktop Site, trình quản lý file tải về Downloads), đồng thời giữ nguyên **100% sức mạnh tải media độc lập nội bộ** (Chaquopy + yt-dlp + FFmpeg ARM64, không cần server).

---

## 2. Goals & Non-Goals

### Goals
1. **Trải nghiệm duyệt web chuẩn Google Chrome trên di động:**
   - **Thanh Omnibox thông minh:** Nằm ở đỉnh trang, hiển thị tên miền + icon bảo mật SSL. Chạm vào mở thanh nhập tìm kiếm Google hoặc dán URL mới ngay trên tab hiện tại.
   - **Trang New Tab (Thẻ Mới):** Logo Google + thanh tìm kiếm lớn ở giữa + lưới biểu tượng tròn chuẩn Material You (YouTube, Facebook, TikTok, Instagram, Threads, X, Phim,...).
   - **Quản lý đa Tab (Multi-Tab Switcher):** Nút đếm số tab `[ 1 ]`, bấm vào hiển thị danh sách các tab đang mở dưới dạng thẻ, bấm `+` mở tab mới, bấm `✕` hoặc vuốt để đóng tab.
   - **Menu 3 chấm (⋮) kiểu Chrome:**
     - Thẻ mới (New Tab).
     - Tải lại trang (Reload).
     - Trang web cho máy tính (Desktop Site toggle).
     - Tệp đã tải xuống (Downloads - xem lại và phát video/nhạc đã tải).
     - Cài đặt (Settings / Clear Data).
2. **Tích hợp tính năng tải Media độc lập:**
   - Mỗi tab tự động chạy `dvi_mobile_content.js` và `DVIBridge`.
   - Nút cảm ứng nhỏ gọn trên video + nút nổi FAB ở góc dưới màn hình sáng lên khi phát hiện video/stream.
   - Bottom Sheet 3 chế độ: ⬇ Tương thích, 🚀 MAX 2K/4K, 🎵 MP3 (320kbps).
   - Foreground Service tải ngầm, lưu vào `Downloads/Download_Video/` và quét MediaStore vào Gallery.

### Non-Goals
- Đồng bộ hóa tài khoản Google Sync / Chrome profile đám mây (không cần thiết và đòi hỏi API độc quyền của Google).
- Hỗ trợ cài Extension bên thứ ba từ Chrome Web Store (yêu cầu Chromium fork nặng hơn 150MB, trong khi WebView chuẩn Android chỉ 31MB và đã tích hợp sẵn tính năng tải).

---

## 3. Approaches Considered

### Approach 1 (Selected): Chrome-Style Single-Activity Multi-Tab Browser
- **Cấu trúc:** Một Activity chính (`ChromeBrowserActivity`) làm container, quản lý danh sách `WebTab`.
- **Ưu điểm:**
  - Trải nghiệm mượt mà, chuyển đổi giữa trang New Tab, trang web và Tab Switcher diễn ra tức thì không bị chớp màn hình.
  - Mỗi Tab sở hữu một WebView độc lập, giữ nguyên trạng thái phiên duyệt (video đang tạm dừng, nội dung đã cuộn).
  - Tích hợp trình quản lý tệp đã tải (Downloads) dạng Modal Bottom Sheet trực quan.
- **Nhược điểm:** Cần quản lý vòng đời WebView cẩn thận để không rò rỉ RAM khi mở quá nhiều tab (giới hạn tối đa 20 tab).

### Approach 2 (Rejected): Chrome Mini (Single-Tab)
- Giao diện giả lập Chrome nhưng chỉ cho phép 1 tab duy nhất.
- **Lý do từ chối:** Người dùng đã chọn phương án 1 để có trải nghiệm duyệt web đầy đủ như Google Chrome.

---

## 4. Detailed Architectural Design

```
+-------------------------------------------------------------+
| [🏠]   🔒 m.youtube.com                     [ 2 ]   [ ⋮ ]  | <- Chrome Toolbar (Omnibox)
| ----------------------------------------------------------- |
| [=================== Progress Bar (mỏng) =================] |
+-------------------------------------------------------------+
|                                                             |
|                                                             |
|                Active Tab WebView                           |
|        (Chạy dvi_mobile_content.js & DVIBridge)             |
|                                                             |
|                                         +-----------------+ |
|                                         | ⬇ Tải (1) [FAB] | |
|                                         +-----------------+ |
+-------------------------------------------------------------+
```

### 4.1. Cấu trúc Tab & Trình quản lý Đa Thẻ (`TabManager.kt`)
- `WebTab`:
  - `id: String` (UUID)
  - `url: String`
  - `title: String`
  - `webView: WebView`
  - `isDesktopSite: Boolean`
  - `isNewTabPage: Boolean`
- `TabManager`:
  - `tabs: MutableList<WebTab>`
  - `activeTabIndex: Int`
  - `createNewTab(url: String = "chrome://newtab"): WebTab`
  - `closeTab(index: Int)`
  - `switchTab(index: Int)`
  - `getActiveTab(): WebTab?`

### 4.2. Giao diện Chrome Toolbar & Omnibox
- Khi tab là `chrome://newtab`: Toolbar ẩn nút 🏠, Omnibox hiển thị chữ *"Tìm kiếm hoặc nhập địa chỉ web"*.
- Khi đang duyệt web: Omnibox hiển thị tên miền ngắn gọn (ví dụ: `youtube.com`).
- Khi người dùng chạm vào Omnibox:
  - Mở giao diện nhập liệu toàn màn hình (`OmniboxOverlay`).
  - Tự động bôi đen toàn bộ URL hiện tại để tiện copy/xoá.
  - Nút `✕` để xoá nhanh nội dung đang gõ.
  - Bàn phím hiện nút `Go / Tìm`. Nếu người dùng gõ từ khóa (không phải link web có chứa dấu chấm), tự động tìm kiếm qua Google: `https://www.google.com/search?q=...`.

### 4.3. Giao diện Trình chuyển đổi Thẻ (Tab Switcher)
- Khi bấm nút `[ N ]`:
  - Màn hình chuyển sang chế độ Grid RecyclerView hiển thị các thẻ tab thu nhỏ.
  - Mỗi thẻ hiển thị: Icon trang web, Tiêu đề trang, Nút `✕` để đóng thẻ.
  - Nút `+` nổi hoặc trên thanh công cụ để mở thêm Thẻ mới.
  - Bấm vào một thẻ sẽ kích hoạt thẻ đó và đóng Tab Switcher.

### 4.4. Menu 3 chấm (⋮) kiểu Chrome
- Khi chạm nút `⋮`, hiển thị `PopupMenu` hoặc Material Dialog gồm:
  1. **Thẻ mới (New Tab)**: Mở thêm 1 tab mới vào trang chủ.
  2. **Tải lại (Reload)**: Tải lại trang web hiện tại.
  3. **Trang web cho máy tính (Desktop Site)**: Checkbox chuyển User-Agent sang Desktop Chrome và bật WideViewPort.
  4. **Tệp đã tải xuống (Downloads)**: Mở danh sách video và nhạc đã tải về máy.
  5. **Cài đặt / Xoá dữ liệu duyệt web**: Xoá cache, cookie nếu cần.

### 4.5. Quản lý Tệp Đã Tải Xuống (`DownloadsBottomSheet.kt`)
- Quét thư mục `Environment.DIRECTORY_DOWNLOADS + "/Download_Video/"`.
- Hiển thị danh sách file theo thời gian mới nhất:
  - Tên file, kích thước (MB), ngày giờ tải.
  - Icon phân loại: Video 🎬, Âm thanh MP3 🎵, Hình ảnh 🖼️.
  - Bấm vào: Mở file bằng ứng dụng mặc định của hệ thống (VLC, Trình xem video, Google Photos).
  - Nút chia sẻ (Zalo, Drive, Messenger,...) hoặc nút xoá file.

### 4.6. Tích hợp Tải Media
- Kế thừa 100% logic tải đã kiểm chứng:
  - `dvi_mobile_content.js` quét video, audio, m3u8 stream.
  - Giao tiếp qua `DVIBridge`.
  - Nút nổi trên video + Nút FAB ở góc dưới màn hình.
  - `DownloadBottomSheet`: 3 tuỳ chọn (⬇ Tương thích, MAX 2K/4K, MP3).
  - `DownloadService` chạy ngầm qua Chaquopy nhúng Python + `yt-dlp` + static FFmpeg.

### 4.7. Quyết định Kỹ thuật Chi tiết (Builder Review Decisions)
1. **Quản lý phiên Tab (Session Persistence):**
   - Giữ danh sách tab trong bộ nhớ (In-Memory) trong suốt phiên dùng, hỗ trợ tối đa 10 tab hoạt động mượt mà. Khi mở lại app lần đầu, luôn xuất phát từ Thẻ mới (New Tab) sạch sẽ.
2. **Quản lý Tệp tải xuống (Downloads):**
   - Màn hình Downloads tập trung vào duyệt, phát và chia sẻ các file đã tải hoàn tất trong `Downloads/Download_Video/`. Tiến độ tải trực tiếp theo % được hiển thị thời gian thực trên thanh thông báo hệ thống (Notification shade) qua `DownloadService`.
3. **Chặn Popup quảng cáo (`target="_blank"`, `window.open`):**
   - Điều hướng link mới ngay trong tab hiện tại thay vì tự động mở tab mới tràn lan, ngăn chặn hiệu quả các trang phim/web chứa quảng cáo tự ý nhảy popup làm chậm máy.
4. **Xoá dữ liệu duyệt web:**
   - Triển khai hộp thoại xác nhận nhanh 1-click cho phép người dùng xoá sạch Cache và Cookie khi cần làm mới hoàn toàn.

---

## 5. Constraints & Compliance
- Tuân thủ quy tắc bất di bất dịch trong `GEMINI.md`: Chú thích tiếng Việt đầy đủ, cập nhật nhật ký trước khi làm, kiểm thử sạch sẽ, commit và push GitHub ngay khi hoàn thành.
- Dung lượng APK nhẹ (~31-33 MB), chạy độc lập 100% trên thiết bị Android 8.0 trở lên (API 26 - 34).
