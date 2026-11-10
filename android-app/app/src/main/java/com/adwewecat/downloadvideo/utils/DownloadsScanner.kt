package com.adwewecat.downloadvideo.utils

import java.io.File
import java.util.Locale

/**
 * Biểu diễn thông tin một tệp media đã tải xuống trên điện thoại.
 */
data class DownloadedFile(
    val file: File,
    val name: String,
    val sizeText: String,
    val lastModified: Long,
    val isVideo: Boolean,
    val isAudio: Boolean,
    val isImage: Boolean
) {
    val emoji: String
        get() = when {
            isVideo -> "🎬"
            isAudio -> "🎵"
            isImage -> "🖼️"
            else -> "📁"
        }
}

/**
 * Bộ quét và định dạng danh sách tệp tải về trong thư mục Downloads/Download_Video.
 */
object DownloadsScanner {

    private val VIDEO_EXTENSIONS = setOf("mp4", "mkv", "webm", "mov", "avi", "3gp")
    private val AUDIO_EXTENSIONS = setOf("mp3", "m4a", "aac", "wav", "flac", "ogg")
    private val IMAGE_EXTENSIONS = setOf("jpg", "jpeg", "png", "webp", "gif")

    /**
     * Kiểm tra xem tệp có phải là định dạng media được hỗ trợ hay không.
     */
    fun isMediaFile(fileName: String): Boolean {
        val ext = fileName.substringAfterLast('.', "").lowercase(Locale.ROOT)
        if (ext.isEmpty()) return false
        return ext in VIDEO_EXTENSIONS || ext in AUDIO_EXTENSIONS || ext in IMAGE_EXTENSIONS
    }

    /**
     * Định dạng kích thước tệp từ bytes sang B / KB / MB.
     */
    fun formatSize(bytes: Long): String {
        if (bytes <= 0) return "0 B"
        if (bytes < 1024) return "$bytes B"
        val kb = bytes / 1024.0
        if (kb < 1024) {
            return String.format(Locale.US, "%.1f KB", kb)
        }
        val mb = kb / 1024.0
        return String.format(Locale.US, "%.2f MB", mb)
    }

    /**
     * Quét thư mục tải về và trả về danh sách tệp media đã sắp xếp theo thứ tự mới nhất.
     */
    fun scan(directory: File): List<DownloadedFile> {
        if (!directory.exists() || !directory.isDirectory) {
            return emptyList()
        }

        val files = directory.listFiles() ?: return emptyList()

        return files
            .filter { it.isFile && isMediaFile(it.name) }
            .sortedByDescending { it.lastModified() }
            .map { file ->
                val ext = file.extension.lowercase(Locale.ROOT)
                DownloadedFile(
                    file = file,
                    name = file.name,
                    sizeText = formatSize(file.length()),
                    lastModified = file.lastModified(),
                    isVideo = ext in VIDEO_EXTENSIONS,
                    isAudio = ext in AUDIO_EXTENSIONS,
                    isImage = ext in IMAGE_EXTENSIONS
                )
            }
    }
}

