package com.adwewecat.downloadvideo.browser

import android.content.Context
import android.graphics.Color
import android.text.Spannable
import android.text.SpannableStringBuilder
import android.text.style.ForegroundColorSpan
import android.util.AttributeSet
import android.view.LayoutInflater
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.adwewecat.downloadvideo.R
import com.adwewecat.downloadvideo.model.Bookmark

/**
 * Giao diện Trang Thẻ Mới (New Tab Page) chuẩn phong cách Google Chrome.
 * Hiển thị logo Google nhiều màu, thanh tìm kiếm lớn ở giữa và lưới phím tắt tròn.
 */
class NewTabView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    var onSearchClick: (() -> Unit)? = null
    var onNavigateUrl: ((String) -> Unit)? = null

    init {
        LayoutInflater.from(context).inflate(R.layout.view_chrome_new_tab, this, true)

        setupGoogleLogo()
        setupSearchBox()
        setupShortcuts()
    }

    /**
     * Tô màu logo Google theo đúng bộ nhận diện thương hiệu chuẩn của Chrome:
     * G (Xanh dương), o (Đỏ), o (Vàng), g (Xanh dương), l (Xanh lá), e (Đỏ).
     */
    private fun setupGoogleLogo() {
        val tvLogo = findViewById<TextView>(R.id.tvGoogleLogo)
        val word = "Google"
        val colors = intArrayOf(
            Color.parseColor("#4285F4"), // G - Xanh dương
            Color.parseColor("#EA4335"), // o - Đỏ
            Color.parseColor("#FBBC05"), // o - Vàng
            Color.parseColor("#4285F4"), // g - Xanh dương
            Color.parseColor("#34A853"), // l - Xanh lá
            Color.parseColor("#EA4335")  // e - Đỏ
        )

        val builder = SpannableStringBuilder(word)
        for (i in word.indices) {
            builder.setSpan(
                ForegroundColorSpan(colors[i % colors.size]),
                i,
                i + 1,
                Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
            )
        }
        tvLogo.text = builder
    }

    /**
     * Kích hoạt sự kiện bấm vào ô tìm kiếm lớn ở giữa.
     */
    private fun setupSearchBox() {
        val layoutSearch = findViewById<LinearLayout>(R.id.layoutCentralSearch)
        layoutSearch.setOnClickListener {
            onSearchClick?.invoke()
        }
    }

    /**
     * Thiết lập lưới phím tắt tròn 4 cột cho các trang web và mạng xã hội phổ biến.
     */
    private fun setupShortcuts() {
        val rvShortcuts = findViewById<RecyclerView>(R.id.rvShortcuts)
        rvShortcuts.layoutManager = GridLayoutManager(context, 4)

        val defaultBookmarks = listOf(
            Bookmark("yt", "YouTube", "https://m.youtube.com", "🔴", "Video & Shorts"),
            Bookmark("fb", "Facebook", "https://m.facebook.com", "🔵", "Mạng xã hội"),
            Bookmark("tt", "TikTok", "https://www.tiktok.com", "🎵", "Video ngắn"),
            Bookmark("ig", "Instagram", "https://www.instagram.com", "📷", "Ảnh & Reels"),
            Bookmark("th", "Threads", "https://www.threads.net", "🧵", "Mạng xã hội text"),
            Bookmark("tw", "X (Twitter)", "https://x.com", "🐦", "Tin tức nhanh"),
            Bookmark("gg", "Google", "https://www.google.com", "🔍", "Tìm kiếm web"),
            Bookmark("phim", "Phim", "https://vlxx.app", "🎬", "Phim & Video")
        )

        val adapter = ChromeShortcutAdapter(defaultBookmarks) { bookmark ->
            onNavigateUrl?.invoke(bookmark.url)
        }
        rvShortcuts.adapter = adapter
    }
}

