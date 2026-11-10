package com.adwewecat.downloadvideo.utils

import android.content.Context
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Environment
import android.util.Log
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Tiện ích quản lý lưu trữ, tạo file an toàn và đồng bộ vào Android MediaStore (Gallery/Bộ sưu tập).
 */
object StorageUtils {

    private const val TAG = "StorageUtils"
    private const val SUB_DIR = "Download_Video"

    /**
     * Lấy thư mục tải về trên bộ nhớ máy: /storage/emulated/0/Download/Download_Video
     */
    fun getDownloadDirectory(): File {
        val publicDownloads = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
        val targetDir = File(publicDownloads, SUB_DIR)
        if (!targetDir.exists()) {
            targetDir.mkdirs()
        }
        return targetDir
    }

    /**
     * Sinh chuỗi timestamp theo định dạng yyyyMMddHHmmssSSS (17 ký tự).
     */
    fun generateTimestamp(): String {
        val sdf = SimpleDateFormat("yyyyMMddHHmmssSSS", Locale.US)
        return sdf.format(Date())
    }

    /**
     * Làm sạch tiêu đề và ghép timestamp chống trùng lặp file.
     */
    fun sanitizeFileName(title: String, ext: String): String {
        val clean = title.replace(Regex("[\\\\/:*?\"<>|]"), "_").trim()
        val safeTitle = if (clean.isBlank()) "video" else clean.take(60)
        val timestamp = generateTimestamp()
        val safeExt = ext.removePrefix(".").ifBlank { "mp4" }
        return "${safeTitle}_${timestamp}.${safeExt}"
    }

    /**
     * Kích hoạt quét file vào Android MediaStore để video/ảnh/nhạc xuất hiện ngay trong Gallery/Google Photos/Music.
     */
    fun scanMediaFile(context: Context, filePath: String, onScanned: ((Uri?) -> Unit)? = null) {
        try {
            MediaScannerConnection.scanFile(
                context.applicationContext,
                arrayOf(filePath),
                null
            ) { path, uri ->
                Log.i(TAG, "Đã index vào MediaStore: path=$path | uri=$uri")
                onScanned?.invoke(uri)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Lỗi khi quét MediaStore: ${e.message}", e)
            onScanned?.invoke(null)
        }
    }
}
