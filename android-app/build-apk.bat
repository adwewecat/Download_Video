@echo off
chcp 65001 >nul
title "Dong Goi Ung Dung Android - Download Video & Image (.APK)"

cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-apk.ps1"
