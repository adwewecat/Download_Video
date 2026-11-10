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

- **Giai đoạn:** **v1.0.0 Hoàn Thành & Sẵn Sàng Sử Dụng**.
- **Đã có:**
  - Tiện ích Chrome Extension Manifest V3 (`extension/`) với Shadow DOM không vỡ layout, phát hiện đa tầng media, hỗ trợ tải trực tiếp và tải nền tảng.
  - Native Messaging Host (`native-host/`) bằng PowerShell thuần, tự động hoá hoàn toàn qua `setup.bat` (tải yt-dlp, ffmpeg, Deno, sinh manifest, đăng ký Registry HKCU).
  - Hỗ trợ 2 nút tải video: **⬇** (tương thích cao H.264+AAC) và **MAX** (2K/4K AV1/VP9).
  - Tự động gợi ý và cung cấp nút mở trang tải VLC khi hoàn tất video 2K/4K chuẩn mới.
  - Test suite tự động 26/26 tests PASS (`node --test "tests/*.test.js"`).
  - Trang thử tay `tests/manual/test-page.html` đầy đủ 9 tình huống media.

---

## 4. Việc tiếp theo

- [x] Hoàn thành và bàn giao v1.0.0.
- [x] Bổ sung tuỳ chọn tải riêng âm thanh MP3 (v1.2.0).
- [ ] *(Ý tưởng v2)*: Hỗ trợ tải nguyên danh sách phát (Playlist / Kênh) nếu người dùng có nhu cầu.

---

## 5. Nhật ký công việc (mới nhất ở trên)

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

