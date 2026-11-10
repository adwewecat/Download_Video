# Android Chrome-Style Browser Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuyển đổi ứng dụng Android thành một trình duyệt di động hoàn chỉnh chuẩn phong cách Google Chrome (Thanh Omnibox thông minh, trang New Tab chuẩn Material, quản lý đa Tab `[ 1 ]`, Menu `⋮` với Desktop site & Downloads), đồng thời giữ nguyên 100% khả năng tải media độc lập nội bộ.

**Architecture:** Kiến trúc Single-Activity (`MainActivity.kt`) quản lý đa thẻ duyệt (`WebTab` & `TabManager`). Mỗi tab sở hữu WebView riêng kèm `dvi_mobile_content.js` và `DVIBridge`. Tầng tải chạy ngầm qua `DownloadService` với Chaquopy Python, `yt-dlp` và binary FFmpeg tĩnh ARM64.

**Tech Stack:** Kotlin, AndroidX WebKit, Material Design 3, Coroutines, Chaquopy (Python 3.10 + yt-dlp), Android MediaStore, FileProvider.

**Spec:** `docs/superpowers/specs/2026-11-10-android-chrome-browser-redesign.md`

## Global Constraints
- Nền tảng: Android 8.0+ (Min SDK 26, Target SDK 34).
- Kiến trúc: 100% độc lập, không cần server backend.
- Đa Tab: Quản lý tối đa 10 tab mượt mà trong bộ nhớ, khởi động sạch sẽ từ Thẻ Mới (New Tab).
- Tránh spam tab: Mọi link `target="_blank"` hoặc popup được mở ngay trong tab hiện tại.
- Giữ vững quy tắc: Chú thích tiếng Việt rõ ràng, cập nhật `GEMINI.md`, kiểm thử tự động và commit/push GitHub ngay khi hoàn thành từng task.

## Review Focus
1. **Rò rỉ bộ nhớ WebView khi chuyển tab:** Đảm bảo khi đóng tab thì `webView.destroy()` được gọi và xoá khỏi View hierarchy để giải phóng RAM.
2. **Xung đột Omnibox khi người dùng nhập từ khóa thay vì URL:** Nếu người dùng gõ từ khóa tìm kiếm (như "clip hài"), phải tự động chuyển thành Google Search `https://www.google.com/search?q=...`.
3. **Đồng bộ hóa Cookie & MediaBridge trên từng Tab:** Khi người dùng chuyển tab, tab mới được kích hoạt phải tự động kết nối với `DVIBridge` và cập nhật nút tải FAB tương ứng.
4. **Desktop Mode Toggle:** Khi bật/tắt "Trang web cho máy tính", User-Agent phải chuyển đổi chính xác giữa Mobile Chrome và Desktop Chrome và reload lại trang.
5. **Downloads BottomSheet quét MediaStore:** File tải xong phải hiển thị đầy đủ tên, dung lượng MB và ngày giờ, chạm vào là mở phát được ngay qua `FileProvider`.

---

### Task 1: Xây dựng Mô hình Đa Thẻ & Bộ quản lý Tab (`TabManager.kt` & `WebTab.kt`)

**Files:**
- Create: `android-app/app/src/main/java/com/adwewecat/downloadvideo/browser/WebTab.kt`
- Create: `android-app/app/src/main/java/com/adwewecat/downloadvideo/browser/TabManager.kt`
- Test: `android-app/app/src/test/java/com/adwewecat/downloadvideo/TabManagerTest.kt`

**Interfaces:**
- Produces:
  - `WebTab(id, url, title, webView, isDesktopSite, isNewTabPage)`
  - `TabManager.createTab(context, url): WebTab`
  - `TabManager.closeTab(index): Boolean`
  - `TabManager.selectTab(index): WebTab?`
  - `TabManager.getActiveTab(): WebTab?`
  - `TabManager.tabCount: Int`

- [ ] **Step 1: Viết test cho `TabManagerTest.kt`**
  - Kiểm tra tạo tab mới, chọn tab, đóng tab và giới hạn số lượng tab.
- [ ] **Step 2: Chạy test để xác nhận test chạy và fail**
- [ ] **Step 3: Cài đặt `WebTab.kt` và `TabManager.kt`**
  - Quản lý danh sách `tabs: MutableList<WebTab>`.
  - Khởi tạo mặc định 1 tab New Tab (`chrome://newtab`).
- [ ] **Step 4: Chạy test kiểm tra logic**
- [ ] **Step 5: Commit code Task 1**

---

### Task 2: Giao diện Trang Thẻ Mới (New Tab Page) chuẩn Google Chrome

**Files:**
- Create: `android-app/app/src/main/res/layout/view_chrome_new_tab.xml`
- Create: `android-app/app/src/main/java/com/adwewecat/downloadvideo/browser/NewTabView.kt`
- Modify: `android-app/app/src/main/res/values/colors.xml`

**Interfaces:**
- Consumes: `Bookmark` list, click callbacks.
- Produces: `NewTabView` hiển thị logo Google, thanh tìm kiếm lớn ở giữa, lưới icon tròn chuẩn Chrome Material You.

- [ ] **Step 1: Tạo layout `view_chrome_new_tab.xml`**
  - Logo Google màu sắc hoặc Material typography ở giữa.
  - Hộp tìm kiếm lớn kiểu viên thuốc tròn (pill-shaped search box) có icon kính lúp.
  - Lưới RecyclerView hiển thị các icon tròn chuẩn Chrome: YouTube, Facebook, TikTok, Instagram, Threads, X, Phim/Stream, Google.
- [ ] **Step 2: Cài đặt lớp `NewTabView.kt`**
  - Kết nối sự kiện click ô tìm kiếm và click các phím tắt.
- [ ] **Step 3: Commit code Task 2**

---

### Task 3: Thanh Omnibox kiểu Chrome, Menu 3 Chấm & Hộp thoại Nhập Liệu

**Files:**
- Create: `android-app/app/src/main/res/layout/view_chrome_toolbar.xml`
- Create: `android-app/app/src/main/res/layout/dialog_omnibox_input.xml`
- Create: `android-app/app/src/main/res/menu/menu_chrome_overflow.xml`
- Create: `android-app/app/src/main/java/com/adwewecat/downloadvideo/browser/ChromeToolbar.kt`

**Interfaces:**
- Consumes: URL, title, tabCount, page progress.
- Produces: Thanh công cụ Chrome hoàn chỉnh với nút 🏠, Omnibox hiển thị tên miền, nút đếm tab `[ N ]`, menu `⋮` (New Tab, Reload, Desktop Site, Downloads, Clear Data).

- [ ] **Step 1: Thiết kế giao diện `view_chrome_toolbar.xml`**
  - Gồm nút Home 🏠, ô Omnibox bo tròn (hiển thị khóa 🔒 + domain), nút số tab `[ 1 ]`, nút Menu 3 chấm `⋮`.
  - Thanh tiến độ tải mỏng màu xanh mượt mà nằm ngay sát dưới thanh toolbar.
- [ ] **Step 2: Thiết kế menu `menu_chrome_overflow.xml`**
  - Thẻ mới, Tải lại, Trang web cho máy tính (checkbox), Tệp đã tải xuống, Xoá dữ liệu.
- [ ] **Step 3: Thiết kế hộp thoại nhập liệu toàn màn hình `dialog_omnibox_input.xml`**
  - Ô nhập link/từ khóa có nút `✕` xoá nhanh, bàn phím hiện nút Go.
- [ ] **Step 4: Cài đặt logic trong `ChromeToolbar.kt`**
- [ ] **Step 5: Commit code Task 3**

---

### Task 4: Trình chuyển đổi Thẻ (Tab Switcher Screen)

**Files:**
- Create: `android-app/app/src/main/res/layout/view_tab_switcher.xml`
- Create: `android-app/app/src/main/res/layout/item_tab_card.xml`
- Create: `android-app/app/src/main/java/com/adwewecat/downloadvideo/browser/TabSwitcherAdapter.kt`
- Create: `android-app/app/src/main/java/com/adwewecat/downloadvideo/browser/TabSwitcherView.kt`

**Interfaces:**
- Consumes: Danh sách `WebTab` từ `TabManager`.
- Produces: Màn hình lưới các thẻ tab đang mở, nút `+` mở thêm thẻ mới, nút `✕` đóng từng thẻ, đóng toàn bộ thẻ.

- [ ] **Step 1: Thiết kế giao diện thẻ tab `item_tab_card.xml`**
  - Header thẻ với icon trang web, tiêu đề, nút `✕`.
  - Khung nội dung preview thu nhỏ của tab.
- [ ] **Step 2: Thiết kế `view_tab_switcher.xml`**
  - Header với nút `+` (Thẻ mới), số lượng thẻ và nút đóng tất cả thẻ.
  - Lưới 2 cột hiển thị danh sách thẻ.
- [ ] **Step 3: Cài đặt `TabSwitcherAdapter.kt` và `TabSwitcherView.kt`**
- [ ] **Step 4: Commit code Task 4**

---

### Task 5: Trình Quản Lý Tệp Đã Tải Xuống (Downloads BottomSheet)

**Files:**
- Create: `android-app/app/src/main/res/layout/bottom_sheet_downloads.xml`
- Create: `android-app/app/src/main/res/layout/item_downloaded_file.xml`
- Create: `android-app/app/src/main/java/com/adwewecat/downloadvideo/ui/DownloadsBottomSheet.kt`
- Create: `android-app/app/src/main/java/com/adwewecat/downloadvideo/ui/DownloadedFilesAdapter.kt`
- Test: `android-app/app/src/test/java/com/adwewecat/downloadvideo/DownloadsScannerTest.kt`

**Interfaces:**
- Consumes: Thư mục `Downloads/Download_Video/`.
- Produces: Danh sách các file video (.mp4), nhạc (.mp3), ảnh (.jpg/.png) đã tải về, có nút phát/mở, chia sẻ và xoá file.

- [ ] **Step 1: Viết test cho `DownloadsScannerTest.kt`**
  - Kiểm tra lọc đúng đuôi file media, định dạng dung lượng file (MB/KB), sắp xếp theo ngày giờ mới nhất.
- [ ] **Step 2: Thiết kế layout `bottom_sheet_downloads.xml` và `item_downloaded_file.xml`**
- [ ] **Step 3: Cài đặt `DownloadsBottomSheet.kt` và `DownloadedFilesAdapter.kt`**
  - Tích hợp `FileProvider` để mở file video/nhạc bằng trình phát của máy hoặc VLC.
  - Tích hợp Intent `ACTION_SEND` để chia sẻ file sang Zalo, Drive, Messenger.
- [ ] **Step 4: Chạy test kiểm tra logic**
- [ ] **Step 5: Commit code Task 5**

---

### Task 6: Tích hợp Toàn diện `MainActivity.kt` thành Trình duyệt Chrome Hoàn chỉnh

**Files:**
- Modify: `android-app/app/src/main/res/layout/activity_main.xml`
- Modify: `android-app/app/src/main/java/com/adwewecat/downloadvideo/MainActivity.kt`
- Modify: `android-app/app/src/main/AndroidManifest.xml`

**Interfaces:**
- Tích hợp tất cả các thành phần:
  - `ChromeToolbar` (Omnibox + Tab Counter + Menu `⋮`).
  - `TabManager` điều khiển vùng chứa nội dung (Container hiển thị WebView hoặc `NewTabView`).
  - `TabSwitcherView` bật/tắt dạng overlay mượt mà.
  - `DownloadsBottomSheet` mở khi bấm menu "Tệp đã tải xuống".
  - Tích hợp nút FAB tải media và `DownloadBottomSheet` (3 chế độ tải).
  - Tích hợp Desktop Site Mode toggle trên WebView.
  - Xử lý nút Back của Android: lùi trang web `webView.canGoBack()`, nếu ở trang chủ hoặc chuyển tab thì đóng Tab Switcher hoặc hỏi thoát.

- [ ] **Step 1: Cập nhật `activity_main.xml`**
  - Thay thế giao diện cũ bằng cấu trúc: `ChromeToolbar` ở trên cùng, `FrameLayout` chứa WebView / New Tab ở giữa, `TabSwitcherView` (ẩn/hiện), và `fabDownload` ở góc dưới.
- [ ] **Step 2: Tái cấu trúc `MainActivity.kt`**
  - Điều phối chuyển đổi giữa các tab và đồng bộ `DVIBridge`.
  - Xử lý Desktop Site mode.
  - Xử lý Xoá Cache / Cookie 1-click.
- [ ] **Step 3: Cập nhật `AndroidManifest.xml` đặt `MainActivity` là trình duyệt chính duy nhất**
- [ ] **Step 4: Commit code Task 6**

---

### Task 7: Đóng gói APK, Kiểm thử Tự động & Cập nhật Tài liệu

**Files:**
- Test: `tests/*.test.js` (Node test suite)
- Execute: `build-apk.bat` (Gradle `assembleDebug`)
- Modify: `README.md`
- Modify: `HUONG_DAN_CAI_DAT.txt`
- Modify: `GEMINI.md`

**Interfaces:**
- Đóng gói file `android-app/dist/DownloadVideoImage.apk` mới nhất mang diện mạo Chrome Browser hoàn chỉnh.

- [ ] **Step 1: Chạy toàn bộ test suite (Node tests & Kotlin unit tests)**
- [ ] **Step 2: Thực thi build file APK bằng `build-apk.bat`**
  - Xác nhận build thành công và file APK mới xuất hiện tại `dist/DownloadVideoImage.apk`.
- [ ] **Step 3: Cập nhật tài liệu hướng dẫn (`README.md`, `HUONG_DAN_CAI_DAT.txt`, `GEMINI.md`)**
- [ ] **Step 4: Commit và git push lên GitHub main**

