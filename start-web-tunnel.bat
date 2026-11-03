@echo off
chcp 65001 >nul
title KHOI DONG LOCALTUNNEL CO DINH CHO WEB ADMIN (PORT 5173)
echo ==============================================================
echo    KHOI TAO PUBLIC LINK CO DINH CHO WEB ADMIN (PORT 5173)
echo ==============================================================
echo.
echo Link co dinh cua ban la: https://english-admin-trong.loca.lt
echo.
echo Luu y:
echo 1. Hay dam bao ban da bat Backend API (port 3000) va Backend Tunnel.
echo 2. Hay dam bao ban da bat Web Admin: cd web-english ^&^& npm run dev
echo.
echo Dang khoi dong Localtunnel voi subdomain english-admin-trong...
echo ==============================================================
echo.
npx --yes localtunnel --port 5173 --subdomain english-admin-trong
pause
