package com.adwewecat.downloadvideo.browser

/**
 * Quản lý danh sách các tab đang mở trong trình duyệt Chrome.
 * Điều phối tạo tab mới, đóng tab, chuyển tab và giới hạn bộ nhớ.
 */
class TabManager {

    companion object {
        const val NEW_TAB_URL = "chrome://newtab"
        const val MAX_TABS = 10
    }

    private val _tabs = mutableListOf<WebTab>()
    val tabs: List<WebTab> get() = _tabs

    var activeTabIndex: Int = 0
        private set

    val tabCount: Int
        get() = _tabs.size

    init {
        // Luôn khởi động với 1 New Tab mặc định
        createNewTab(NEW_TAB_URL)
    }

    /**
     * Tạo thêm một thẻ duyệt mới.
     * Nếu đã đạt giới hạn tối đa 10 tab, tự động đóng tab cũ nhất chưa dùng để giải phóng RAM.
     */
    fun createNewTab(url: String = NEW_TAB_URL): WebTab {
        if (_tabs.size >= MAX_TABS) {
            // Tìm tab không phải active tab có thời gian truy cập cũ nhất để đóng
            val oldestIndex = _tabs.indices
                .filter { it != activeTabIndex }
                .minByOrNull { _tabs[it].lastAccessed } ?: 0
            closeTab(oldestIndex)
        }

        val tab = WebTab(
            url = url,
            title = if (url == NEW_TAB_URL) "Thẻ mới" else url
        )
        _tabs.add(tab)
        activeTabIndex = _tabs.size - 1
        return tab
    }

    /**
     * Chọn kích hoạt một thẻ theo vị trí index.
     */
    fun selectTab(index: Int): WebTab? {
        if (index in _tabs.indices) {
            activeTabIndex = index
            val tab = _tabs[index]
            tab.lastAccessed = System.currentTimeMillis()
            return tab
        }
        return null
    }

    /**
     * Đóng một thẻ theo index.
     * Nếu đóng tab cuối cùng, tự động tạo lại một New Tab mới.
     */
    fun closeTab(index: Int): Boolean {
        if (index !in _tabs.indices) return false

        _tabs.removeAt(index)

        if (_tabs.isEmpty()) {
            createNewTab(NEW_TAB_URL)
            activeTabIndex = 0
            return true
        }

        // Điều chỉnh activeTabIndex nếu vị trí đóng ảnh hưởng
        if (activeTabIndex >= _tabs.size) {
            activeTabIndex = _tabs.size - 1
        } else if (activeTabIndex > index) {
            activeTabIndex--
        }

        _tabs[activeTabIndex].lastAccessed = System.currentTimeMillis()
        return true
    }

    /**
     * Đóng toàn bộ các tab và mở lại 1 New Tab duy nhất.
     */
    fun closeAllTabs() {
        _tabs.clear()
        createNewTab(NEW_TAB_URL)
        activeTabIndex = 0
    }

    /**
     * Lấy thẻ hiện tại đang được kích hoạt.
     */
    fun getActiveTab(): WebTab? {
        return _tabs.getOrNull(activeTabIndex)
    }
}
