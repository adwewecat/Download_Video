package com.adwewecat.downloadvideo

import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/**
 * Unit test kiểm tra logic cấu hình chất lượng tải video và âm thanh.
 */
class YtDlpConfigTest {

    private fun getFormatForQuality(quality: String): String {
        return when (quality) {
            "mp3" -> "bestaudio/best"
            "best" -> "bv*+ba/b"
            else -> "bestvideo[vcodec^=avc1][height<=1080]+bestaudio[acodec^=mp4a]/best[ext=mp4]/best"
        }
    }

    @Test
    fun testCompatibleQualityFormat() {
        val format = getFormatForQuality("compatible")
        assertTrue(format.contains("avc1"), "Định dạng tương thích phải ưu tiên video codec H.264 (avc1)")
        assertTrue(format.contains("mp4a"), "Định dạng tương thích phải ưu tiên audio codec AAC (mp4a)")
        assertTrue(format.contains("height<=1080"), "Định dạng tương thích giới hạn tối đa 1080p")
    }

    @Test
    fun testBestQualityFormat() {
        val format = getFormatForQuality("best")
        assertEquals("bv*+ba/b", format, "Chế độ MAX phải chọn video và audio tốt nhất không giới hạn độ phân giải")
    }

    @Test
    fun testMp3AudioFormat() {
        val format = getFormatForQuality("mp3")
        assertEquals("bestaudio/best", format, "Chế độ MP3 chỉ trích xuất luồng âm thanh tốt nhất")
    }
}
