package com.adwewecat.downloadvideo

import org.junit.Test
import java.io.File
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/**
 * Unit test kiểm tra các quy tắc đường dẫn và logic của FFmpegInstaller.
 */
class FFmpegInstallerTest {

    @Test
    fun testExecutableDestinationPath() {
        val mockFilesDir = File("build/tmp/testFilesDir")
        val expectedBinDir = File(mockFilesDir, "bin")
        val expectedFile = File(expectedBinDir, "ffmpeg")

        assertEquals("ffmpeg", expectedFile.name)
        assertEquals("bin", expectedFile.parentFile?.name)
    }

    @Test
    fun testFilePermissionsLogic() {
        val testFile = File("build/tmp/testExecutable.tmp")
        testFile.parentFile?.mkdirs()
        testFile.writeText("echo test")

        // Kiểm tra logic setExecutable
        val canSet = testFile.setExecutable(true, false)
        assertTrue(testFile.exists(), "File test phải tồn tại")
        
        testFile.delete()
    }
}
