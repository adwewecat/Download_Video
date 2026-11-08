<#
.SYNOPSIS
  host.ps1 - Chrome Native Messaging Host thực thi các tác vụ yt-dlp trên Windows.
  LƯU Ý: Tuyệt đối không xuất dữ liệu ra stdout bằng Write-Host / Write-Output,
  vì stdout là kênh truyền tin nhị phân chuẩn Native Messaging với Chrome.
#>

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$ScriptDir = $PSScriptRoot
Import-Module (Join-Path $ScriptDir "HostUtils.psm1") -Force

$stdin = [System.Console]::OpenStandardInput()
$stdout = [System.Console]::OpenStandardOutput()

try {
  $message = Read-NativeMessage -Stream $stdin
  if ($null -eq $message) {
    exit 0
  }

  $action = [string]$message.action

  if ($action -eq 'ping') {
    $binDir = Join-Path $ScriptDir "bin"
    $ytdlpPath = Join-Path $binDir "yt-dlp.exe"
    $ffmpegPath = Join-Path $binDir "ffmpeg.exe"
    $denoPath = Join-Path $binDir "deno.exe"

    $ytdlpVersion = $null
    if (Test-Path $ytdlpPath) {
      try {
        $p = Start-Process -FilePath $ytdlpPath -ArgumentList '--version' -NoNewWindow -PassThru -RedirectStandardOutput (Join-Path $env:TEMP "dvi-ver-$([guid]::NewGuid().ToString('N')).txt")
        $p.WaitForExit(3000) | Out-Null
        $tmpOut = (Join-Path $env:TEMP "dvi-ver-*.txt")
        $matchFile = Get-ChildItem $tmpOut | Select-Object -First 1
        if ($matchFile) {
          $ytdlpVersion = (Get-Content $matchFile.FullName -Raw -Encoding UTF8).Trim()
          Remove-Item $matchFile.FullName -Force -ErrorAction SilentlyContinue
        }
      } catch {
        $ytdlpVersion = "installed"
      }
    }

    $response = [ordered]@{
      type    = 'pong'
      version = '1.0.0'
      ytdlp   = $ytdlpVersion
      ffmpeg  = (Test-Path $ffmpegPath)
      deno    = (Test-Path $denoPath)
    }

    Write-NativeMessage -Stream $stdout -Object $response
    exit 0
  }

  if ($action -eq 'open_folder') {
    $targetPath = [string]$message.path
    if ($targetPath) {
      Open-FolderAndSelect -FilePath $targetPath
    }
    Write-NativeMessage -Stream $stdout -Object @{ type = 'ok' }
    exit 0
  }

  if ($action -eq 'download') {
    $url = [string]$message.url
    $quality = if ($message.quality) { [string]$message.quality } else { 'compatible' }
    $title = if ($message.title) { [string]$message.title } else { "" }
    $noPrompt = if ($message.noPrompt) { [bool]$message.noPrompt } else { $false }

    $binDir = Join-Path $ScriptDir "bin"
    $ytdlpExe = Join-Path $binDir "yt-dlp.exe"

    if (-not (Test-Path $ytdlpExe)) {
      Write-NativeMessage -Stream $stdout -Object @{
        type    = 'error'
        message = 'Chua cai trinh ho tro - hay chay native-host\setup.bat'
      }
      exit 0
    }

    # Tự động cập nhật yt-dlp & Deno tối đa 1 lần/ngày
    try {
      $updateLockFile = Join-Path $binDir "last-update.txt"
      $todayStr = (Get-Date).ToString("yyyy-MM-dd")
      $lastUpdate = if (Test-Path $updateLockFile) { (Get-Content $updateLockFile -Raw -ErrorAction SilentlyContinue).Trim() } else { "" }

      if ($lastUpdate -ne $todayStr) {
        [System.IO.File]::WriteAllText($updateLockFile, $todayStr, [System.Text.Encoding]::UTF8)
        # Chạy ngầm không chặn tiến trình tải
        Start-Process -FilePath $ytdlpExe -ArgumentList '-U' -WindowStyle Hidden -ErrorAction SilentlyContinue | Out-Null
        $denoExe = Join-Path $binDir "deno.exe"
        if (Test-Path $denoExe) {
          Start-Process -FilePath $denoExe -ArgumentList 'upgrade' -WindowStyle Hidden -ErrorAction SilentlyContinue | Out-Null
        }
      }
    } catch {
      # Bỏ qua lỗi tự cập nhật
    }

    $outDir = Get-DownloadsFolder
    $outTemplate = '%(title).150B [%(id)s].%(ext)s'

    # Hiển thị hộp thoại Save As để người dùng chọn thư mục và đặt tên file nếu muốn
    if (-not $noPrompt) {
      $fileExt = if ($quality -eq 'mp3') { 'mp3' } else { 'mp4' }
      $defaultFileName = if ($title) {
        Get-SanitizedFileName -Title $title -Ext $fileExt
      } else {
        if ($fileExt -eq 'mp3') { "audio.mp3" } else { "video.mp4" }
      }
      $dialogTitle = if ($fileExt -eq 'mp3') { "Chọn nơi lưu âm thanh MP3..." } else { "Chọn nơi lưu video..." }
      $chosenFile = Show-SaveFileDialog -InitialDir $outDir -DefaultFileName $defaultFileName -Title $dialogTitle -Ext $fileExt
      if (-not $chosenFile) {
        # Người dùng bấm Cancel trên hộp thoại Save As
        Write-NativeMessage -Stream $stdout -Object @{
          type    = 'cancelled'
          message = 'Nguoi dung da huy tai'
        }
        exit 0
      }

      $outDir = [System.IO.Path]::GetDirectoryName($chosenFile)
      $chosenBase = [System.IO.Path]::GetFileNameWithoutExtension($chosenFile)
      $outTemplate = "$chosenBase.%(ext)s"
    }

    # Chuẩn bị file cookie tạm nếu có (UTF-8 không BOM)
    $cookieFile = $null
    if ($message.cookies -and $message.cookies.Count -gt 0) {
      $cookieFile = Join-Path $env:TEMP "dvi-cookies-$([guid]::NewGuid().ToString('N')).txt"
      $cookieText = ConvertTo-NetscapeCookieText -Cookies $message.cookies
      [System.IO.File]::WriteAllText($cookieFile, $cookieText, (New-Object System.Text.UTF8Encoding $false))
    }

    try {
      $argsList = Get-YtDlpArguments -Url $url -OutDir $outDir -CookieFile $cookieFile -Quality $quality -OutTemplate $outTemplate
      $argsString = Join-ProcessArguments -Arguments $argsList

      $psi = New-Object System.Diagnostics.ProcessStartInfo
      $psi.FileName = $ytdlpExe
      $psi.Arguments = $argsString
      $psi.UseShellExecute = $false
      $psi.CreateNoWindow = $true
      $psi.RedirectStandardOutput = $true
      $psi.RedirectStandardError = $true
      $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
      $psi.StandardErrorEncoding = [System.Text.Encoding]::UTF8

      # Đảm bảo ffmpeg và deno trong bin/ được ưu tiên trong PATH
      $origPath = $psi.EnvironmentVariables['PATH']
      $psi.EnvironmentVariables['PATH'] = "$binDir;$origPath"

      $process = New-Object System.Diagnostics.Process
      $process.StartInfo = $psi

      $null = $process.Start()
      $stderrTask = $process.StandardError.ReadToEndAsync()

      $lastPercent = -1.0
      $finalFile = $null
      $metaInfo = $null

      # Đọc stdout dòng theo dòng
      while (-not $process.StandardOutput.EndOfStream) {
        $line = $process.StandardOutput.ReadLine()
        if (-not $line) { continue }

        $pct = Get-ProgressPercent -Line $line
        if ($null -ne $pct) {
          if (($pct - $lastPercent -ge 1.0) -or ($pct -eq 100.0)) {
            $lastPercent = $pct
            Write-NativeMessage -Stream $stdout -Object @{
              type    = 'progress'
              percent = $pct
            }
          }
        }

        $filePath = Get-FinalFilePath -Line $line
        if ($null -ne $filePath) {
          $finalFile = $filePath
        }

        $meta = Get-MetaInfo -Line $line
        if ($null -ne $meta) {
          $metaInfo = $meta
        }
      }

      $process.WaitForExit()
      $stderrOutput = if ($stderrTask) { $stderrTask.Result } else { "" }

      if ($process.ExitCode -eq 0 -and $finalFile) {
        $donePayload = [ordered]@{
          type = 'done'
          file = $finalFile
        }
        if ($metaInfo) {
          $donePayload.vcodec = $metaInfo.vcodec
          $donePayload.height = $metaInfo.height
        }
        Write-NativeMessage -Stream $stdout -Object $donePayload
      } else {
        # Trích xuất lỗi từ stderr
        $errorMsg = ""
        $errLines = $stderrOutput -split "`r?`n"
        for ($i = $errLines.Length - 1; $i -ge 0; $i--) {
          $l = $errLines[$i]
          if ($l -match 'ERROR:\s*(.*)$') {
            $errorMsg = $matches[1].Trim()
            break
          }
        }
        if (-not $errorMsg) {
          $errorMsg = "yt-dlp kết thúc với mã lỗi $($process.ExitCode)"
        }

        Write-NativeMessage -Stream $stdout -Object @{
          type    = 'error'
          message = $errorMsg
        }
      }
    } finally {
      # Xoá file cookie tạm ngay lập tức khi hoàn tất hoặc gặp lỗi
      if ($cookieFile -and (Test-Path $cookieFile)) {
        Remove-Item $cookieFile -Force -ErrorAction SilentlyContinue
      }
    }

    exit 0
  }

  # Lệnh không nhận diện
  Write-NativeMessage -Stream $stdout -Object @{
    type    = 'error'
    message = "Lenh khong hop le: $action"
  }
} catch {
  try {
    $errText = $_.Exception.ToString()
    $debugLog = Join-Path $env:TEMP "dvi-native-host.log"
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    [System.IO.File]::AppendAllText($debugLog, "[$timestamp] ERROR: $errText`r`n", [System.Text.Encoding]::UTF8)
  } catch {}

  try {
    Write-NativeMessage -Stream $stdout -Object @{
      type    = 'error'
      message = $_.Exception.Message
    }
  } catch {}
}
