package com.adwewecat.downloadvideo.utils

import android.webkit.CookieManager
import java.net.URI

/**
 * Tiện ích trích xuất và đồng bộ cookie từ WebView sang yt-dlp.
 */
object CookieUtils {

    /**
     * Lấy chuỗi Cookie header đầy đủ cho một URL từ CookieManager của Android WebView.
     */
    fun getCookiesForUrl(url: String): String {
        return try {
            val uri = URI(url)
            val baseDomainUrl = "${uri.scheme}://${uri.host}"
            val specificCookies = CookieManager.getInstance().getCookie(url) ?: ""
            val baseCookies = CookieManager.getInstance().getCookie(baseDomainUrl) ?: ""

            if (specificCookies.isNotBlank()) specificCookies else baseCookies
        } catch (e: Exception) {
            CookieManager.getInstance().getCookie(url) ?: ""
        }
    }
}

