param(
    [switch]$AutoDownloadTools = $false
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$appDir = $PSScriptRoot
$binDir = Join-Path $appDir "bin"
$distDir = Join-Path $appDir "dist"

if (-not (Test-Path $distDir)) {
    New-Item -ItemType Directory -Path $distDir -Force | Out-Null
}

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "   DONG GOI UNG DUNG ANDROID (.APK) - DOWNLOAD VIDEO & IMAGE" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# -----------------------------------------------------------------------------
# 1. TIM KIEM MOI TRUONG JAVA JDK (YEU CAU JDK 17 TRO LEN)
# -----------------------------------------------------------------------------
Write-Host "[1/4] Kiem tra Java JDK 17+..." -ForegroundColor Yellow

$jdkPath = $null

if ($env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME "bin\javac.exe"))) {
    $jdkPath = $env:JAVA_HOME
}

if (-not $jdkPath) {
    $javacCmd = Get-Command javac.exe -ErrorAction SilentlyContinue
    if ($javacCmd) {
        $jdkPath = Split-Path (Split-Path $javacCmd.Source -Parent) -Parent
    }
}

if (-not $jdkPath) {
    $potentialJdkDirs = @(
        "D:\Setup\Build_SDK_Mobile",
        "D:\Setup\Build_SDK_Mobile\Android\Android Studio\jbr",
        "C:\Program Files\Java",
        "C:\Program Files\Eclipse Adoptium",
        "C:\Program Files\Microsoft\jdk*",
        "C:\Program Files\Android\Android Studio\jbr",
        "C:\Program Files\Android\Android Studio\jre",
        "$env:LOCALAPPDATA\Programs\Eclipse Adoptium"
    )
    foreach ($pat in $potentialJdkDirs) {
        $found = Get-Item $pat -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1
        if ($found) {
            if (Test-Path (Join-Path $found.FullName "bin\javac.exe")) {
                $jdkPath = $found.FullName
                break
            }
            $sub = Get-ChildItem $found.FullName -Directory -ErrorAction SilentlyContinue | Where-Object { Test-Path (Join-Path $_.FullName "bin\javac.exe") } | Select-Object -First 1
            if ($sub) {
                $jdkPath = $sub.FullName
                break
            }
        }
    }
}

if (-not $jdkPath -and (Test-Path (Join-Path $binDir "jdk-17\bin\javac.exe"))) {
    $jdkPath = Join-Path $binDir "jdk-17"
}

if ($jdkPath) {
    $env:JAVA_HOME = $jdkPath
    $env:PATH = "$jdkPath\bin;" + $env:PATH
    Write-Host "[OK] Da tim thay Java JDK tai: $jdkPath" -ForegroundColor Green
} else {
    Write-Host "[!] Chua tim thay Java JDK 17 tren may." -ForegroundColor DarkYellow
}

# -----------------------------------------------------------------------------
# 2. TIM KIEM ANDROID STUDIO & ANDROID SDK
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "[2/4] Kiem tra Android Studio & Android SDK..." -ForegroundColor Yellow

# Kiểm tra Android Studio đã cài đặt
$studioExe = $null
$potentialStudioDirs = @(
    "D:\Setup\Build_SDK_Mobile\Android\Android Studio\bin\studio64.exe",
    "C:\Program Files\Android\Android Studio\bin\studio64.exe",
    "$env:LOCALAPPDATA\Programs\Android Studio\bin\studio64.exe"
)
foreach ($exe in $potentialStudioDirs) {
    if (Test-Path $exe) {
        $studioExe = $exe
        break
    }
}

if ($studioExe) {
    Write-Host "[OK] Da tim thay Android Studio tai: $studioExe" -ForegroundColor Green
}

# Kiểm tra Android SDK
$sdkPath = $null
$potentialSdkDirs = @(
    "D:\Setup\Build_SDK_Mobile\Android\Sdk",
    "D:\Setup\Build_SDK_Mobile\Sdk",
    "D:\Setup\Build_SDK_Mobile\android-sdk",
    $env:ANDROID_HOME,
    $env:ANDROID_SDK_ROOT,
    (Join-Path $env:LOCALAPPDATA "Android\Sdk"),
    "D:\Android\Sdk",
    "C:\Android\Sdk",
    (Join-Path $binDir "android-sdk")
)

foreach ($dir in $potentialSdkDirs) {
    if ($dir -and (Test-Path $dir)) {
        $hasTools = (Test-Path (Join-Path $dir "platform-tools")) -or (Test-Path (Join-Path $dir "platforms")) -or (Test-Path (Join-Path $dir "build-tools"))
        if ($hasTools) {
            $sdkPath = $dir
            break
        }
    }
}

# Nếu có thư mục Sdk trống hoặc chỉ mới tạo
if (-not $sdkPath) {
    foreach ($dir in $potentialSdkDirs) {
        if ($dir -and (Test-Path $dir)) {
            $sdkPath = $dir
            break
        }
    }
}

if ($sdkPath) {
    $env:ANDROID_HOME = $sdkPath
    $env:ANDROID_SDK_ROOT = $sdkPath
    Write-Host "[OK] Da tim thay Android SDK tai: $sdkPath" -ForegroundColor Green

    $localProp = Join-Path $appDir "local.properties"
    $escapedSdk = $sdkPath.Replace('\', '/')
    "sdk.dir=$escapedSdk" | Set-Content -Path $localProp -Encoding UTF8
} else {
    Write-Host "[!] Chua tim thay Android SDK tren may." -ForegroundColor DarkYellow
}

# -----------------------------------------------------------------------------
# 3. NEU CO ANDROID STUDIO NHUNG CHUA TAI SDK
# -----------------------------------------------------------------------------
if (-not $sdkPath -and $studioExe) {
    Write-Host ""
    Write-Host "=====================================================================" -ForegroundColor Yellow
    Write-Host "  DA TIM THAY ANDROID STUDIO NHUNG CHUA HOAN TAT TAI ANDROID SDK." -ForegroundColor Yellow
    Write-Host "=====================================================================" -ForegroundColor Yellow
    Write-Host "Khi cai Android Studio lan dau tu bo cai .exe, ban can mo Android Studio len 1 lan"
    Write-Host "de hop thoai Setup Wizard tu dong tai bo Android SDK (khoang 1-2 phut)."
    Write-Host ""
    Write-Host "Cac buoc cuc ky don gian:" -ForegroundColor Cyan
    Write-Host "  1. Mo Android Studio."
    Write-Host "  2. Bam 'Next' -> Chon 'Standard' -> Bam 'Next' (Android Studio se tai SDK)."
    Write-Host "  3. Khi tai xong, bam 'Finish'."
    Write-Host "  4. Chay lai file build-apk.bat nay de dong goi file .apk ngay lap tuc!"
    Write-Host "=====================================================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Ban co muon tu dong mo Android Studio ngay bay gio khong? (Y/N, mac dinh Y): " -NoNewline -ForegroundColor Green
    $ans = Read-Host
    if (-not $ans -or $ans.Trim().ToUpper() -eq "Y") {
        Write-Host "Dang khoi chay Android Studio..." -ForegroundColor Cyan
        Start-Process "$studioExe"
    }
    exit 0
}

# -----------------------------------------------------------------------------
# 4. NEU THIEU CA MOI TRUONG, DUA RA HUONG DAN CHI TIET
# -----------------------------------------------------------------------------
if (-not $jdkPath -or -not $sdkPath) {
    Write-Host ""
    Write-Host "=====================================================================" -ForegroundColor Yellow
    Write-Host "  MAY CHUA CO SAN MOI TRUONG ANDROID SDK / JDK DE BUILD BANG LENH." -ForegroundColor Yellow
    Write-Host "=====================================================================" -ForegroundColor Yellow
    Write-Host "Ban co 2 cach cuc ky don gian de build file .apk:"
    Write-Host ""
    Write-Host " [CACH 1 - KHUYEN DUNG]: Dung Android Studio (Co san giao dien truc quan)" -ForegroundColor Cyan
    Write-Host "   1. Mo Android Studio tu: $studioExe"
    Write-Host "   2. Chon 'Open' -> Chon thu muc: $appDir"
    Write-Host "   3. Cho dong bo xong -> Chon Menu 'Build' -> 'Build APK(s)'."
    Write-Host ""
    Write-Host " [CACH 2]: Cai dat nhanh Java JDK 17:" -ForegroundColor Cyan
    Write-Host "   - Tai bo cai JDK 17 tai: https://adoptium.net/temurin/releases/?version=17"
    Write-Host "   - Cai dat xong thi chay lai file build-apk.bat nay."
    Write-Host "=====================================================================" -ForegroundColor Yellow
    Write-Host ""
    exit 0
}

# -----------------------------------------------------------------------------
# 5. THUC THI BUILD FILE APK QUA GRADLE
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "[3/4] Dang thuc thi dong goi ung dung..." -ForegroundColor Yellow

Set-Location -Path $appDir

$gradleCmd = "gradle"
if (Test-Path "gradlew.bat") {
    $gradleCmd = ".\gradlew.bat"
} else {
    $systemGradle = Get-Command gradle.exe -ErrorAction SilentlyContinue
    if ($systemGradle) {
        $gradleCmd = "gradle"
    } else {
        $gradleHome = Join-Path $binDir "gradle"
        $localGradleBat = Join-Path $gradleHome "bin\gradle.bat"
        if (-not (Test-Path $localGradleBat)) {
            Write-Host "Dang tai Gradle 8.2 portable..." -ForegroundColor Cyan
            $gradleZip = Join-Path $env:TEMP "gradle-8.2-bin.zip"
            Invoke-WebRequest -Uri "https://services.gradle.org/distributions/gradle-8.2-bin.zip" -OutFile $gradleZip -UseBasicParsing
            Expand-Archive -Path $gradleZip -DestinationPath $binDir -Force
            Remove-Item $gradleZip -Force -ErrorAction SilentlyContinue
            $extracted = Get-ChildItem $binDir -Directory -Filter "gradle-8.2*" | Select-Object -First 1
            if ($extracted) {
                Rename-Item $extracted.FullName "gradle" -Force
            }
        }
        $gradleCmd = $localGradleBat
    }
}

Write-Host "Dang chay: $gradleCmd assembleDebug..." -ForegroundColor Cyan
& $gradleCmd assembleDebug

# Kiem tra file output
$generatedApk = Join-Path $appDir "app\build\outputs\apk\debug\app-debug.apk"
$targetApk = Join-Path $distDir "DownloadVideoImage.apk"

if (Test-Path $generatedApk) {
    Copy-Item -Path $generatedApk -Destination $targetApk -Force
    $fileSizeMB = [math]::Round(((Get-Item $targetApk).Length / 1MB), 2)

    Write-Host ""
    Write-Host "=====================================================================" -ForegroundColor Green
    Write-Host "  DONG GOI THANH CONG FILE APK! ($fileSizeMB MB)" -ForegroundColor Green
    Write-Host "=====================================================================" -ForegroundColor Green
    Write-Host "File APK da san sang tai:"
    Write-Host "  $targetApk" -ForegroundColor White
    Write-Host ""
    Write-Host "HUONG DAN CAI DAT VAO DIEN THOAI:" -ForegroundColor Cyan
    Write-Host "  1. Gui file 'DownloadVideoImage.apk' qua Zalo (gui file), Drive, hoac cam cap USB."
    Write-Host "  2. Tren dien thoai, bam vao file .apk va chon 'Cai dat'."
    Write-Host "  3. Mo ung dung 'Download Video', chon YouTube/Facebook/Instagram va tai video ngay!"
    Write-Host "=====================================================================" -ForegroundColor Green
    Write-Host ""

    explorer.exe "/select,$targetApk"
} else {
    Write-Host "[!] Khong tim thay file APK sau khi build. Vui long kiem tra log build o tren." -ForegroundColor Red
}
