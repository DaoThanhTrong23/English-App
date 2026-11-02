@echo off
chcp 65001 >nul
title KHOI DONG HE THONG CHIA SE TU XA (REMOTE SHARE)
echo ==============================================================
echo     KHOI DONG TOAN BO HE THONG CHIA SE CHO BAN BE TU XA
echo ==============================================================
echo.
echo 1. Dang khoi dong Backend API (Port 3000)...
start "Backend API (Port 3000)" cmd /k "cd /d D:\KLCN_UngDungHocTiengAnh\English_App\backend-api && npm run dev"

timeout /t 3 /nobreak >nul

echo 2. Dang bat Ngrok Tunnel cho Backend API...
start "Backend Ngrok Tunnel" cmd /k "cd /d D:\KLCN_UngDungHocTiengAnh\English_App\backend-api && node scripts/tunnel.cjs"

timeout /t 4 /nobreak >nul

echo 3. Dang khoi dong Web Admin (Port 5173)...
start "Web Admin (Port 5173)" cmd /k "cd /d D:\KLCN_UngDungHocTiengAnh\English_App\web-english && npm run dev"

timeout /t 3 /nobreak >nul

echo 4. Dang bat Cloudflare Tunnel cho Web Admin...
start "Web Admin Cloudflare Tunnel" cmd /k "cd /d D:\KLCN_UngDungHocTiengAnh\English_App\web-english && npx --yes cloudflared tunnel --url http://localhost:5173"

echo.
echo ==============================================================
echo            KHOI DONG HE THONG TU XA THANH CONG!
echo ==============================================================
echo - Copy link tai cua so [Web Admin Cloudflare Tunnel] gui cho ban be.
echo - Mobile App tren dien thoai co the mo va su dung qua 4G/Wifi.
echo ==============================================================
pause
