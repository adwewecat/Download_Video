<#
.SYNOPSIS
  setup.ps1 - Kịch bản cài đặt tự động cho Download_Video_Image Native Helper.
  Tự động tải yt-dlp, ffmpeg, Deno; sinh manifest host; và đăng ký Registry Chrome.
#>

[System.Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'

[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

$ScriptDir = $PSScriptRoot
$BinDir = Join-Path $ScriptDir "bin"
New-Item -ItemType Directory -Force -Path $BinDir | Out-Null

Import-Module (Join-Path $ScriptDir "HostUtils.psm1") -Force

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   CAI DAT NATIVE HELPER - DOWNLOAD VIDEO & IMAGE         " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

function Download-Asset {
  param (
    [string]$Url,
    [string]$OutFile,
    [string]$Description
  )

  if (Test-Path $OutFile) {
    Write-Host "[OK] $Description da co san." -ForegroundColor Green
    return
  }

  Write-Host "[..] Dang tai $Description..." -ForegroundColor Yellow
  $curlExe = (Get-Command curl.exe -ErrorAction SilentlyContinue)
  if ($curlExe) {
    & $curlExe.Source -fL --retry 3 --connect-timeout 30 --progress-bar -o $OutFile $Url
    if ($LASTEXITCODE -ne 0) {
      throw "Loi tai $Description qua curl (exit code $LASTEXITCODE)"
    }
  } else {
    Invoke-WebRequest -Uri $Url -OutFile $OutFile -UseBasicParsing
  }

  if (-not (Test-Path $OutFile)) {
    throw "Khong tim thay file sau khi tai: $OutFile"
  }
}

# 1. Tải yt-dlp.exe
$ytdlpExe = Join-Path $BinDir "yt-dlp.exe"
Download-Asset `
  -Url "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" `
  -OutFile $ytdlpExe `
  -Description "yt-dlp.exe (bo tai video da nang)"

# 2. Tải ffmpeg.exe & ffprobe.exe
$ffmpegExe = Join-Path $BinDir "ffmpeg.exe"
$ffprobeExe = Join-Path $BinDir "ffprobe.exe"
if (-not (Test-Path $ffmpegExe) -or -not (Test-Path $ffprobeExe)) {
  $tempZip = Join-Path $env:TEMP "dvi-ffmpeg-$([guid]::NewGuid().ToString('N')).zip"
  $tempExtract = Join-Path $env:TEMP "dvi-ffmpeg-extract-$([guid]::NewGuid().ToString('N'))"
  try {
    Download-Asset `
      -Url "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip" `
      -OutFile $tempZip `
      -Description "ffmpeg (bo gop video & am thanh chat luong cao)"

    Write-Host "[..] Dang giai nen ffmpeg..." -ForegroundColor Yellow
    Expand-Archive -Path $tempZip -DestinationPath $tempExtract -Force

    $foundFfmpeg = Get-ChildItem -Path $tempExtract -Filter "ffmpeg.exe" -Recurse | Select-Object -First 1
    $foundFfprobe = Get-ChildItem -Path $tempExtract -Filter "ffprobe.exe" -Recurse | Select-Object -First 1

    if ($foundFfmpeg) {
      Copy-Item -Path $foundFfmpeg.FullName -Destination $ffmpegExe -Force
    }
    if ($foundFfprobe) {
      Copy-Item -Path $foundFfprobe.FullName -Destination $ffprobeExe -Force
    }
    Write-Host "[OK] Da cai dat ffmpeg.exe va ffprobe.exe vao bin/." -ForegroundColor Green
  } finally {
    Remove-Item $tempZip -Force -ErrorAction SilentlyContinue
    Remove-Item $tempExtract -Recurse -Force -ErrorAction SilentlyContinue
  }
} else {
  Write-Host "[OK] ffmpeg.exe va ffprobe.exe da co san." -ForegroundColor Green
}

# 3. Tải Deno runtime (phục vụ giải mã YouTube mới nhất)
$denoExe = Join-Path $BinDir "deno.exe"
if (-not (Test-Path $denoExe)) {
  $tempZipDeno = Join-Path $env:TEMP "dvi-deno-$([guid]::NewGuid().ToString('N')).zip"
  $tempExtractDeno = Join-Path $env:TEMP "dvi-deno-extract-$([guid]::NewGuid().ToString('N'))"
  try {
    # Lấy phiên bản mới nhất từ dl.deno.land CDN chính thức
    $denoVer = $null
    try {
      $denoVer = ((curl.exe -s --connect-timeout 10 "https://dl.deno.land/release-latest.txt") | Out-String).Trim()
    } catch {}

    $denoUrl = if ($denoVer -and $denoVer.StartsWith("v")) {
      "https://dl.deno.land/release/$denoVer/deno-x86_64-pc-windows-msvc.zip"
    } else {
      "https://github.com/denoland/deno/releases/latest/download/deno-x86_64-pc-windows-msvc.zip"
    }

    Download-Asset `
      -Url $denoUrl `
      -OutFile $tempZipDeno `
      -Description "Deno JS engine (ho tro giai ma YouTube moi nhat)"

    Write-Host "[..] Dang giai nen deno.exe..." -ForegroundColor Yellow
    Expand-Archive -Path $tempZipDeno -DestinationPath $tempExtractDeno -Force

    $foundDeno = Get-ChildItem -Path $tempExtractDeno -Filter "deno.exe" -Recurse | Select-Object -First 1
    if ($foundDeno) {
      Copy-Item -Path $foundDeno.FullName -Destination $denoExe -Force
    }
    Write-Host "[OK] Da cai dat deno.exe vao bin/." -ForegroundColor Green
  } finally {
    Remove-Item $tempZipDeno -Force -ErrorAction SilentlyContinue
    Remove-Item $tempExtractDeno -Recurse -Force -ErrorAction SilentlyContinue
  }
} else {
  Write-Host "[OK] deno.exe da co san." -ForegroundColor Green
}

# 4. Tạo manifest đăng ký Native Messaging Host
$manifestPath = Join-Path $ScriptDir "..\extension\manifest.json"
if (-not (Test-Path $manifestPath)) {
  throw "Khong tim thay extension manifest tai $manifestPath"
}

$extManifest = Get-Content $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$extId = Get-ExtensionIdFromKey -Base64Key $extManifest.key

$hostBat = Join-Path $ScriptDir "host.bat"
$hostManifestFile = Join-Path $ScriptDir "com.adwewecat.download_video.json"

$hostConfig = [ordered]@{
  name            = "com.adwewecat.download_video"
  description     = "Download Video & Image Native Messaging Host"
  path            = $hostBat
  type            = "stdio"
  allowed_origins = @(
    "chrome-extension://$extId/"
  )
}

$hostConfigJson = $hostConfig | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText($hostManifestFile, $hostConfigJson, (New-Object System.Text.UTF8Encoding $false))
Write-Host "[OK] Da tao manifest host tai: $hostManifestFile" -ForegroundColor Green

# 5. Đăng ký Native Host vao Windows Registry (HKCU - khong can quyen Admin)
$regPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.adwewecat.download_video"
if (-not (Test-Path $regPath)) {
  New-Item -Path $regPath -Force | Out-Null
}
Set-ItemProperty -Path $regPath -Name "(Default)" -Value $hostManifestFile | Out-Null
Write-Host "[OK] Da dang ky host vao Registry Chrome (HKCU): $regPath" -ForegroundColor Green

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   HOAN TAT CAI DAT NATIVE HELPER!                       " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  Extension ID : $extId" -ForegroundColor White
Write-Host "  Host Manifest: $hostManifestFile" -ForegroundColor White
Write-Host "  yt-dlp       : $ytdlpExe" -ForegroundColor White
Write-Host "  ffmpeg       : $ffmpegExe" -ForegroundColor White
Write-Host "  Deno         : $denoExe" -ForegroundColor White
Write-Host ""
Write-Host "Luu y: Hay vao chrome://extensions va bam bieu tuong TAI LAI (Reload) extension." -ForegroundColor Yellow
Write-Host ""

