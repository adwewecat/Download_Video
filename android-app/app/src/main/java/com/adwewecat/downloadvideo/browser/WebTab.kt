package com.adwewecat.downloadvideo.browser

import java.util.UUID

/**
 * Biểu diễn trạng thái của một thẻ (Tab) trong trình duyệt di động kiểu Chrome.
 */
data class WebTab(
    val id: String = UUID.randomUUID().toString(),
    var url: String = TabManager.NEW_TAB_URL,
    var title: String = "Thẻ mới",
    var isDesktopSite: Boolean = false,
    var webView: Any? = null,
    var lastAccessed: Long = System.currentTimeMillis()
) {
    val isNewTabPage: Boolean
        get() = url == TabManager.NEW_TAB_URL || url.isBlank()
}
