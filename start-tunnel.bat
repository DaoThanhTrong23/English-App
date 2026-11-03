@echo off
chcp 65001 >nul
title KHOI DONG NGROK TUNNEL CHO MOBILE
echo ======================================================
echo    DANG KHOI DONG NGROK TUNNEL CHO BACKEND API
echo ======================================================
cd /d "D:\KLCN_UngDungHocTiengAnh\English_App\backend-api"
node scripts/tunnel.cjs
pause
