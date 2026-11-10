# -*- coding: utf-8 -*-
"""
Module trích xuất luồng và tải video độc lập trên Android qua yt-dlp (Chaquopy).
Chạy trực tiếp 100% trong máy điện thoại, không phụ thuộc vào bất kỳ máy chủ bên ngoài nào.
"""

import os
import sys
import time

def build_ydl_opts(out_dir, quality='compatible', referer=None, cookies=None, ffmpeg_path=None, progress_callback=None):
    """
    Xây dựng từ điển cấu hình ydl_opts cho yt-dlp.
    
    :param out_dir: Thư mục lưu file trên Android (ví dụ: /storage/emulated/0/Download/Download_Video)
    :param quality: 'compatible' (MP4 H.264/AAC), 'best' (2K/4K MAX), hoặc 'mp3' (âm thanh 320kbps)
    :param referer: HTTP Referer header nếu trang web yêu cầu
    :param cookies: Chuỗi cookie thô hoặc đường dẫn file cookie Netscape
    :param ffmpeg_path: Đường dẫn tới binary ffmpeg tĩnh (ARM64) trên điện thoại
    :param progress_callback: Hàm callback Python/Kotlin nhận tiến độ (percent, status, filepath)
    """
    # Đặt template tên file có timestamp (epoch mili-giây) để chống trùng lặp 100%
    timestamp = str(int(time.time() * 1000))
    out_template = os.path.join(out_dir, f'%(title).80s_{timestamp}.%(ext)s')

    opts = {
        'outtmpl': out_template,
        'quiet': True,
        'no_warnings': True,
        'noplaylist': True,
        'windowsfilenames': True,
        'nocheckcertificate': True,
    }

    # Cấu hình đường dẫn binary FFmpeg tĩnh nếu có
    if ffmpeg_path and os.path.exists(ffmpeg_path):
        opts['ffmpeg_location'] = ffmpeg_path

    # Cấu hình định dạng chất lượng tải
    if quality == 'mp3':
        opts['format'] = 'bestaudio/best'
        opts['postprocessors'] = [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '320',
        }]
    elif quality == 'best':
        # Tải chất lượng cao nhất (2K/4K/8K nếu có)
        opts['format'] = 'bv*+ba/b'
        opts['merge_output_format'] = 'mp4'
    else:
        # Mặc định: MP4 tương thích cao nhất (H.264 + AAC 1080p)
        opts['format'] = 'bestvideo[vcodec^=avc1][height<=1080]+bestaudio[acodec^=mp4a]/best[ext=mp4]/best'
        opts['merge_output_format'] = 'mp4'

    # Thiết lập HTTP headers (User-Agent chuẩn di động & Referer)
    http_headers = {
        'User-Agent': (
            'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 '
            '(KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36'
        )
    }
    if referer:
        http_headers['Referer'] = referer
    if cookies:
        if isinstance(cookies, str) and os.path.exists(cookies):
            opts['cookiefile'] = cookies
        else:
            http_headers['Cookie'] = str(cookies)
    opts['http_headers'] = http_headers

    # Cấu hình hook theo dõi tiến độ tải
    if progress_callback:
        def ytdlp_hook(d):
            status = d.get('status')
            if status == 'downloading':
                total = d.get('total_bytes') or d.get('total_bytes_estimate') or 0
                downloaded = d.get('downloaded_bytes') or 0
                percent = int((downloaded / total) * 100) if total > 0 else 0
                progress_callback(percent, 'downloading', None)
            elif status == 'finished':
                filename = d.get('filename')
                progress_callback(100, 'finished', filename)
        opts['progress_hooks'] = [ytdlp_hook]

    return opts


def download_media(url, quality='compatible', referer=None, cookies=None, out_dir='/tmp', ffmpeg_path=None, callback=None):
    """
    Thực thi tải video/audio bằng yt-dlp.
    Trả về đường dẫn file sau khi tải hoàn tất.
    """
    try:
        import yt_dlp
    except ImportError:
        # Dự phòng khi test môi trường chưa cài yt-dlp
        raise RuntimeError("yt-dlp chưa được cài đặt trong môi trường Python")

    last_file = {'path': None}

    def internal_hook(percent, status, filename):
        if filename:
            last_file['path'] = filename
        if callback:
            try:
                callback(percent, status, filename)
            except Exception as e:
                print(f"[downloader.py] Lỗi callback: {e}", file=sys.stderr)

    opts = build_ydl_opts(
        out_dir=out_dir,
        quality=quality,
        referer=referer,
        cookies=cookies,
        ffmpeg_path=ffmpeg_path,
        progress_callback=internal_hook
    )

    with yt_dlp.YoutubeDL(opts) as ydl:
        ydl.download([url])

    return last_file['path']
