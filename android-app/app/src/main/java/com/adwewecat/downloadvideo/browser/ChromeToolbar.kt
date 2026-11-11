package com.adwewecat.downloadvideo.browser

import android.content.Context
import android.net.Uri
import android.util.AttributeSet
import android.view.LayoutInflater
import android.view.View
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.widget.PopupMenu
import com.adwewecat.downloadvideo.R

/**
 * Thanh công cụ chuẩn phong cách Google Chrome.
 * Gồm nút Home 🏠, Omnibox bo tròn (hiển thị khóa 🔒 và tên miền rút gọn),
 * nút số lượng tab [ N ], và Menu ba chấm ⋮.
 */
class ChromeToolbar @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    private val btnHome: TextView
    private val layoutOmnibox: LinearLayout
    private val tvSecurityLock: TextView
    private val tvOmniboxUrl: TextView
    private val btnTabSwitcher: FrameLayout
    private val tvTabCount: TextView
    private val btnToolbarDownload: FrameLayout
    private val tvToolbarDownloadBadge: TextView
    private val btnOverflowMenu: TextView
    private val pbWebProgress: ProgressBar

    private var isDesktopSite: Boolean = false

    var onHomeClick: (() -> Unit)? = null
    var onOmniboxClick: (() -> Unit)? = null
    var onDownloadClick: (() -> Unit)? = null
    var onTabSwitcherClick: (() -> Unit)? = null
    var onNewTabClick: (() -> Unit)? = null
    var onReloadClick: (() -> Unit)? = null
    var onDesktopSiteToggle: ((Boolean) -> Unit)? = null
    var onDownloadsClick: (() -> Unit)? = null
    var onClearDataClick: (() -> Unit)? = null

    init {
        LayoutInflater.from(context).inflate(R.layout.view_chrome_toolbar, this, true)

        btnHome = findViewById(R.id.btnHome)
        layoutOmnibox = findViewById(R.id.layoutOmnibox)
        tvSecurityLock = findViewById(R.id.tvSecurityLock)
        tvOmniboxUrl = findViewById(R.id.tvOmniboxUrl)
        btnTabSwitcher = findViewById(R.id.btnTabSwitcher)
        tvTabCount = findViewById(R.id.tvTabCount)
        btnToolbarDownload = findViewById(R.id.btnToolbarDownload)
        tvToolbarDownloadBadge = findViewById(R.id.tvToolbarDownloadBadge)
        btnOverflowMenu = findViewById(R.id.btnOverflowMenu)
        pbWebProgress = findViewById(R.id.pbWebProgress)

        btnHome.setOnClickListener { onHomeClick?.invoke() }
        layoutOmnibox.setOnClickListener { onOmniboxClick?.invoke() }
        btnToolbarDownload.setOnClickListener { onDownloadClick?.invoke() }
        btnTabSwitcher.setOnClickListener { onTabSwitcherClick?.invoke() }
        btnOverflowMenu.setOnClickListener { showOverflowMenu(it) }
    }

    /**
     * Cập nhật URL và trạng thái khoá bảo mật trên thanh Omnibox.
     */
    fun updateUrl(url: String) {
        if (url == TabManager.NEW_TAB_URL || url.isBlank()) {
            tvSecurityLock.visibility = View.GONE
            tvOmniboxUrl.text = "Tìm kiếm hoặc nhập URL"
            return
        }

        try {
            val uri = Uri.parse(url)
            val host = uri.host ?: url
            tvOmniboxUrl.text = host.removePrefix("www.")
            tvSecurityLock.visibility = if (url.startsWith("https://", ignoreCase = true)) {
                View.VISIBLE
            } else {
                View.GONE
            }
        } catch (_: Exception) {
            tvOmniboxUrl.text = url
            tvSecurityLock.visibility = View.GONE
        }
    }

    /**
     * Cập nhật số lượng tab hiển thị trong ô [ N ].
     */
    fun updateTabCount(count: Int) {
        tvTabCount.text = if (count > 99) ":D" else count.toString()
    }

    /**
     * Cập nhật trạng thái hiển thị và số lượng media của nút Tải trên Toolbar.
     */
    fun setDownloadButtonVisible(visible: Boolean, mediaCount: Int = 0) {
        btnToolbarDownload.visibility = if (visible) View.VISIBLE else View.GONE
        if (mediaCount > 0) {
            tvToolbarDownloadBadge.visibility = View.VISIBLE
            tvToolbarDownloadBadge.text = if (mediaCount > 99) "99+" else mediaCount.toString()
        } else {
            tvToolbarDownloadBadge.visibility = View.GONE
        }
    }

    /**
     * Cập nhật tiến độ tải trang (0 - 100).
     */
    fun setProgress(progress: Int) {
        if (progress in 1..99) {
            pbWebProgress.visibility = View.VISIBLE
            pbWebProgress.progress = progress
        } else {
            pbWebProgress.visibility = View.GONE
        }
    }

    /**
     * Thiết lập trạng thái chế độ Desktop Site hiện tại.
     */
    fun setDesktopSiteChecked(checked: Boolean) {
        this.isDesktopSite = checked
    }

    /**
     * Hiển thị Menu 3 Chấm chuẩn Chrome.
     */
    private fun showOverflowMenu(anchor: View) {
        val popup = PopupMenu(context, anchor)
        popup.menuInflater.inflate(R.menu.menu_chrome_overflow, popup.menu)

        // Cập nhật trạng thái checkbox Desktop site
        val desktopItem = popup.menu.findItem(R.id.menu_desktop_site)
        desktopItem.isChecked = isDesktopSite

        popup.setOnMenuItemClickListener { item ->
            when (item.itemId) {
                R.id.menu_new_tab -> {
                    onNewTabClick?.invoke()
                    true
                }
                R.id.menu_reload -> {
                    onReloadClick?.invoke()
                    true
                }
                R.id.menu_desktop_site -> {
                    isDesktopSite = !isDesktopSite
                    item.isChecked = isDesktopSite
                    onDesktopSiteToggle?.invoke(isDesktopSite)
                    true
                }
                R.id.menu_downloads -> {
                    onDownloadsClick?.invoke()
                    true
                }
                R.id.menu_clear_data -> {
                    onClearDataClick?.invoke()
                    true
                }
                else -> false
            }
        }
        popup.show()
    }
}

