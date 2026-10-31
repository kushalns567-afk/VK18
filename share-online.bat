@echo off
title Share Online - Remote Peer Connection
echo ==============================================================================
echo  Real-Time Confusion-Aware Interactive Tutor & Peer Platform
echo  Generating Secure Public HTTPS Link for Long-Distance Peer Connection...
echo ==============================================================================
echo.
echo Your Public IP (if asked for Tunnel Password on the webpage):
curl -s https://api.ipify.org
echo.
echo ==============================================================================
echo  Launching Public HTTPS Tunnel on port 3000...
echo  Share the HTTPS link printed below with your friend!
echo  (Keep this window open while you and your friend are connected)
echo ==============================================================================
echo.
:loop
cmd /c "npx --yes localtunnel --port 3000"
echo.
echo Tunnel disconnected. Reconnecting in 3 seconds...
timeout /t 3 >nul
goto loop
