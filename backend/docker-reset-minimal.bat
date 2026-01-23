@echo off
echo ====================================
echo  Pet Shop 3.0 - Reset MySQL
echo ====================================
echo.
echo WARNING: This will delete all containers and data!
echo After reset, you can choose:
echo   - docker-start-minimal.bat (empty database)
echo   - docker-init.bat (with sample data)
echo.

set /p confirm=Confirm deletion? (type YES to continue):
if /i not "%confirm%"=="YES" (
    echo [CANCELLED] Operation cancelled
    pause
    exit /b 0
)

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running
    pause
    exit /b 1
)

echo [INFO] Removing containers and volumes...
docker-compose down -v

if %errorlevel% neq 0 (
    echo [WARNING] Some resources may not exist
)

echo.
echo ====================================
echo  Containers and Data Deleted!
echo ====================================
echo.
echo Next Steps:
echo   1. For empty database:    docker-start-minimal.bat
echo   2. For sample data:       docker-init.bat
echo.
pause
