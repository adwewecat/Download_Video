package com.adwewecat.downloadvideo

import android.app.Application
import android.util.Log

/**
 * Lớp Application khởi tạo toàn cục cho ứng dụng Android.
 * Quản lý khởi tạo Chaquopy Python runtime khi ứng dụng khởi chạy.
 */
class DownloadApp : Application() {

    override fun onCreate() {
        super.onCreate()
        Log.i(TAG, "DownloadApp khởi tạo thành công")
    }

    companion object {
        private const val TAG = "DownloadApp"
    }
}
