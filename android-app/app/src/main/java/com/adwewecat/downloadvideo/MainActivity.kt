package com.adwewecat.downloadvideo

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.inputmethod.EditorInfo
import android.widget.Button
import android.widget.EditText
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.adwewecat.downloadvideo.model.Bookmark
import com.adwewecat.downloadvideo.ui.BookmarkAdapter

/**
 * Màn hình Dashboard chính của ứng dụng.
 * Cho phép dán link tải nhanh hoặc chọn mở các trang web / mạng xã hội phổ biến.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var etUrlInput: EditText
    private lateinit var btnGo: Button
    private lateinit var rvBookmarks: RecyclerView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        initViews()
        requestPermissionsIfNeeded()
        setupBookmarks()
    }

    private fun initViews() {
        etUrlInput = findViewById(R.id.etUrlInput)
        btnGo = findViewById(R.id.btnGo)
        rvBookmarks = findViewById(R.id.rvBookmarks)

        btnGo.setOnClickListener {
            handleOpenUrl()
        }

        etUrlInput.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_GO || actionId == EditorInfo.IME_ACTION_DONE) {
                handleOpenUrl()
                true
            } else {
                false
            }
        }
    }

    private fun handleOpenUrl() {
        val rawInput = etUrlInput.text.toString().trim()
        if (rawInput.isBlank()) return

        val targetUrl = when {
            rawInput.startsWith("http://") || rawInput.startsWith("https://") -> rawInput
            rawInput.contains(".") && !rawInput.contains(" ") -> "https://$rawInput"
            else -> "https://www.google.com/search?q=" + Uri.encode(rawInput)
        }

        openBrowser(targetUrl)
    }

    private fun openBrowser(url: String) {
        val intent = Intent(this, BrowserActivity::class.java).apply {
            putExtra(BrowserActivity.EXTRA_URL, url)
        }
        startActivity(intent)
    }

    private fun setupBookmarks() {
        val bookmarks = listOf(
            Bookmark("yt", "YouTube", "https://m.youtube.com", "▶️", "youtube.com"),
            Bookmark("fb", "Facebook", "https://m.facebook.com", "📘", "facebook.com"),
            Bookmark("tt", "TikTok", "https://www.tiktok.com", "🎵", "tiktok.com"),
            Bookmark("ig", "Instagram", "https://www.instagram.com", "📷", "instagram.com"),
            Bookmark("x", "X / Twitter", "https://x.com", "🐦", "x.com"),
            Bookmark("th", "Threads", "https://www.threads.net", "🧵", "threads.net"),
            Bookmark("gg", "Google", "https://www.google.com", "🔍", "google.com"),
            Bookmark("vl", "Phim & Video", "https://play.vlstream.net", "🎬", "stream")
        )

        rvBookmarks.layoutManager = GridLayoutManager(this, 2)
        rvBookmarks.adapter = BookmarkAdapter(bookmarks) { bookmark ->
            openBrowser(bookmark.url)
        }
    }

    private fun requestPermissionsIfNeeded() {
        // Xin quyền thông báo trên Android 13+ (API 33+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                    this,
                    arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                    REQUEST_CODE_PERMISSIONS
                )
            }
        }
    }

    companion object {
        private const val REQUEST_CODE_PERMISSIONS = 1001
    }
}

