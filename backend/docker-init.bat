@echo off
echo ====================================
echo  Pet Shop 3.0 - Initialize MySQL
echo ====================================
echo.
echo WARNING: This will delete all existing data and reinitialize!
echo.
echo This script will:
echo   1. Remove existing containers and data
echo   2. Start fresh MySQL container
echo   3. Initialize database tables and data
echo.

set /p confirm=Confirm initialization? (type YES to continue):
if /i not "%confirm%"=="YES" (
    echo [CANCELLED] Operation cancelled
    pause
    exit /b 0
)

echo.
echo ====================================
echo  Step 1: Check Docker
echo ====================================
echo.

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running
    pause
    exit /b 1
)

echo [SUCCESS] Docker is running
echo.

echo ====================================
echo  Step 2: Remove Existing Data
echo ====================================
echo.

echo [INFO] Removing containers and volumes...
docker-compose down -v >nul 2>&1

if %errorlevel% neq 0 (
    echo [WARNING] Some containers may not exist, continuing...
)

echo [SUCCESS] Existing data removed
echo.

echo ====================================
echo  Step 3: Start MySQL Container
echo ====================================
echo.

echo [INFO] Starting MySQL container...
docker-compose up -d

if %errorlevel% neq 0 (
    echo [ERROR] Failed to start container
    pause
    exit /b 1
)

echo [SUCCESS] MySQL container started
echo.

echo ====================================
echo  Step 4: Wait for MySQL Ready
echo ====================================
echo.

echo [INFO] Waiting for MySQL to be ready...
set /a count=0
:waitloop
timeout /t 2 /nobreak >nul
set /a count=%count%+1
docker exec pet-shop-mysql mysqladmin ping -h localhost -uroot -proot >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] MySQL is ready after %count% attempts
    goto initdb
)
if %count% geq 30 (
    echo [ERROR] MySQL startup timeout
    pause
    exit /b 1
)
goto waitloop

:initdb
echo.

echo ====================================
echo  Step 5: Initialize Database
echo ====================================
echo.

echo [INFO] Waiting extra 3 seconds for authentication system...
timeout /t 3 /nobreak >nul

echo [INFO] Executing schema.sql...
docker exec -i pet-shop-mysql mysql -uroot -proot pet_shop_3_0 < "src\main\resources\db\schema.sql" 2>nul

if %errorlevel% neq 0 (
    echo [ERROR] Database initialization failed
    echo [HINT] Try running: docker logs pet-shop-mysql
    pause
    exit /b 1
)

echo [SUCCESS] Database initialized successfully
echo.

echo ====================================
echo  Initialization Complete!
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
echo Test Data:
echo   - 3 sample products
echo   - 2 sample customers (1 member level 2, 1 non-member)
echo   - 3 sample consumption records
echo   - 4 sample transactions
echo.
echo Useful Commands:
echo   Logs:       docker logs pet-shop-mysql
echo   Stop:       docker-stop-minimal.bat
echo   Restart:    docker-start-minimal.bat
echo   Re-init:    docker-init.bat
echo.
pause
