package com.adwewecat.downloadvideo

import android.Manifest
import android.annotation.SuppressLint
import android.app.AlertDialog
import android.content.ClipboardManager
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebStorage
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.adwewecat.downloadvideo.bridge.DVIBridge
import com.adwewecat.downloadvideo.browser.ChromeToolbar
import com.adwewecat.downloadvideo.browser.NewTabView
import com.adwewecat.downloadvideo.browser.TabManager
import com.adwewecat.downloadvideo.browser.TabSwitcherView
import com.adwewecat.downloadvideo.browser.WebTab
import com.adwewecat.downloadvideo.downloader.DownloadService
import com.adwewecat.downloadvideo.ui.DownloadBottomSheet
import com.adwewecat.downloadvideo.ui.DownloadsBottomSheet
import com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton

/**
 * Trình duyệt di động hoàn chỉnh chuẩn phong cách Google Chrome.
 * Tích hợp đa thẻ duyệt (TabManager), thanh Omnibox thông minh, trang New Tab Material,
 * menu 3 chấm, và khả năng phát hiện & tải media độc lập 100% trong máy.
 */
class MainActivity : AppCompatActivity(), DVIBridge.DVIBridgeListener {

    private lateinit var chromeToolbar: ChromeToolbar
    private lateinit var tabContentContainer: FrameLayout
    private lateinit var fabDownload: ExtendedFloatingActionButton
    private lateinit var tabSwitcherView: TabSwitcherView
    private lateinit var layoutOmniboxInputOverlay: FrameLayout

    private val tabManager = TabManager()
    private val tabMediaMap = mutableMapOf<String, MutableList<DetectedMedia>>()
    private var scriptContent: String = ""
    private var newTabView: NewTabView? = null

    data class DetectedMedia(
        val type: String,
        val url: String,
        val title: String,
        val platform: String
    )

    companion object {
        private const val DESKTOP_USER_AGENT =
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        initViews()
        loadScriptFromAssets()
        requestPermissionsIfNeeded()
        setupBackNavigation()

        // Khởi động giao diện với tab đầu tiên
        switchToTab(tabManager.activeTabIndex)
    }

    private fun initViews() {
        chromeToolbar = findViewById(R.id.chromeToolbar)
        tabContentContainer = findViewById(R.id.tabContentContainer)
        fabDownload = findViewById(R.id.fabDownload)
        tabSwitcherView = findViewById(R.id.tabSwitcherView)
        layoutOmniboxInputOverlay = findViewById(R.id.layoutOmniboxInputOverlay)

        // Khởi tạo NewTabView tái sử dụng
        newTabView = NewTabView(this).apply {
            onSearchClick = { showOmniboxInputDialog() }
            onNavigateUrl = { url -> loadUrlInActiveTab(url) }
        }

        // Thiết lập sự kiện trên thanh Omnibox
        chromeToolbar.onHomeClick = {
            navigateToNewTab()
        }

        chromeToolbar.onOmniboxClick = {
            showOmniboxInputDialog()
        }

        chromeToolbar.onTabSwitcherClick = {
            openTabSwitcher()
        }

        chromeToolbar.onNewTabClick = {
            tabManager.createNewTab()
            switchToTab(tabManager.activeTabIndex)
        }

        chromeToolbar.onReloadClick = {
            getActiveWebView()?.reload()
        }

        chromeToolbar.onDesktopSiteToggle = { enabled ->
            val activeTab = tabManager.getActiveTab()
            if (activeTab != null) {
                activeTab.isDesktopSite = enabled
                val webView = activeTab.webView as? WebView
                if (webView != null) {
                    applyDesktopMode(webView, enabled)
                    webView.reload()
                }
            }
        }

        chromeToolbar.onDownloadsClick = {
            DownloadsBottomSheet().show(supportFragmentManager, "downloads_sheet")
        }

        chromeToolbar.onClearDataClick = {
            confirmClearBrowsingData()
        }

        chromeToolbar.onDownloadClick = {
            val activeTab = tabManager.getActiveTab()
            if (activeTab != null && !activeTab.isNewTabPage) {
                val mediaList = tabMediaMap[activeTab.id]
                if (!mediaList.isNullOrEmpty()) {
                    val targetMedia = mediaList.firstOrNull { it.type == "video" } ?: mediaList.first()
                    showDownloadSheet(targetMedia)
                } else {
                    val pageTitle = if (activeTab.title.isNotBlank() && activeTab.title != activeTab.url) activeTab.title else "Video"
                    val pageMedia = DetectedMedia(
                        type = "video",
                        url = activeTab.url,
                        title = pageTitle,
                        platform = "web"
                    )
                    showDownloadSheet(pageMedia)
                }
            }
        }

        // Nút FAB Tải Media nổi ở góc màn hình
        fabDownload.setOnClickListener {
            val activeTab = tabManager.getActiveTab() ?: return@setOnClickListener
            val mediaList = tabMediaMap[activeTab.id]
            if (!mediaList.isNullOrEmpty()) {
                val targetMedia = mediaList.firstOrNull { it.type == "video" } ?: mediaList.first()
                showDownloadSheet(targetMedia)
            } else if (!activeTab.isNewTabPage) {
                val pageTitle = if (activeTab.title.isNotBlank() && activeTab.title != activeTab.url) activeTab.title else "Video"
                val pageMedia = DetectedMedia(
                    type = "video",
                    url = activeTab.url,
                    title = pageTitle,
                    platform = "web"
                )
                showDownloadSheet(pageMedia)
            }
        }

        // Thiết lập sự kiện cho Màn hình Chuyển Đổi Thẻ (Tab Switcher)
        tabSwitcherView.onNewTabClick = {
            tabSwitcherView.visibility = View.GONE
            tabManager.createNewTab()
            switchToTab(tabManager.activeTabIndex)
        }

        tabSwitcherView.onTabSelect = { index ->
            tabSwitcherView.visibility = View.GONE
            switchToTab(index)
        }

        tabSwitcherView.onTabClose = { index ->
            val tabToClose = tabManager.tabs.getOrNull(index)
            (tabToClose?.webView as? WebView)?.destroy()
            tabMediaMap.remove(tabToClose?.id)

            tabManager.closeTab(index)
            tabSwitcherView.refresh(tabManager)
            chromeToolbar.updateTabCount(tabManager.tabCount)
            switchToTab(tabManager.activeTabIndex)
        }

        tabSwitcherView.onCloseAllClick = {
            tabManager.tabs.forEach { tab ->
                (tab.webView as? WebView)?.destroy()
            }
            tabMediaMap.clear()
            tabManager.closeAllTabs()
            tabSwitcherView.visibility = View.GONE
            switchToTab(0)
        }

        tabSwitcherView.onDoneClick = {
            tabSwitcherView.visibility = View.GONE
        }
    }

    /**
     * Chuyển đổi hiển thị sang tab được chọn.
     */
    private fun switchToTab(index: Int) {
        val tab = tabManager.selectTab(index) ?: return

        tabContentContainer.removeAllViews()

        if (tab.isNewTabPage) {
            tabContentContainer.addView(newTabView)
            chromeToolbar.updateUrl(TabManager.NEW_TAB_URL)
            chromeToolbar.setProgress(100)
            fabDownload.visibility = View.GONE
            chromeToolbar.setDownloadButtonVisible(false, 0)
        } else {
            val webView = getOrCreateWebView(tab)
            tabContentContainer.addView(webView)
            chromeToolbar.updateUrl(tab.url)
            updateFabForActiveTab()
        }

        chromeToolbar.updateTabCount(tabManager.tabCount)
        chromeToolbar.setDesktopSiteChecked(tab.isDesktopSite)
    }

    /**
     * Tạo hoặc lấy WebView hiện có của thẻ.
     */
    @SuppressLint("SetJavaScriptEnabled")
    private fun getOrCreateWebView(tab: WebTab): WebView {
        var wv = tab.webView as? WebView
        if (wv != null) return wv

        wv = WebView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )

            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.mediaPlaybackRequiresUserGesture = false
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            settings.setSupportMultipleWindows(false)
            settings.javaScriptCanOpenWindowsAutomatically = false
            settings.allowFileAccess = true
            settings.allowContentAccess = true
            settings.loadWithOverviewMode = true
            settings.useWideViewPort = true

            // Bật cookie đồng bộ
            CookieManager.getInstance().setAcceptCookie(true)
            CookieManager.getInstance().setAcceptThirdPartyCookies(this, true)

            // Đăng ký cầu nối media
            addJavascriptInterface(DVIBridge(this@MainActivity), DVIBridge.JAVASCRIPT_NAME)

            applyDesktopMode(this, tab.isDesktopSite)

            webChromeClient = object : WebChromeClient() {
                override fun onProgressChanged(view: WebView?, newProgress: Int) {
                    if (tabManager.getActiveTab()?.id == tab.id) {
                        chromeToolbar.setProgress(newProgress)
                        val currentUrl = view?.url
                        if (!currentUrl.isNullOrBlank() && currentUrl != tab.url) {
                            tab.url = currentUrl
                            chromeToolbar.updateUrl(currentUrl)
                            updateFabForActiveTab()
                            if (scriptContent.isNotBlank()) {
                                view.evaluateJavascript(scriptContent, null)
                            }
                        }
                    }
                }

                override fun onReceivedTitle(view: WebView?, title: String?) {
                    super.onReceivedTitle(view, title)
                    if (!title.isNullOrBlank()) {
                        tab.title = title
                    }
                }
            }

            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                    val url = request?.url?.toString() ?: return false
                    view?.loadUrl(url)
                    return true
                }

                override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                    super.onPageStarted(view, url, favicon)
                    url?.let {
                        tab.url = it
                        if (tabManager.getActiveTab()?.id == tab.id) {
                            chromeToolbar.updateUrl(it)
                            tabMediaMap[tab.id]?.clear()
                            updateFabForActiveTab()
                        }
                    }
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    url?.let {
                        tab.url = it
                        if (tabManager.getActiveTab()?.id == tab.id) {
                            chromeToolbar.updateUrl(it)
                            updateFabForActiveTab()
                        }
                    }
                    if (scriptContent.isNotBlank()) {
                        view?.evaluateJavascript(scriptContent, null)
                    }
                }
            }
        }

        tab.webView = wv
        if (tab.url.isNotBlank() && tab.url != TabManager.NEW_TAB_URL) {
            wv.loadUrl(tab.url)
        }
        return wv
    }

    /**
     * Áp dụng chế độ Desktop Site (Trang web cho máy tính).
     */
    private fun applyDesktopMode(webView: WebView, enable: Boolean) {
        val settings = webView.settings
        if (enable) {
            settings.userAgentString = DESKTOP_USER_AGENT
            settings.useWideViewPort = true
            settings.loadWithOverviewMode = true
        } else {
            settings.userAgentString = null // Khôi phục User-Agent mặc định của WebView di động
            settings.useWideViewPort = true
            settings.loadWithOverviewMode = true
        }
    }

    /**
     * Tải một URL trong thẻ hiện tại.
     */
    private fun loadUrlInActiveTab(rawInput: String) {
        val targetUrl = sanitizeUrlOrSearch(rawInput)
        val activeTab = tabManager.getActiveTab() ?: return

        activeTab.url = targetUrl
        activeTab.title = targetUrl

        val webView = getOrCreateWebView(activeTab)
        tabContentContainer.removeAllViews()
        tabContentContainer.addView(webView)

        webView.loadUrl(targetUrl)
        chromeToolbar.updateUrl(targetUrl)
    }

    /**
     * Trở về trang New Tab.
     */
    private fun navigateToNewTab() {
        val activeTab = tabManager.getActiveTab() ?: return
        activeTab.url = TabManager.NEW_TAB_URL
        activeTab.title = "Thẻ mới"
        switchToTab(tabManager.activeTabIndex)
    }

    /**
     * Mở màn hình quản lý thẻ (Tab Switcher).
     */
    private fun openTabSwitcher() {
        tabSwitcherView.refresh(tabManager)
        tabSwitcherView.visibility = View.VISIBLE
    }

    /**
     * Hiển thị Hộp thoại Nhập Liệu Toàn Màn Hình Omnibox Input.
     */
    private fun showOmniboxInputDialog() {
        layoutOmniboxInputOverlay.removeAllViews()
        val inflater = LayoutInflater.from(this)
        val view = inflater.inflate(R.layout.dialog_omnibox_input, layoutOmniboxInputOverlay, false)

        val btnBack = view.findViewById<TextView>(R.id.btnBack)
        val etInput = view.findViewById<EditText>(R.id.etOmniboxInput)
        val btnClear = view.findViewById<TextView>(R.id.btnClearText)
        val btnGo = view.findViewById<TextView>(R.id.btnGo)
        val layoutPaste = view.findViewById<LinearLayout>(R.id.layoutPasteClipboard)
        val tvClipboard = view.findViewById<TextView>(R.id.tvClipboardContent)

        // Điền trước URL hiện tại (nếu có)
        val activeTab = tabManager.getActiveTab()
        if (activeTab != null && !activeTab.isNewTabPage) {
            etInput.setText(activeTab.url)
            etInput.selectAll()
            btnClear.visibility = View.VISIBLE
        }

        btnBack.setOnClickListener {
            hideOmniboxInputDialog()
        }

        btnClear.setOnClickListener {
            etInput.setText("")
        }

        val performNavigate = {
            val text = etInput.text.toString().trim()
            if (text.isNotBlank()) {
                hideOmniboxInputDialog()
                loadUrlInActiveTab(text)
            }
        }

        btnGo.setOnClickListener { performNavigate() }

        etInput.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_GO || actionId == EditorInfo.IME_ACTION_DONE) {
                performNavigate()
                true
            } else {
                false
            }
        }

        // Kiểm tra Clipboard để gợi ý dán nhanh
        try {
            val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val clip = clipboard.primaryClip
            if (clip != null && clip.itemCount > 0) {
                val clipText = clip.getItemAt(0).text?.toString()?.trim() ?: ""
                if (clipText.isNotBlank()) {
                    tvClipboard.text = clipText
                    layoutPaste.visibility = View.VISIBLE
                    layoutPaste.setOnClickListener {
                        hideOmniboxInputDialog()
                        loadUrlInActiveTab(clipText)
                    }
                } else {
                    layoutPaste.visibility = View.GONE
                }
            } else {
                layoutPaste.visibility = View.GONE
            }
        } catch (_: Exception) {
            layoutPaste.visibility = View.GONE
        }

        layoutOmniboxInputOverlay.addView(view)
        layoutOmniboxInputOverlay.visibility = View.VISIBLE

        etInput.requestFocus()
        val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
        imm.showSoftInput(etInput, InputMethodManager.SHOW_IMPLICIT)
    }

    private fun hideOmniboxInputDialog() {
        val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
        currentFocus?.let { imm.hideSoftInputFromWindow(it.windowToken, 0) }
        layoutOmniboxInputOverlay.visibility = View.GONE
        layoutOmniboxInputOverlay.removeAllViews()
    }

    /**
     * Chuẩn hoá chuỗi nhập vào: nếu là URL hợp lệ thì mở trực tiếp, nếu là từ khoá thì tìm kiếm qua Google.
     */
    private fun sanitizeUrlOrSearch(input: String): String {
        val trimmed = input.trim()
        return when {
            trimmed.startsWith("http://", ignoreCase = true) || trimmed.startsWith("https://", ignoreCase = true) -> trimmed
            trimmed.contains(".") && !trimmed.contains(" ") -> "https://$trimmed"
            else -> "https://www.google.com/search?q=" + Uri.encode(trimmed)
        }
    }

    /**
     * Cập nhật nút tải trên Toolbar và nút nổi FAB hiển thị số lượng media phát hiện cho active tab.
     */
    private fun updateFabForActiveTab() {
        val activeTab = tabManager.getActiveTab() ?: return
        if (activeTab.isNewTabPage) {
            fabDownload.visibility = View.GONE
            chromeToolbar.setDownloadButtonVisible(false, 0)
            return
        }

        val list = tabMediaMap[activeTab.id] ?: emptyList()
        val totalCount = list.size

        // Nút tải trên Toolbar luôn hiển thị khi duyệt bất kỳ trang web nào
        chromeToolbar.setDownloadButtonVisible(true, totalCount)

        // FAB ở góc màn hình: hiển thị khi có media hoặc là trang video
        val isVideoUrl = activeTab.url.contains("youtube.com") ||
                activeTab.url.contains("facebook.com") ||
                activeTab.url.contains("tiktok.com") ||
                activeTab.url.contains("instagram.com") ||
                activeTab.url.contains("threads.net") ||
                activeTab.url.contains("x.com") ||
                activeTab.url.contains("vlxx") ||
                activeTab.url.contains("phim") ||
                activeTab.url.contains("/video") ||
                activeTab.url.contains("/watch") ||
                activeTab.url.contains("/reel")

        if (totalCount > 0) {
            fabDownload.visibility = View.VISIBLE
            val videoCount = list.count { it.type == "video" }
            val imageCount = list.count { it.type == "image" }
            fabDownload.text = when {
                videoCount > 0 && imageCount > 0 -> "⬇ Tải ($totalCount)"
                videoCount > 0 -> "⬇ Tải Video ($videoCount)"
                else -> "🖼️ Tải Ảnh ($imageCount)"
            }
        } else if (isVideoUrl) {
            fabDownload.visibility = View.VISIBLE
            fabDownload.text = "⬇ Tải Video"
        } else {
            fabDownload.visibility = View.GONE
        }
    }

    private fun getActiveWebView(): WebView? {
        return tabManager.getActiveTab()?.webView as? WebView
    }

    private fun showDownloadSheet(media: DetectedMedia) {
        val sheet = DownloadBottomSheet.newInstance(media.title, media.url) { quality ->
            val referer = getActiveWebView()?.url ?: media.url
            startDownload(media.url, media.platform, quality, media.title, referer)
        }
        sheet.show(supportFragmentManager, DownloadBottomSheet.TAG)
    }

    // --- Cầu nối DVIBridge.DVIBridgeListener ---

    override fun onMediaDetected(type: String, url: String, title: String, platform: String) {
        val activeTab = tabManager.getActiveTab() ?: return
        val list = tabMediaMap.getOrPut(activeTab.id) { mutableListOf() }
        if (list.none { it.url == url }) {
            list.add(DetectedMedia(type, url, title, platform))
            runOnUiThread {
                updateFabForActiveTab()
            }
        }
    }

    override fun onBadgeClick(type: String, url: String, title: String, platform: String) {
        runOnUiThread {
            showDownloadSheet(DetectedMedia(type, url, title, platform))
        }
    }

    override fun startDownload(url: String, platform: String, quality: String, title: String, referer: String) {
        val cookies = CookieManager.getInstance().getCookie(url) ?: ""
        Toast.makeText(this, "Đang bắt đầu tải media...", Toast.LENGTH_SHORT).show()
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

    /**
     * Hộp thoại xác nhận xoá sạch lịch sử, cache và cookie duyệt web.
     */
    private fun confirmClearBrowsingData() {
        AlertDialog.Builder(this)
            .setTitle("Xoá dữ liệu duyệt web")
            .setMessage("Thao tác này sẽ xoá bộ nhớ đệm (cache), lịch sử và cookie của các trang web. Bạn có chắc chắn?")
            .setPositiveButton("Xoá tất cả") { _, _ ->
                clearBrowsingData()
            }
            .setNegativeButton("Huỷ", null)
            .show()
    }

    private fun clearBrowsingData() {
        try {
            // Xoá cookie
            CookieManager.getInstance().removeAllCookies(null)
            CookieManager.getInstance().flush()

            // Xoá WebStorage & Cache
            WebStorage.getInstance().deleteAllData()
            tabManager.tabs.forEach { tab ->
                (tab.webView as? WebView)?.clearCache(true)
            }

            Toast.makeText(this, "Đã xoá sạch dữ liệu duyệt web thành công", Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            Toast.makeText(this, "Lỗi khi xoá dữ liệu: ${e.message}", Toast.LENGTH_SHORT).show()
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

    private fun requestPermissionsIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED
            ) {
                ActivityCompat.requestPermissions(
                    this,
                    arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                    1001
                )
            }
        }
    }

    /**
     * Xử lý nút Back của Android chuẩn phong cách Chrome:
     * 1. Đóng hộp thoại Omnibox Input nếu đang mở.
     * 2. Đóng màn hình Tab Switcher nếu đang mở.
     * 3. Lùi trang web nếu WebView có thể lùi (canGoBack).
     * 4. Về trang New Tab nếu đang ở trang web.
     * 5. Mở Tab Switcher nếu còn nhiều hơn 1 tab.
     * 6. Thoát ứng dụng nếu đang ở New Tab duy nhất.
     */
    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (layoutOmniboxInputOverlay.visibility == View.VISIBLE) {
                    hideOmniboxInputDialog()
                    return
                }

                if (tabSwitcherView.visibility == View.VISIBLE) {
                    tabSwitcherView.visibility = View.GONE
                    return
                }

                val activeTab = tabManager.getActiveTab()
                val webView = activeTab?.webView as? WebView

                if (webView != null && webView.canGoBack()) {
                    webView.goBack()
                    return
                }

                if (activeTab != null && !activeTab.isNewTabPage) {
                    navigateToNewTab()
                    return
                }

                if (tabManager.tabCount > 1) {
                    openTabSwitcher()
                    return
                }

                finish()
            }
        })
    }

    override fun onDestroy() {
        super.onDestroy()
        // Dọn dẹp toàn bộ WebView để chống rò rỉ bộ nhớ
        tabManager.tabs.forEach { tab ->
            (tab.webView as? WebView)?.destroy()
        }
    }
}
