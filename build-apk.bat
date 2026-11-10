@echo off
chcp 65001 >nul
title "Dong Goi Ung Dung Android - Download Video & Image (.APK)"

cd /d "%~dp0android-app"
call build-apk.bat
pause
