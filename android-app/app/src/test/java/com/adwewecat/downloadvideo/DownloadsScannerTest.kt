package com.adwewecat.downloadvideo

import com.adwewecat.downloadvideo.utils.DownloadsScanner
import org.junit.After
import org.junit.Before
import org.junit.Test
import java.io.File
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/**
 * Unit test kiểm tra logic quét, phân loại và định dạng danh sách tệp tải về.
 */
class DownloadsScannerTest {

    private lateinit var tempDir: File

    @Before
    fun setUp() {
        tempDir = File("build/tmp/test_downloads_${System.currentTimeMillis()}")
        tempDir.mkdirs()
    }

    @After
    fun tearDown() {
        tempDir.deleteRecursively()
    }

    @Test
    fun testFormatSize() {
        assertEquals("0 B", DownloadsScanner.formatSize(0))
        assertEquals("500 B", DownloadsScanner.formatSize(500))
        assertEquals("1.5 KB", DownloadsScanner.formatSize(1536))
        assertEquals("10.00 MB", DownloadsScanner.formatSize(10 * 1024 * 1024))
    }

    @Test
    fun testIsMediaFile() {
        assertTrue(DownloadsScanner.isMediaFile("video.mp4"))
        assertTrue(DownloadsScanner.isMediaFile("audio.mp3"))
        assertTrue(DownloadsScanner.isMediaFile("photo.jpg"))
        assertTrue(DownloadsScanner.isMediaFile("image.png"))
        assertTrue(DownloadsScanner.isMediaFile("clip.webm"))

        assertFalse(DownloadsScanner.isMediaFile("document.pdf"))
        assertFalse(DownloadsScanner.isMediaFile("script.js"))
        assertFalse(DownloadsScanner.isMediaFile(".nomedia"))
    }

    @Test
    fun testScanDirectoryReturnsSortedMediaFiles() {
        val file1 = File(tempDir, "old_video.mp4")
        file1.writeBytes(ByteArray(1024))
        file1.setLastModified(1000L)

        val file2 = File(tempDir, "new_audio.mp3")
        file2.writeBytes(ByteArray(2048))
        file2.setLastModified(5000L)

        val nonMedia = File(tempDir, "notes.txt")
        nonMedia.writeText("ignored")

        val results = DownloadsScanner.scan(tempDir)
        assertEquals(2, results.size, "Chỉ giữ lại 2 file media, loại bỏ file text")
        assertEquals("new_audio.mp3", results[0].file.name, "File mới nhất phải xếp trước")
        assertEquals("old_video.mp4", results[1].file.name)
    }

    @Test
    fun testScanNonExistentDirectoryReturnsEmpty() {
        val ghostDir = File(tempDir, "ghost_dir")
        val results = DownloadsScanner.scan(ghostDir)
        assertTrue(results.isEmpty())
    }
}

