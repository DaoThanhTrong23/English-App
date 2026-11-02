@echo off
chcp 65001 >nul
title KHOI DONG TUNNEL CHO WEB ADMIN (VITE PORT 5173)
echo ======================================================
echo    KHOI TAO PUBLIC LINK CHO WEB ADMIN (PORT 5173)
echo ======================================================
echo.
echo Luu y:
echo 1. Hay dam bao ban da bat Backend API (port 3000) va Backend Tunnel.
echo 2. Hay dam bao ban da bat Web Admin: cd web-english ^&^& npm run dev
echo.
echo Dang khoi tao Cloudflare Tunnel cong khai...
echo (Link se hien thi o dong: "Your quick Tunnel has been created! URL: ...")
echo ======================================================
echo.
npx --yes cloudflared tunnel --url http://localhost:5173
pause
