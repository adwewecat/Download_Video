package com.adwewecat.downloadvideo.utils

import android.content.Context
import android.util.Log
import java.io.File
import java.io.FileOutputStream

/**
 * Tiện ích trích xuất và cấp quyền thực thi cho binary FFmpeg tĩnh trên Android.
 * FFmpeg được dùng để mux video + audio (độ phân giải 2K/4K) và trích xuất file âm thanh MP3.
 */
object FFmpegInstaller {

    private const val TAG = "FFmpegInstaller"
    private const val BIN_DIR_NAME = "bin"
    private const val FFMPEG_FILE_NAME = "ffmpeg"
    private const val ASSET_PATH = "bin/ffmpeg"

    /**
     * Lấy đường dẫn thực thi của FFmpeg trên máy.
     * Tự động giải nén từ assets vào thư mục nội bộ và cấp quyền chmod 755 nếu chưa có.
     *
     * @param context Context ứng dụng
     * @return Đường dẫn file binary ffmpeg hoặc null nếu chưa tích hợp
     */
    fun getExecutablePath(context: Context): String? {
        val binDir = File(context.filesDir, BIN_DIR_NAME)
        if (!binDir.exists()) {
            binDir.mkdirs()
        }

        val ffmpegFile = File(binDir, FFMPEG_FILE_NAME)

        // Nếu binary đã tồn tại và có quyền chạy
        if (ffmpegFile.exists() && ffmpegFile.canExecute() && ffmpegFile.length() > 0) {
            return ffmpegFile.absolutePath
        }

        // Thử sao chép từ assets của APK
        return try {
            val assetList = context.assets.list(BIN_DIR_NAME) ?: emptyArray()
            if (!assetList.contains(FFMPEG_FILE_NAME)) {
                Log.w(TAG, "Không tìm thấy asset $ASSET_PATH trong APK")
                return null
            }

            Log.i(TAG, "Đang trích xuất binary FFmpeg từ assets sang ${ffmpegFile.absolutePath}...")
            context.assets.open(ASSET_PATH).use { input ->
                FileOutputStream(ffmpegFile).use { output ->
                    input.copyTo(output)
                }
            }

            // Cấp quyền thực thi cho binary
            ensureExecutable(ffmpegFile)

            Log.i(TAG, "Trích xuất và cấp quyền thực thi FFmpeg thành công (${ffmpegFile.length()} bytes)")
            ffmpegFile.absolutePath
        } catch (e: Exception) {
            Log.e(TAG, "Không thể trích xuất FFmpeg: ${e.message}", e)
            null
        }
    }

    /**
     * Cấp quyền thực thi (rwxr-xr-x / 755) cho file binary trên Linux/Android.
     */
    fun ensureExecutable(file: File): Boolean {
        // Cấp quyền bằng Java File API
        val setJava = file.setExecutable(true, false)

        // Bổ sung cấp quyền qua lệnh hệ thống chmod 755
        return try {
            val process = Runtime.getRuntime().exec(arrayOf("chmod", "755", file.absolutePath))
            process.waitFor() == 0
        } catch (e: Exception) {
            Log.w(TAG, "Lỗi khi gọi chmod 755 qua Runtime: ${e.message}")
            setJava
        }
    }
}

