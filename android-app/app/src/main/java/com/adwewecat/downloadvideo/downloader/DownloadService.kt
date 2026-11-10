package com.adwewecat.downloadvideo.downloader

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.FileProvider
import com.adwewecat.downloadvideo.utils.CookieUtils
import com.adwewecat.downloadvideo.utils.FFmpegInstaller
import com.adwewecat.downloadvideo.utils.StorageUtils
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.io.File

/**
 * Android Foreground Service quản lý tiến trình tải media ngầm trong nền.
 * Tự động cập nhật thanh tiến độ % lên notification và quét MediaStore khi hoàn thành.
 */
class DownloadService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private lateinit var notificationManager: NotificationManager

    override fun onCreate() {
        super.onCreate()
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val url = intent?.getStringExtra(EXTRA_URL) ?: return START_NOT_STICKY
        val platform = intent.getStringExtra(EXTRA_PLATFORM) ?: "web"
        val quality = intent.getStringExtra(EXTRA_QUALITY) ?: "compatible"
        val title = intent.getStringExtra(EXTRA_TITLE) ?: "Video"
        val referer = intent.getStringExtra(EXTRA_REFERER)
        val cookies = intent.getStringExtra(EXTRA_COOKIES) ?: CookieUtils.getCookiesForUrl(url)

        val notificationId = (System.currentTimeMillis() % 100000).toInt()

        Log.i(TAG, "Yêu cầu tải từ nền tảng: $platform | Tiêu đề: $title")
        startForeground(notificationId, buildProgressNotification(title, 0).build())

        serviceScope.launch {
            val outDir = StorageUtils.getDownloadDirectory()
            val ffmpegPath = FFmpegInstaller.getExecutablePath(this@DownloadService)

            Log.i(TAG, "Bắt đầu tải trong Background Service: $url | Chất lượng: $quality")

            YtDlpDownloader.download(
                context = this@DownloadService,
                url = url,
                quality = quality,
                referer = referer,
                cookies = cookies,
                outDir = outDir.absolutePath,
                ffmpegPath = ffmpegPath,
                onProgress = { percent ->
                    notificationManager.notify(
                        notificationId,
                        buildProgressNotification(title, percent).build()
                    )
                },
                onSuccess = { filePath ->
                    Log.i(TAG, "Tải hoàn tất: $filePath")
                    StorageUtils.scanMediaFile(this@DownloadService, filePath) { uri ->
                        showSuccessNotification(notificationId, title, filePath, uri)
                    }
                    stopForeground(STOP_FOREGROUND_DETACH)
                },
                onError = { err ->
                    Log.e(TAG, "Tải thất bại: $err")
                    showErrorNotification(notificationId, title, err)
                    stopForeground(STOP_FOREGROUND_DETACH)
                }
            )
        }

        return START_NOT_STICKY
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Tiến độ tải Video/Media",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Hiển thị tiến độ tải video và âm thanh từ web"
                setSound(null, null)
                enableVibration(false)
            }
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun buildProgressNotification(title: String, percent: Int): NotificationCompat.Builder {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Đang tải: $title")
            .setContentText(if (percent > 0) "Đang tải $percent%" else "Đang khởi tạo luồng tải...")
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setProgress(100, percent, percent == 0)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
    }

    private fun showSuccessNotification(notificationId: Int, title: String, filePath: String, uri: Uri?) {
        val file = File(filePath)
        val viewIntent = Intent(Intent.ACTION_VIEW).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
            if (uri != null) {
                setDataAndType(uri, if (filePath.endsWith(".mp3")) "audio/*" else "video/*")
            } else if (file.exists()) {
                val contentUri = FileProvider.getUriForFile(
                    this@DownloadService,
                    "${packageName}.fileprovider",
                    file
                )
                setDataAndType(contentUri, if (filePath.endsWith(".mp3")) "audio/*" else "video/*")
            }
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            notificationId,
            viewIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val successNotification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Tải thành công: ${title.take(30)}")
            .setContentText("${file.name} đã lưu vào Thư viện/Downloads")
            .setSmallIcon(android.R.drawable.stat_sys_download_done)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()

        notificationManager.notify(notificationId, successNotification)
    }

    private fun showErrorNotification(notificationId: Int, title: String, errorMsg: String) {
        val errorNotification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Tải thất bại: $title")
            .setContentText(errorMsg.take(120))
            .setSmallIcon(android.R.drawable.stat_notify_error)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()

        notificationManager.notify(notificationId, errorNotification)
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        private const val TAG = "DownloadService"
        const val CHANNEL_ID = "dvi_download_channel"

        const val EXTRA_URL = "extra_url"
        const val EXTRA_PLATFORM = "extra_platform"
        const val EXTRA_QUALITY = "extra_quality"
        const val EXTRA_TITLE = "extra_title"
        const val EXTRA_REFERER = "extra_referer"
        const val EXTRA_COOKIES = "extra_cookies"

        fun start(
            context: Context,
            url: String,
            platform: String = "web",
            quality: String = "compatible",
            title: String = "Video",
            referer: String? = null,
            cookies: String? = null
        ) {
            val intent = Intent(context, DownloadService::class.java).apply {
                putExtra(EXTRA_URL, url)
                putExtra(EXTRA_PLATFORM, platform)
                putExtra(EXTRA_QUALITY, quality)
                putExtra(EXTRA_TITLE, title)
                putExtra(EXTRA_REFERER, referer)
                putExtra(EXTRA_COOKIES, cookies)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }
    }
}

