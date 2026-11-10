package com.adwewecat.downloadvideo.ui

import android.app.AlertDialog
import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.core.content.FileProvider
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.adwewecat.downloadvideo.R
import com.adwewecat.downloadvideo.utils.DownloadedFile
import com.adwewecat.downloadvideo.utils.DownloadsScanner
import com.adwewecat.downloadvideo.utils.StorageUtils
import com.google.android.material.bottomsheet.BottomSheetDialogFragment

/**
 * Trình Quản Lý Tệp Đã Tải Xuống (Downloads BottomSheet) chuẩn phong cách Chrome.
 * Cho phép xem danh sách, mở phát (video/nhạc/ảnh), chia sẻ ra mạng xã hội, và xoá file.
 */
class DownloadsBottomSheet : BottomSheetDialogFragment() {

    private lateinit var rvDownloadedFiles: RecyclerView
    private lateinit var layoutEmptyDownloads: LinearLayout
    private lateinit var btnCloseDownloads: TextView

    private var adapter: DownloadedFilesAdapter? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.bottom_sheet_downloads, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        rvDownloadedFiles = view.findViewById(R.id.rvDownloadedFiles)
        layoutEmptyDownloads = view.findViewById(R.id.layoutEmptyDownloads)
        btnCloseDownloads = view.findViewById(R.id.btnCloseDownloads)

        rvDownloadedFiles.layoutManager = LinearLayoutManager(requireContext())
        btnCloseDownloads.setOnClickListener { dismiss() }

        refreshList()
    }

    /**
     * Quét lại thư mục Downloads và cập nhật danh sách tệp.
     */
    private fun refreshList() {
        val downloadDir = StorageUtils.getDownloadDirectory()
        val files = DownloadsScanner.scan(downloadDir)

        if (files.isEmpty()) {
            layoutEmptyDownloads.visibility = View.VISIBLE
            rvDownloadedFiles.visibility = View.GONE
        } else {
            layoutEmptyDownloads.visibility = View.GONE
            rvDownloadedFiles.visibility = View.VISIBLE

            if (adapter == null) {
                adapter = DownloadedFilesAdapter(
                    items = files,
                    onOpenClick = { openFile(it) },
                    onShareClick = { shareFile(it) },
                    onDeleteClick = { confirmDeleteFile(it) }
                )
                rvDownloadedFiles.adapter = adapter
            } else {
                adapter?.updateList(files)
            }
        }
    }

    /**
     * Mở phát tệp bằng ứng dụng thích hợp của điện thoại (VLC, Trình phát video, Thư viện ảnh, Trình phát nhạc).
     */
    private fun openFile(item: DownloadedFile) {
        try {
            val authority = "${requireContext().packageName}.fileprovider"
            val uri = FileProvider.getUriForFile(requireContext(), authority, item.file)

            val mimeType = when {
                item.isVideo -> "video/*"
                item.isAudio -> "audio/*"
                item.isImage -> "image/*"
                else -> "*/*"
            }

            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, mimeType)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            startActivity(Intent.createChooser(intent, "Mở bằng"))
        } catch (e: Exception) {
            Toast.makeText(requireContext(), "Không thể mở tệp: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    /**
     * Chia sẻ tệp media sang các ứng dụng khác (Zalo, Messenger, Drive,...).
     */
    private fun shareFile(item: DownloadedFile) {
        try {
            val authority = "${requireContext().packageName}.fileprovider"
            val uri = FileProvider.getUriForFile(requireContext(), authority, item.file)

            val mimeType = when {
                item.isVideo -> "video/*"
                item.isAudio -> "audio/*"
                item.isImage -> "image/*"
                else -> "*/*"
            }

            val intent = Intent(Intent.ACTION_SEND).apply {
                type = mimeType
                putExtra(Intent.EXTRA_STREAM, uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            startActivity(Intent.createChooser(intent, "Chia sẻ tệp qua"))
        } catch (e: Exception) {
            Toast.makeText(requireContext(), "Không thể chia sẻ tệp: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    /**
     * Hộp thoại xác nhận trước khi xoá tệp để tránh vô tình mất dữ liệu.
     */
    private fun confirmDeleteFile(item: DownloadedFile) {
        AlertDialog.Builder(requireContext())
            .setTitle("Xoá tệp?")
            .setMessage("Bạn có chắc chắn muốn xoá \"${item.name}\"?")
            .setPositiveButton("Xoá") { _, _ ->
                if (item.file.delete()) {
                    Toast.makeText(requireContext(), "Đã xoá tệp", Toast.LENGTH_SHORT).show()
                    refreshList()
                } else {
                    Toast.makeText(requireContext(), "Không thể xoá tệp", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Huỷ", null)
            .show()
    }
}

