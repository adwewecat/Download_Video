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

- **Giai đoạn:** Thiết kế (chưa có code extension). Đã chốt hướng C.
- Đã có: `README.md`, `GEMINI.md`, bản thiết kế `docs/superpowers/specs/2026-11-08-download-media-extension-design.md`,
  `tests/media-utils.test.js` (test viết trước, chưa có code để chạy qua).

---

## 4. Việc tiếp theo

- [ ] Chủ dự án chọn cách triển khai kế hoạch (Subagent-driven hay Native).
- [ ] Code theo kế hoạch `docs/superpowers/plans/2026-11-08-download-media-extension.md`.
- [ ] Hoàn thành và bàn giao v1.0.0.

---

## 5. Nhật ký công việc (mới nhất ở trên)

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

