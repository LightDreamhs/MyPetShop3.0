@echo off
REM ==========================================
REM Pet Shop Management System - Deployment Script
REM ==========================================
REM
REM This script helps deploy the Pet Shop Management System
REM
REM Usage:
REM   deploy.bat              - Interactive deployment
REM   deploy.bat auto         - Automatic deployment
REM
REM ==========================================

setlocal enabledelayedexpansion

REM Color codes (not supported in standard cmd, but keeping for future)
set "INFO=[INFO]"
set "WARN=[WARN]"
set "ERROR=[ERROR]"

echo ==========================================
echo Pet Shop Management System - Deployment
echo ==========================================
echo.

REM Check if running on Windows
ver | findstr /i "Windows" >nul
if errorlevel 1 (
    echo %ERROR% This script must be run on Windows
    pause
    exit /b 1
)

REM Check Docker
echo %INFO% Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo %ERROR% Docker is not installed
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo %INFO% Docker is installed
docker --version

REM Check Docker Compose
echo %INFO% Checking Docker Compose...
docker compose version >nul 2>&1
if errorlevel 1 (
    echo %ERROR% Docker Compose is not available
    pause
    exit /b 1
)

echo %INFO% Docker Compose is available
docker compose version

REM Change to deployment directory
cd /d "%~dp0"
echo %INFO% Current directory: %CD%

REM Check if .env file exists
if not exist ".env" (
    echo %INFO% Creating .env file from template...

    if not exist ".env.example" (
        echo %ERROR% .env.example not found
        pause
        exit /b 1
    )

    REM Generate random passwords using PowerShell
    for /f "delims=" %%i in ('powershell -Command "-join (48..57 + 65..90 + 97..122 | Get-Random -Count 16 | %% {[char]$_})"') do set MYSQL_ROOT_PASSWORD=%%i
    for /f "delims=" %%i in ('powershell -Command "-join (48..57 + 65..90 + 97..122 | Get-Random -Count 16 | %% {[char]$_})"') do set MYSQL_PASSWORD=%%i
    for /f "delims=" %%i in ('powershell -Command "-join (48..57 + 65..90 + 97..122 | Get-Random -Count 32 | %% {[char]$_})"') do set JWT_SECRET=%%i

    REM Get server IP
    for /f "delims=" %%i in ('powershell -Command "(Invoke-WebRequest -Uri 'http://ifconfig.me' -UseBasicParsing).Content"') do set SERVER_IP=%%i

    REM Create .env file
    (
        echo # ==========================================
        echo # Pet Shop Management System - Environment Variables
        echo # ==========================================
        echo # Generated: %date% %time%
        echo.
        echo # MySQL Configuration
        echo MYSQL_ROOT_PASSWORD=!MYSQL_ROOT_PASSWORD!
        echo MYSQL_PASSWORD=!MYSQL_PASSWORD!
        echo.
        echo # JWT Configuration
        echo JWT_SECRET=!JWT_SECRET!
        echo JWT_EXPIRATION=7200
        echo.
        echo # Server Configuration
        echo SERVER_DOMAIN=http://!SERVER_IP!
        echo.
        echo # File Upload Configuration
        echo FILE_UPLOAD_DIR=/app/uploads/images
        echo MAX_FILE_SIZE=5
        echo.
        echo # Application Configuration
        echo SPRING_PROFILES_ACTIVE=production
        echo TZ=Asia/Shanghai
    ) > .env

    REM Create backup file with credentials
    (
        echo # ==========================================
        echo # IMPORTANT INFORMATION - KEEP SAFE!
        echo # ==========================================
        echo.
        echo # Generated: %date% %time%
        echo # Server IP: !SERVER_IP!
        echo.
        echo # MySQL root password
        echo MYSQL_ROOT_PASSWORD=!MYSQL_ROOT_PASSWORD!
        echo.
        echo # MySQL application password
        echo MYSQL_PASSWORD=!MYSQL_PASSWORD!
        echo.
        echo # JWT secret
        echo JWT_SECRET=!JWT_SECRET!
        echo.
        echo # Admin login
        echo Username: admin
        echo Password: admin123
        echo.
        echo # System URL
        echo http://!SERVER_IP!
        echo.
        echo # Please save this file in a secure location!
    ) > .env.backup

    echo %INFO% .env file created
    echo %WARN% IMPORTANT: Save .env.backup file with your credentials!
    echo.

) else (
    echo %INFO% .env file already exists, skipping generation
)

REM Check if backend JAR exists
if not exist "..\backend\target\pet-shop-backend-*.jar" (
    echo %WARN% Backend JAR not found
    echo.
    echo Please build the backend first:
    echo   cd ..\backend
    echo   mvn clean package -DskipTests
    echo.
    pause
    exit /b 1
)

REM Stop existing containers
echo %INFO% Stopping existing containers...
docker compose down 2>nul

REM Build and start services
echo %INFO% Building and starting services...
docker compose up -d --build

REM Wait for services to start
echo %INFO% Waiting for services to start...
timeout /t 15 /nobreak >nul

REM Check service status
echo.
echo %INFO% Checking service status...
docker compose ps

echo.
echo ==========================================
echo Deployment Completed!
echo ==========================================
echo.
echo %INFO% System Information:
for /f "tokens=1,2 delims==" %%a in ('type .env ^| findstr "SERVER_DOMAIN"') do echo   %%a = %%b
echo.
echo %INFO% Default Login:
echo   Username: admin
echo   Password: admin123
echo.
echo %WARN% Important:
echo   1. Save .env.backup file with credentials
echo   2. Change admin password after first login
echo   3. Configure cloud server security group
echo   4. Set up regular data backups
echo.
echo %INFO% Common Commands:
echo   Check status: docker compose ps
echo   View logs: docker compose logs -f
echo   Restart: docker compose restart
echo   Stop: docker compose down
echo.
echo %INFO% For detailed documentation, see: README.md
echo ==========================================
echo.
pause
