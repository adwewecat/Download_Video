package com.adwewecat.downloadvideo.browser

import android.content.Context
import android.util.AttributeSet
import android.view.LayoutInflater
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.adwewecat.downloadvideo.R

/**
 * Màn hình Trình Chuyển Đổi Thẻ (Tab Switcher Screen) chuẩn phong cách Chrome.
 * Hiển thị danh sách tab dạng lưới thẻ thu nhỏ, hỗ trợ mở thêm thẻ mới (+) và đóng thẻ (✕).
 */
class TabSwitcherView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    private val btnNewTab: LinearLayout
    private val tvTabSwitcherCount: TextView
    private val btnCloseAllTabs: TextView
    private val btnDoneTabSwitcher: TextView
    private val rvTabCards: RecyclerView

    private var adapter: TabSwitcherAdapter? = null

    var onNewTabClick: (() -> Unit)? = null
    var onTabSelect: ((Int) -> Unit)? = null
    var onTabClose: ((Int) -> Unit)? = null
    var onCloseAllClick: (() -> Unit)? = null
    var onDoneClick: (() -> Unit)? = null

    init {
        LayoutInflater.from(context).inflate(R.layout.view_tab_switcher, this, true)

        btnNewTab = findViewById(R.id.btnNewTab)
        tvTabSwitcherCount = findViewById(R.id.tvTabSwitcherCount)
        btnCloseAllTabs = findViewById(R.id.btnCloseAllTabs)
        btnDoneTabSwitcher = findViewById(R.id.btnDoneTabSwitcher)
        rvTabCards = findViewById(R.id.rvTabCards)

        rvTabCards.layoutManager = GridLayoutManager(context, 2)

        btnNewTab.setOnClickListener { onNewTabClick?.invoke() }
        btnCloseAllTabs.setOnClickListener { onCloseAllClick?.invoke() }
        btnDoneTabSwitcher.setOnClickListener { onDoneClick?.invoke() }
    }

    /**
     * Làm mới toàn bộ danh sách thẻ và cập nhật hiển thị.
     */
    fun refresh(tabManager: TabManager) {
        val count = tabManager.tabCount
        tvTabSwitcherCount.text = "$count thẻ"

        if (adapter == null) {
            adapter = TabSwitcherAdapter(
                tabs = tabManager.tabs,
                activeIndex = tabManager.activeTabIndex,
                onTabClick = { index -> onTabSelect?.invoke(index) },
                onTabClose = { index -> onTabClose?.invoke(index) }
            )
            rvTabCards.adapter = adapter
        } else {
            adapter?.updateData(tabManager.tabs, tabManager.activeTabIndex)
        }
    }
}

