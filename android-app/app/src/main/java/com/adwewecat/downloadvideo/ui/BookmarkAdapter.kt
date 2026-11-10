package com.adwewecat.downloadvideo.ui

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.adwewecat.downloadvideo.R
import com.adwewecat.downloadvideo.model.Bookmark

/**
 * Adapter hiển thị danh bạ bookmarks trên màn hình chính dưới dạng lưới thẻ.
 */
class BookmarkAdapter(
    private val items: List<Bookmark>,
    private val onItemClick: (Bookmark) -> Unit
) : RecyclerView.Adapter<BookmarkAdapter.ViewHolder>() {

    class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tvEmoji: TextView = itemView.findViewById(R.id.tvBookmarkEmoji)
        val tvName: TextView = itemView.findViewById(R.id.tvBookmarkName)
        val tvDesc: TextView = itemView.findViewById(R.id.tvBookmarkDesc)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_bookmark, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val item = items[position]
        holder.tvEmoji.text = item.emoji
        holder.tvName.text = item.name
        holder.tvDesc.text = item.description

        holder.itemView.setOnClickListener {
            onItemClick(item)
        }
    }

    override fun getItemCount(): Int = items.size
}

