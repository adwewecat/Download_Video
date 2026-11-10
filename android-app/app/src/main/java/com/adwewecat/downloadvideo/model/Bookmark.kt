package com.adwewecat.downloadvideo.model

/**
 * Đối tượng biểu diễn một mục trang web / mạng xã hội trên màn hình Dashboard chính.
 */
data class Bookmark(
    val id: String,
    val name: String,
    val url: String,
    val emoji: String = "🌐",
    val description: String = ""
)

