@echo off
echo ====================================
echo  Pet Shop 3.0 - Start MySQL
echo ====================================
echo.

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running
    pause
    exit /b 1
)

echo [1/3] Checking if container exists...
docker ps -a --format "{{.Names}}" | findstr /i "pet-shop-mysql" >nul
if %errorlevel% equ 0 (
    echo [INFO] Existing container found, starting...
) else (
    echo [INFO] No container found, creating new one...
    echo [NOTE] For first-time setup with database initialization, use: docker-init.bat
)

echo.
echo [2/3] Starting MySQL container...
docker-compose up -d

if %errorlevel% neq 0 (
    echo [ERROR] Failed to start container
    pause
    exit /b 1
)

echo [3/3] Waiting for MySQL to be ready...
set /a count=0
:waitloop
timeout /t 2 /nobreak >nul
set /a count=%count%+1
docker exec pet-shop-mysql mysqladmin ping -h localhost -uroot -proot >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] MySQL is ready after %count% attempts
    goto done
)
if %count% geq 30 (
    echo [WARNING] MySQL health check timeout, but container is running
    goto done
)
goto waitloop

:done
echo.
echo ====================================
echo  MySQL Started Successfully!
echo ====================================
echo.
echo Connection Info:
echo   Host: localhost
echo   Port: 3307
echo   Database: pet_shop_3_0
echo   Username: root
echo   Password: root
echo.
echo Default Admin Account:
echo   Username: admin
echo   Password: admin123
echo.
echo Commands:
echo   Logs:   docker logs pet-shop-mysql
echo   Stop:   docker-stop-minimal.bat
echo   Reset:  docker-reset-minimal.bat
echo   Init:   docker-init.bat (first-time setup)
echo.
pause
