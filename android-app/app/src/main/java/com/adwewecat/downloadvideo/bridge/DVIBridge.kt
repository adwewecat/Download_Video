package com.adwewecat.downloadvideo.bridge

import android.os.Handler
import android.os.Looper
import android.util.Log
import android.webkit.JavascriptInterface

/**
 * Cầu nối JavaScriptInterface hai chiều giữa Android WebView và dvi_mobile_content.js.
 */
class DVIBridge(private val listener: DVIBridgeListener) {

    private val mainHandler = Handler(Looper.getMainLooper())

    interface DVIBridgeListener {
        fun onMediaDetected(type: String, url: String, title: String, platform: String)
        fun onBadgeClick(type: String, url: String, title: String, platform: String)
        fun startDownload(url: String, platform: String, quality: String, title: String, referer: String)
    }

    @JavascriptInterface
    fun onMediaDetected(type: String, url: String, title: String, platform: String) {
        Log.d(TAG, "Media phát hiện: type=$type, platform=$platform, url=$url")
        mainHandler.post {
            listener.onMediaDetected(type, url, title, platform)
        }
    }

    @JavascriptInterface
    fun onBadgeClick(type: String, url: String, title: String, platform: String) {
        Log.d(TAG, "Người dùng chạm nút tải: url=$url")
        mainHandler.post {
            listener.onBadgeClick(type, url, title, platform)
        }
    }

    @JavascriptInterface
    fun startDownload(url: String, platform: String, quality: String, title: String, referer: String) {
        Log.d(TAG, "Kích hoạt lệnh tải: url=$url, quality=$quality")
        mainHandler.post {
            listener.startDownload(url, platform, quality, title, referer)
        }
    }

    companion object {
        const val JAVASCRIPT_NAME = "DVIBridge"
        private const val TAG = "DVIBridge"
    }
}

