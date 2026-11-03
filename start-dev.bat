@echo off
chcp 65001 >nul
title KHOI DONG DANG PHAT TRIEN (LOCAL DEV)
echo ==============================================================
echo       KHOI DONG TOAN BO DU AN ENGLISH APP (LOCAL DEV)
echo ==============================================================
echo.
echo 1. Dang khoi dong Backend API (port 3000)...
start "Backend API (Port 3000)" cmd /k "cd /d D:\KLCN_UngDungHocTiengAnh\English_App\backend-api && npm run dev"

timeout /t 3 /nobreak >nul

echo 2. Dang khoi dong Web Admin (port 5173)...
start "Web Admin (Port 5173)" cmd /k "cd /d D:\KLCN_UngDungHocTiengAnh\English_App\web-english && npm run dev"

timeout /t 2 /nobreak >nul

echo 3. Dang khoi dong Mobile Expo (Metro Bundler)...
start "Mobile Expo" cmd /k "cd /d D:\KLCN_UngDungHocTiengAnh\English_App\mobile-english && npx expo start"

echo.
echo ==============================================================
echo   DA KHOI DONG XONG 3 UNG DUNG TRONG CAC CUA SO RIENG BIET!
echo ==============================================================
echo (Ban co the dong cua so nay, cac service van chay o cac tab rieng)
pause
