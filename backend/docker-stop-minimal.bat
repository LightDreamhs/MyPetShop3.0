@echo off
echo ====================================
echo  Pet Shop 3.0 - Stop MySQL
echo ====================================
echo.

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running
    pause
    exit /b 1
)

echo [INFO] Stopping MySQL container...
docker-compose stop

if %errorlevel% neq 0 (
    echo [WARNING] Container may not be running
)

echo.
echo ====================================
echo  Container Stopped!
echo ====================================
echo.
echo Data is preserved in Docker volume.
echo.
echo Commands:
echo   Start:  docker-start-minimal.bat
echo   Reset:  docker-reset-minimal.bat (deletes data)
echo   Init:   docker-init.bat (fresh setup with data)
echo.
pause
