@echo off
chcp 65001 >nul
title DONG TAT CA DICH VU ENGLISH APP
echo ==============================================================
echo           DANG DUNG TAT CA DICH VU ENGLISH APP...
echo ==============================================================
echo.

taskkill /F /IM node.exe /T 2>nul
taskkill /F /IM cloudflared.exe /T 2>nul
taskkill /F /IM ngrok.exe /T 2>nul

echo.
echo [OK] Da dong sach tat ca cac tien trinh Node, Tunnel va Expo.
echo Cac cong 3000, 5173, 8081 da duoc giai phong!
echo.
pause
