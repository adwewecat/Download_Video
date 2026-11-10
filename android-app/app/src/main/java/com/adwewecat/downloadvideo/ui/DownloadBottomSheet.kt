package com.adwewecat.downloadvideo.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import com.adwewecat.downloadvideo.R
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import com.google.android.material.card.MaterialCardView

/**
 * Bottom Sheet hiển thị các tuỳ chọn tải video/media trên thiết bị di động.
 * 3 chế độ: MP4 Tương thích (⬇), MAX (2K/4K) và MP3 (Âm thanh).
 */
class DownloadBottomSheet : BottomSheetDialogFragment() {

    private var onQualitySelected: ((quality: String) -> Unit)? = null
    private var mediaTitle: String = "Tải Video"
    private var mediaUrl: String = ""

    fun setMediaInfo(title: String, url: String, onSelected: (String) -> Unit) {
        this.mediaTitle = title
        this.mediaUrl = url
        this.onQualitySelected = onSelected
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.bottom_sheet_download, container, false)

        val tvTitle = view.findViewById<TextView>(R.id.tvSheetTitle)
        val tvUrlSnippet = view.findViewById<TextView>(R.id.tvMediaUrlSnippet)
        val cardCompatible = view.findViewById<MaterialCardView>(R.id.cardCompatible)
        val cardBest = view.findViewById<MaterialCardView>(R.id.cardBest)
        val cardMp3 = view.findViewById<MaterialCardView>(R.id.cardMp3)

        tvTitle.text = if (mediaTitle.isNotBlank()) mediaTitle else "Tải Video / Media"
        tvUrlSnippet.text = mediaUrl

        cardCompatible.setOnClickListener {
            dismiss()
            onQualitySelected?.invoke("compatible")
        }

        cardBest.setOnClickListener {
            dismiss()
            onQualitySelected?.invoke("best")
        }

        cardMp3.setOnClickListener {
            dismiss()
            onQualitySelected?.invoke("mp3")
        }

        return view
    }

    companion object {
        const val TAG = "DownloadBottomSheet"

        fun newInstance(
            title: String,
            url: String,
            onSelected: (String) -> Unit
        ): DownloadBottomSheet {
            val sheet = DownloadBottomSheet()
            sheet.setMediaInfo(title, url, onSelected)
            return sheet
        }
    }
}
