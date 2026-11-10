package com.adwewecat.downloadvideo.browser

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.adwewecat.downloadvideo.R
import com.adwewecat.downloadvideo.model.Bookmark

/**
 * Adapter hiển thị lưới phím tắt tròn trên trang Thẻ Mới (New Tab Page) chuẩn Chrome.
 */
class ChromeShortcutAdapter(
    private val items: List<Bookmark>,
    private val onShortcutClick: (Bookmark) -> Unit
) : RecyclerView.Adapter<ChromeShortcutAdapter.ViewHolder>() {

    class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tvEmoji: TextView = itemView.findViewById(R.id.tvShortcutEmoji)
        val tvTitle: TextView = itemView.findViewById(R.id.tvShortcutTitle)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_chrome_shortcut, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val item = items[position]
        holder.tvEmoji.text = item.emoji
        holder.tvTitle.text = item.name

        holder.itemView.setOnClickListener {
            onShortcutClick(item)
        }
    }

    override fun getItemCount(): Int = items.size
}

