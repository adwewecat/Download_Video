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

- [ ] Chủ dự án chọn chất lượng video mặc định (mục 5.4.1 trong bản thiết kế) rồi duyệt bản thiết kế.
- [ ] Lập kế hoạch triển khai tại `docs/superpowers/plans/`.
- [ ] Code extension (Manifest V3) + native host (`native-host/`) theo kế hoạch.

---

## 5. Nhật ký công việc (mới nhất ở trên)

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

