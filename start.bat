@echo off
chcp 65001 > nul
echo.
echo  ╔══════════════════════════════════════╗
echo  ║   💕  DỰ ÁN TÌNH YÊU - LAUNCHER     ║
echo  ╚══════════════════════════════════════╝
echo.

:: Thử Node.js http-server
where node >nul 2>&1
if %errorlevel% == 0 (
    echo [✓] Đã tìm thấy Node.js
    echo [→] Đang khởi động server tại http://localhost:5173
    echo [→] Trình duyệt sẽ mở tự động...
    echo.
    start "" "http://localhost:5173"
    npx --yes serve -l 5173 .
    goto :end
)

:: Thử Python 3
where python >nul 2>&1
if %errorlevel% == 0 (
    echo [✓] Đã tìm thấy Python
    echo [→] Đang khởi động server tại http://localhost:5173
    echo [→] Trình duyệt sẽ mở tự động...
    echo.
    start "" "http://localhost:5173"
    python -m http.server 5173
    goto :end
)

:: Thử Python
where python3 >nul 2>&1
if %errorlevel% == 0 (
    echo [✓] Đã tìm thấy Python3
    echo [→] Đang khởi động server...
    start "" "http://localhost:5173"
    python3 -m http.server 5173
    goto :end
)

echo [!] Không tìm thấy Node.js hoặc Python!
echo.
echo  Cài đặt một trong hai:
echo   Node.js : https://nodejs.org
echo   Python  : https://www.python.org
echo.
echo  Hoặc dùng VS Code + extension "Live Server"
echo  Rồi click chuột phải vào index.html → "Open with Live Server"
echo.
pause

:end

