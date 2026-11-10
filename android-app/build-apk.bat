@echo off
chcp 65001 >nul
title Dong Goi Ung Dung Android - Download Video & Image (.APK)

echo =====================================================================
echo    DONG GOI UNG DUNG ANDROID NATIVE (.APK) - 100%% DOC LAP
echo    Download Video & Image cho dien thoai Android
echo =====================================================================
echo.

cd /d "%~dp0"

:: 1. Kiem tra Java JDK
echo [1/4] Kiem tra moi truong Java JDK...
where javac.exe >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [THONG BAO] Khong tim thay javac.exe trong PATH he thong.
    echo Neu may chua co JDK 17, ban co the:
    echo   - Cai dat Android Studio (da bao gom san JDK va Android SDK):
    echo     https://developer.android.com/studio
    echo   - Hoac mo truc tiep thu muc 'android-app' bang Android Studio,
    echo     bam Build ^> Build Bundle(s) / APK(s) ^> Build APK(s).
    echo.
) else (
    echo [OK] Da tim thay Java JDK.
)

:: 2. Chuan bi thu muc xuat file APK
echo.
echo [2/4] Chuan bi thu muc xuat APK (android-app/dist)...
if not exist "dist" mkdir "dist"

:: 3. Thuc thi dong goi APK qua Gradle
echo.
echo [3/4] Dang thuc thi dong goi ung dung...
if exist "gradlew.bat" (
    call gradlew.bat assembleDebug
    if exist "app\build\outputs\apk\debug\app-debug.apk" (
        copy /y "app\build\outputs\apk\debug\app-debug.apk" "dist\DownloadVideoImage.apk" >nul
        echo [THANH CONG] Da tao file APK thanh cong tai:
        echo   %~dp0dist\DownloadVideoImage.apk
    )
) else (
    echo [HUONG DAN DONG GOI NHANH QUA ANDROID STUDIO]:
    echo 1. Mo Android Studio.
    echo 2. Chon Open Project ^> Chon thu muc 'android-app'.
    echo 3. Cho Gradle sync xong ^> Chon Menu 'Build' ^> 'Build APK(s)'.
    echo 4. File APK se xuat hien de chep vao dien thoai cai dat ngay.
)

:: 4. Huong dan cai dat vao dien thoai
echo.
echo =====================================================================
echo    HUONG DAN CAI DAT FILE .APK VAO DIEN THOAI:
echo    1. Gui file .apk qua Zalo (gui file truyen file), Google Drive,
echo       hoac cam cap USB copy vao bo nho dien thoai.
echo    2. Tren dien thoai, bam vao file .apk va chon 'Cai dat'.
echo       (Neu may hoi 'Cho phep nguon nay', chon 'Cho phep').
echo    3. Mo ung dung 'Download Video', chon YouTube/Facebook/Instagram
echo       hoac dan link video bat ky de thuong thuc va tai ve!
echo =====================================================================
echo.
pause
