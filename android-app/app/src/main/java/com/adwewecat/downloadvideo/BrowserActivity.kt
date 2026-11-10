package com.adwewecat.downloadvideo

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.os.Bundle
import android.view.View
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ImageButton
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.adwewecat.downloadvideo.bridge.DVIBridge
import com.adwewecat.downloadvideo.downloader.DownloadService
import com.adwewecat.downloadvideo.ui.DownloadBottomSheet
import com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton

/**
 * Màn hình trình duyệt nhúng duyệt web và mạng xã hội.
 * Tự động phát hiện video/ảnh và điều phối tải về máy.
 */
class BrowserActivity : AppCompatActivity(), DVIBridge.DVIBridgeListener {

    private lateinit var webView: WebView
    private lateinit var tvUrlDisplay: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var fabDownload: ExtendedFloatingActionButton

    private val detectedMediaList = mutableListOf<DetectedMedia>()
    private var scriptContent: String = ""

    data class DetectedMedia(
        val type: String,
        val url: String,
        val title: String,
        val platform: String
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_browser)

        initViews()
        loadScriptFromAssets()
        setupWebView()

        val initialUrl = intent.getStringExtra(EXTRA_URL) ?: "https://www.google.com"
        webView.loadUrl(initialUrl)
    }

    private fun initViews() {
        webView = findViewById(R.id.webView)
        tvUrlDisplay = findViewById(R.id.tvUrlDisplay)
        progressBar = findViewById(R.id.pageProgressBar)
        fabDownload = findViewById(R.id.fabDownload)

        findViewById<ImageButton>(R.id.btnBack).setOnClickListener {
            if (webView.canGoBack()) webView.goBack() else finish()
        }

        findViewById<ImageButton>(R.id.btnForward).setOnClickListener {
            if (webView.canGoForward()) webView.goForward()
        }

        findViewById<ImageButton>(R.id.btnRefresh).setOnClickListener {
            webView.reload()
        }

        findViewById<ImageButton>(R.id.btnClose).setOnClickListener {
            finish()
        }

        fabDownload.setOnClickListener {
            if (detectedMediaList.isNotEmpty()) {
                val latest = detectedMediaList.last()
                showDownloadSheet(latest)
            }
        }
    }

    private fun loadScriptFromAssets() {
        try {
            assets.open("dvi_mobile_content.js").use { inputStream ->
                scriptContent = inputStream.bufferedReader().use { it.readText() }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true

        // Bật cookie đồng bộ
        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)

        // Đăng ký cầu nối DVIBridge
        webView.addJavascriptInterface(DVIBridge(this), DVIBridge.JAVASCRIPT_NAME)

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                if (newProgress < 100) {
                    progressBar.visibility = View.VISIBLE
                    progressBar.progress = newProgress
                } else {
                    progressBar.visibility = View.GONE
                }
            }

            override fun onReceivedTitle(view: WebView?, title: String?) {
                super.onReceivedTitle(view, title)
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                tvUrlDisplay.text = url ?: ""
                detectedMediaList.clear()
                updateFab()
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                tvUrlDisplay.text = url ?: ""
                // Inject script phát hiện media vào trang
                if (scriptContent.isNotBlank()) {
                    webView.evaluateJavascript(scriptContent, null)
                }
            }
        }
    }

    private fun updateFab() {
        if (detectedMediaList.isEmpty()) {
            fabDownload.visibility = View.GONE
        } else {
            fabDownload.visibility = View.VISIBLE
            fabDownload.text = "⬇ Tải (${detectedMediaList.size})"
        }
    }

    private fun showDownloadSheet(media: DetectedMedia) {
        val sheet = DownloadBottomSheet.newInstance(media.title, media.url) { quality ->
            startDownload(media.url, media.platform, quality, media.title, webView.url ?: media.url)
        }
        sheet.show(supportFragmentManager, DownloadBottomSheet.TAG)
    }

    override fun onMediaDetected(type: String, url: String, title: String, platform: String) {
        val alreadyExists = detectedMediaList.any { it.url == url }
        if (!alreadyExists) {
            detectedMediaList.add(DetectedMedia(type, url, title, platform))
            updateFab()
        }
    }

    override fun onBadgeClick(type: String, url: String, title: String, platform: String) {
        val media = DetectedMedia(type, url, title, platform)
        showDownloadSheet(media)
    }

    override fun startDownload(url: String, platform: String, quality: String, title: String, referer: String) {
        val cookies = CookieManager.getInstance().getCookie(url) ?: ""
        Toast.makeText(this, "Đang bắt đầu tải video...", Toast.LENGTH_SHORT).show()
        DownloadService.start(
            context = this,
            url = url,
            platform = platform,
            quality = quality,
            title = title,
            referer = referer,
            cookies = cookies
        )
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    companion object {
        const val EXTRA_URL = "extra_target_url"
    }
}
