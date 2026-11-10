package com.adwewecat.downloadvideo.downloader

import android.content.Context
import android.util.Log
import com.chaquo.python.PyObject
import com.chaquo.python.Python
import com.chaquo.python.android.AndroidPlatform
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Trình điều phối tải video qua Chaquopy nhúng Python và yt-dlp.
 * Chạy 100% cục bộ trên thiết bị Android.
 */
object YtDlpDownloader {

    private const val TAG = "YtDlpDownloader"

    /**
     * Khởi tạo Python runtime nếu chưa bắt đầu.
     */
    fun ensurePythonStarted(context: Context) {
        if (!Python.isStarted()) {
            Python.start(AndroidPlatform(context.applicationContext))
            Log.i(TAG, "Đã khởi động Chaquopy Python runtime thành công")
        }
    }

    /**
     * Tải media bất đồng bộ trên luồng IO.
     *
     * @param context Context ứng dụng
     * @param url Link video hoặc bài viết (Instagram, TikTok, YouTube, FB,...)
     * @param quality 'compatible' (MP4 H.264), 'best' (2K/4K), hoặc 'mp3' (âm thanh 320kbps)
     * @param referer HTTP Referer nếu có
     * @param cookies Chuỗi cookie WebView
     * @param outDir Thư mục lưu file trên bộ nhớ máy
     * @param ffmpegPath Đường dẫn binary ffmpeg tĩnh
     * @param onProgress Callback nhận tiến độ phần trăm (0 - 100)
     * @param onSuccess Callback khi tải thành công kèm đường dẫn file
     * @param onError Callback khi gặp lỗi
     */
    suspend fun download(
        context: Context,
        url: String,
        quality: String = "compatible",
        referer: String? = null,
        cookies: String? = null,
        outDir: String,
        ffmpegPath: String? = null,
        onProgress: (Int) -> Unit = {},
        onSuccess: (String) -> Unit = {},
        onError: (String) -> Unit = {}
    ) = withContext(Dispatchers.IO) {
        try {
            ensurePythonStarted(context)
            val py = Python.getInstance()
            val downloaderMod = py.getModule("downloader")

            // Tạo callback Python nhận tiến độ
            val callback = object : Any() {
                @Suppress("unused")
                fun invoke(percent: Int, status: String, filename: String?) {
                    if (status == "downloading") {
                        onProgress(percent)
                    } else if (status == "finished" && !filename.isNullOrEmpty()) {
                        Log.i(TAG, "Tải hoàn tất: $filename")
                    }
                }
            }

            Log.i(TAG, "Bắt đầu tải qua yt-dlp: $url | Quality: $quality | OutDir: $outDir")

            val resultPath = downloaderMod.callAttr(
                "download_media",
                url,
                quality,
                referer,
                cookies,
                outDir,
                ffmpegPath,
                callback
            )?.toString()

            if (!resultPath.isNullOrEmpty()) {
                onProgress(100)
                onSuccess(resultPath)
            } else {
                // Nếu yt-dlp hoàn thành nhưng không bắt được đường dẫn cuối cùng qua hook
                onSuccess(outDir)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Lỗi trong quá trình thực thi yt-dlp: ${e.message}", e)
            onError(e.message ?: "Lỗi không xác định khi tải video")
        }
    }
}

