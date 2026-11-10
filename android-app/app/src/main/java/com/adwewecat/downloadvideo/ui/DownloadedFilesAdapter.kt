package com.adwewecat.downloadvideo.ui

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.adwewecat.downloadvideo.R
import com.adwewecat.downloadvideo.utils.DownloadedFile
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Adapter hiển thị danh sách các tệp media đã tải xuống trong BottomSheet.
 */
class DownloadedFilesAdapter(
    private var items: List<DownloadedFile>,
    private val onOpenClick: (DownloadedFile) -> Unit,
    private val onShareClick: (DownloadedFile) -> Unit,
    private val onDeleteClick: (DownloadedFile) -> Unit
) : RecyclerView.Adapter<DownloadedFilesAdapter.ViewHolder>() {

    private val dateFormat = SimpleDateFormat("HH:mm dd/MM/yyyy", Locale.getDefault())

    class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tvFileEmoji: TextView = itemView.findViewById(R.id.tvFileEmoji)
        val tvFileName: TextView = itemView.findViewById(R.id.tvFileName)
        val tvFileInfo: TextView = itemView.findViewById(R.id.tvFileInfo)
        val btnShareFile: TextView = itemView.findViewById(R.id.btnShareFile)
        val btnDeleteFile: TextView = itemView.findViewById(R.id.btnDeleteFile)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_downloaded_file, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val item = items[position]

        holder.tvFileEmoji.text = item.emoji
        holder.tvFileName.text = item.name
        holder.tvFileInfo.text = "${item.sizeText} • ${dateFormat.format(Date(item.lastModified))}"

        holder.itemView.setOnClickListener {
            onOpenClick(item)
        }

        holder.btnShareFile.setOnClickListener {
            onShareClick(item)
        }

        holder.btnDeleteFile.setOnClickListener {
            onDeleteClick(item)
        }
    }

    override fun getItemCount(): Int = items.size

    /**
     * Cập nhật danh sách tệp mới khi người dùng tải thêm hoặc xoá bớt.
     */
    fun updateList(newItems: List<DownloadedFile>) {
        this.items = newItems
        notifyDataSetChanged()
    }
}

