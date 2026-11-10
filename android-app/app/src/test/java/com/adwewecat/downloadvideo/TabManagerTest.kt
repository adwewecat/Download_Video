package com.adwewecat.downloadvideo

import com.adwewecat.downloadvideo.browser.TabManager
import org.junit.Before
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

/**
 * Unit test kiểm tra logic quản lý đa thẻ của TabManager.
 */
class TabManagerTest {

    private lateinit var tabManager: TabManager

    @Before
    fun setUp() {
        tabManager = TabManager()
    }

    @Test
    fun testInitialTabState() {
        assertEquals(1, tabManager.tabCount, "Khởi động ban đầu phải có đúng 1 tab")
        val active = tabManager.getActiveTab()
        assertNotNull(active, "Active tab không được null")
        assertTrue(active.isNewTabPage, "Tab đầu tiên phải là trang New Tab")
        assertEquals(TabManager.NEW_TAB_URL, active.url)
    }

    @Test
    fun testCreateNewTab() {
        val tab2 = tabManager.createNewTab("https://www.youtube.com")
        assertEquals(2, tabManager.tabCount, "Số tab phải tăng lên 2")
        assertEquals("https://www.youtube.com", tab2.url)
        assertFalse(tab2.isNewTabPage, "Tab có link không phải là New Tab page")
        assertEquals(1, tabManager.activeTabIndex, "Tab mới tạo phải được chọn làm active tab")
    }

    @Test
    fun testSelectTab() {
        tabManager.createNewTab("https://www.facebook.com")
        assertEquals(1, tabManager.activeTabIndex)

        val selected = tabManager.selectTab(0)
        assertNotNull(selected)
        assertEquals(0, tabManager.activeTabIndex, "Active index phải chuyển về 0")
        assertTrue(selected.isNewTabPage)
    }

    @Test
    fun testCloseTab() {
        tabManager.createNewTab("https://www.tiktok.com")
        assertEquals(2, tabManager.tabCount)

        val closed = tabManager.closeTab(1)
        assertTrue(closed, "Đóng tab phải thành công")
        assertEquals(1, tabManager.tabCount, "Số tab phải còn 1")
        assertEquals(0, tabManager.activeTabIndex, "Active index phải lùi về tab hợp lệ")
    }

    @Test
    fun testCloseLastTabResetsToNewTab() {
        assertEquals(1, tabManager.tabCount)
        val closed = tabManager.closeTab(0)
        assertTrue(closed)
        assertEquals(1, tabManager.tabCount, "Khi đóng tab cuối cùng, phải tự động tạo 1 New Tab mới")
        assertTrue(tabManager.getActiveTab()?.isNewTabPage == true)
    }

    @Test
    fun testMaxTabLimit() {
        for (i in 1..15) {
            tabManager.createNewTab("https://site$i.com")
        }
        assertTrue(tabManager.tabCount <= TabManager.MAX_TABS, "Số tab không được vượt quá giới hạn MAX_TABS (10)")
    }
}

