package com.adwewecat.downloadvideo.browser

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.adwewecat.downloadvideo.R

/**
 * Adapter hiển thị lưới thẻ tab trong màn hình Tab Switcher chuẩn Chrome.
 */
class TabSwitcherAdapter(
    private var tabs: List<WebTab>,
    private var activeIndex: Int,
    private val onTabClick: (Int) -> Unit,
    private val onTabClose: (Int) -> Unit
) : RecyclerView.Adapter<TabSwitcherAdapter.ViewHolder>() {

    class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val layoutTabCard: LinearLayout = itemView.findViewById(R.id.layoutTabCard)
        val tvTabFavicon: TextView = itemView.findViewById(R.id.tvTabFavicon)
        val tvTabTitle: TextView = itemView.findViewById(R.id.tvTabTitle)
        val btnTabClose: TextView = itemView.findViewById(R.id.btnTabClose)
        val tvPreviewIcon: TextView = itemView.findViewById(R.id.tvPreviewIcon)
        val tvTabSnippet: TextView = itemView.findViewById(R.id.tvTabSnippet)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_tab_card, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val tab = tabs[position]
        val isActive = position == activeIndex

        // Đánh dấu viền sáng nếu là tab đang được kích hoạt
        holder.layoutTabCard.setBackgroundResource(
            if (isActive) R.drawable.bg_tab_card_selected else R.drawable.bg_tab_card_normal
        )

        holder.tvTabTitle.text = if (tab.isNewTabPage) "Thẻ mới" else tab.title
        holder.tvTabSnippet.text = if (tab.isNewTabPage) "chrome://newtab" else tab.url

        if (tab.isNewTabPage) {
            holder.tvTabFavicon.text = "✨"
            holder.tvPreviewIcon.text = "🔍"
        } else {
            holder.tvTabFavicon.text = "🌐"
            holder.tvPreviewIcon.text = "🌐"
        }

        holder.layoutTabCard.setOnClickListener {
            val pos = holder.adapterPosition
            if (pos != RecyclerView.NO_POSITION) {
                onTabClick(pos)
            }
        }

        holder.btnTabClose.setOnClickListener {
            val pos = holder.adapterPosition
            if (pos != RecyclerView.NO_POSITION) {
                onTabClose(pos)
            }
        }
    }

    override fun getItemCount(): Int = tabs.size

    /**
     * Cập nhật danh sách thẻ và vị trí thẻ kích hoạt mới.
     */
    fun updateData(newTabs: List<WebTab>, newActiveIndex: Int) {
        this.tabs = newTabs
        this.activeIndex = newActiveIndex
        notifyDataSetChanged()
    }
}
