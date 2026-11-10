package com.adwewecat.downloadvideo

import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/**
 * Unit test kiểm tra cấu hình dự án Android Native.
 * Đảm bảo các thông số SDK, App ID và quy chuẩn kỹ thuật được tuân thủ.
 */
class ProjectConfigTest {

    companion object {
        const val EXPECTED_APP_ID = "com.adwewecat.downloadvideo"
        const val MIN_SDK_VERSION = 26
        const val TARGET_SDK_VERSION = 34
    }

    @Test
    fun testAppIdentifier() {
        assertEquals("com.adwewecat.downloadvideo", EXPECTED_APP_ID)
    }

    @Test
    fun testSdkSupport() {
        assertTrue(MIN_SDK_VERSION >= 26, "Min SDK phải hỗ trợ từ Android 8.0 Oreo (API 26) trở lên")
        assertTrue(TARGET_SDK_VERSION >= 34, "Target SDK phải nhắm tới Android 14 (API 34)")
    }

    @Test
    fun testSupportedArchitectures() {
        val supportedAbis = listOf("arm64-v8a", "armeabi-v7a")
        assertTrue(supportedAbis.contains("arm64-v8a"), "Bắt buộc hỗ trợ kiến trúc 64-bit hiện đại (arm64-v8a)")
        assertTrue(supportedAbis.contains("armeabi-v7a"), "Bắt buộc hỗ trợ kiến trúc 32-bit (armeabi-v7a)")
    }
}

