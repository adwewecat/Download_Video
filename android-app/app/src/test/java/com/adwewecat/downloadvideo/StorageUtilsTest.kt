package com.adwewecat.downloadvideo

import org.junit.Test
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/**
 * Unit test kiểm tra logic làm sạch tên file và thêm timestamp cho bộ lưu trữ Android.
 */
class StorageUtilsTest {

    private fun sanitizeFileName(title: String, ext: String, timestamp: String): String {
        val cleanTitle = title.replace(Regex("[\\\\/:*?\"<>|]"), "_").trim()
        val safeTitle = if (cleanTitle.isBlank()) "media" else cleanTitle.take(60)
        return "${safeTitle}_${timestamp}.${ext.removePrefix(".")}"
    }

    @Test
    fun testSanitizeFileNameRemovesForbiddenChars() {
        val rawTitle = "Video: Hay Nhất / 2026 * <Top> | ?"
        val timestamp = "20261110183000123"
        val fileName = sanitizeFileName(rawTitle, "mp4", timestamp)

        assertFalse(fileName.contains(":"), "Không được chứa dấu :")
        assertFalse(fileName.contains("/"), "Không được chứa dấu /")
        assertFalse(fileName.contains("*"), "Không được chứa dấu *")
        assertFalse(fileName.contains("<"), "Không được chứa dấu <")
        assertFalse(fileName.contains(">"), "Không được chứa dấu >")
        assertFalse(fileName.contains("|"), "Không được chứa dấu |")
        assertTrue(fileName.endsWith("_20261110183000123.mp4"), "Phải có hậu tố timestamp và đuôi file .mp4")
    }

    @Test
    fun testTimestampFormat() {
        val format = SimpleDateFormat("yyyyMMddHHmmssSSS", Locale.US)
        val ts = format.format(Date())
        assertEquals(17, ts.length, "Timestamp format yyyyMMddHHmmssSSS phải có đúng 17 ký tự (mili-giây)")
    }
}
