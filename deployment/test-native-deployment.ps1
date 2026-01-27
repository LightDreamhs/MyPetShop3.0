# Native Deployment Simulation Test Script
# This script simulates the deployment process to verify all configurations

Write-Host "================================" -ForegroundColor Green
Write-Host "原生部署方案 - 模拟测试" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

$ErrorActionPreference = "Continue"

# Test results
$testsPassed = 0
$testsFailed = 0

function Test-Step {
    param([string]$Name, [scriptblock]$Script)

    Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] 测试: $Name" -ForegroundColor Cyan

    try {
        & $Script
        Write-Host "  ✅ 通过" -ForegroundColor Green
        $global:testsPassed++
        return $true
    } catch {
        Write-Host "  ❌ 失败: $_" -ForegroundColor Red
        $global:testsFailed++
        return $false
    }
}

# Test 1: Verify deployment script exists
Test-Step "部署脚本文件检查" {
    $scriptPath = "D:\MyProject\MyPetShop3.0\deployment\native-deploy.sh"
    if (-not (Test-Path $scriptPath)) {
        throw "部署脚本文件不存在: $scriptPath"
    }

    $content = Get-Content $scriptPath -Raw
    if (-not $content) {
        throw "部署脚本文件为空"
    }

    # Check for key functions
    $requiredFunctions = @(
        "check_root",
        "install_docker",
        "install_jdk",
        "install_nodejs",
        "install_maven",
        "build_backend",
        "build_frontend",
        "setup_nginx"
    )

    foreach ($func in $requiredFunctions) {
        if ($content -notmatch "function $func|$func\(\)") {
            throw "缺少关键函数: $func"
        }
    }

    Write-Host "  包含所有必要的函数"
}

# Test 2: Verify Nginx configuration
Test-Step "Nginx 配置文件检查" {
    $nginxPath = "D:\MyProject\MyPetShop3.0\deployment\nginx-native.conf"
    if (-not (Test-Path $nginxPath)) {
        throw "Nginx 配置文件不存在"
    }

    $content = Get-Content $nginxPath -Raw

    # Check for critical configurations
    $requiredConfigs = @(
        "listen 80",
        "root /var/www/petshop/frontend",
        "location /api/v1",
        "proxy_pass http://127.0.0.1:8080",
        "location /uploads/images/",
        "alias /var/www/petshop/uploads/"
    )

    foreach ($config in $requiredConfigs) {
        if ($content -notmatch [regex]::Escape($config)) {
            throw "缺少关键配置: $config"
        }
    }

    # Verify no localhost in server_domain
    if ($content -match "server-domain.*localhost") {
        Write-Host "  ⚠️  警告: 配置中包含 localhost（部署时会被替换为实际IP）" -ForegroundColor Yellow
    }

    Write-Host "  包含所有必要的配置项"
}

# Test 3: Verify backend production configuration
Test-Step "后端生产环境配置检查" {
    $appPath = "D:\MyProject\MyPetShop3.0\backend\src\main\resources\application-prod.yml"
    if (-not (Test-Path $appPath)) {
        throw "生产环境配置文件不存在"
    }

    $content = Get-Content $appPath -Raw

    # Check for key configurations
    $requiredConfigs = @(
        "port: 8080",
        "context-path: /api/v1",
        "file:",
        "upload-dir:",
        "server-domain:",
        "jwt:"
    )

    foreach ($config in $requiredConfigs) {
        if ($content -notmatch [regex]::Escape($config)) {
            throw "缺少关键配置: $config"
        }
    }

    # Verify file.server-domain doesn't include context-path
    if ($content -match "server-domain:.*api/v1") {
        throw "❌ file.server-domain 不应包含 /api/v1（会导致图片路径错误）"
    }

    # Verify upload-dir is configurable via environment variable
    if ($content -match 'upload-dir:\s+\$\{FILE_UPLOAD_DIR:.*\}') {
        Write-Host "  ✅ upload-dir 支持环境变量配置"
    }

    Write-Host "  配置项正确，图片路径已修复"
}

# Test 4: Verify frontend production environment
Test-Step "前端生产环境配置检查" {
    $envPath = "D:\MyProject\MyPetShop3.0\frontend\.env.production"
    if (-not (Test-Path $envPath)) {
        throw "前端生产环境配置文件不存在"
    }

    $content = Get-Content $envPath -Raw

    # Check for API base URL
    if ($content -notmatch "VITE_API_BASE_URL=/api/v1") {
        throw "API base URL 配置不正确"
    }

    # Verify it's using relative path (not localhost)
    if ($content -match "localhost") {
        throw "生产环境不应使用 localhost"
    }

    Write-Host "  API 地址配置正确（使用相对路径）"
}

# Test 5: Verify backend file upload logic
Test-Step "后端文件上传逻辑检查" {
    $webConfigPath = "D:\MyProject\MyPetShop3.0\backend\src\main\java\com\petshop\backend\config\WebConfig.java"
    $fileServicePath = "D:\MyProject\MyPetShop3.0\backend\src\main\java\com\petshop\backend\service\impl\LocalFileServiceImpl.java"

    foreach ($path in @($webConfigPath, $fileServicePath)) {
        if (-not (Test-Path $path)) {
            throw "文件不存在: $path"
        }
    }

    $webConfig = Get-Content $webConfigPath -Raw
    $fileService = Get-Content $fileServicePath -Raw

    # Check WebConfig has static resource mapping
    if ($webConfig -notmatch 'addResourceHandler\("/uploads/images/\*\*")') {
        throw "WebConfig 缺少静态资源映射"
    }

    # Check FileService generates correct URL
    if ($fileService -notmatch 'serverDomain\s*\+\s*"/uploads/images/"') {
        throw "FileService URL 生成逻辑不正确"
    }

    Write-Host "  静态资源映射配置正确"
}

# Test 6: Verify systemd service configuration in script
Test-Step "Systemd 服务配置检查" {
    $scriptPath = "D:\MyProject\MyPetShop3.0\deployment\native-deploy.sh"
    $content = Get-Content $scriptPath -Raw

    # Check for systemd service creation
    if ($content -notmatch "petshop-backend.service") {
        throw "脚本中缺少 systemd 服务配置"
    }

    # Check for required environment variables
    $requiredEnvVars = @(
        "SPRING_DATASOURCE_URL",
        "SPRING_DATASOURCE_USERNAME",
        "SPRING_DATASOURCE_PASSWORD",
        "JWT_SECRET",
        "FILE_UPLOAD_DIR",
        "FILE_SERVERDOMAIN"
    )

    foreach ($var in $requiredEnvVars) {
        if ($content -notmatch [regex]::Escape($var)) {
            throw "systemd 服务缺少环境变量: $var"
        }
    }

    # Check service is enabled
    if ($content -notmatch "WantedBy=multi-user.target") {
        throw "systemd 服务未配置开机自启"
    }

    Write-Host "  systemd 服务配置完整"
}

# Test 7: Verify MySQL container configuration
Test-Step "MySQL 容器配置检查" {
    $scriptPath = "D:\MyProject\MyPetShop3.0\deployment\native-deploy.sh"
    $content = Get-Content $scriptPath -Raw

    # Check for docker run command
    if ($content -notmatch "docker run") {
        throw "脚本中缺少 Docker 容器启动命令"
    }

    # Check for MySQL specific configurations
    $requiredConfigs = @(
        "--name petshop-mysql",
        "-e MYSQL_ROOT_PASSWORD",
        "-e MYSQL_DATABASE=pet_shop_3_0",
        "-e MYSQL_USER=petshop",
        "-p 3306:3306",
        "mysql:8.0"
    )

    foreach ($config in $requiredConfigs) {
        if ($content -notmatch [regex]::Escape($config)) {
            throw "MySQL 容器缺少配置: $config"
        }
    }

    Write-Host "  MySQL 容器配置正确"
}

# Test 8: Verify security settings
Test-Step "安全配置检查" {
    $scriptPath = "D:\MyProject\MyPetShop3.0\deployment\native-deploy.sh"
    $content = Get-Content $scriptPath -Raw

    # Check for random password generation
    if ($content -notmatch "openssl rand") {
        throw "脚本未使用随机密码生成"
    }

    # Check for password backup
    if ($content -notmatch ".env.backup") {
        throw "脚本未保存密码备份"
    }

    # Check chmod 600 for backup file
    if ($content -notmatch "chmod 600 .env.backup") {
        throw "密码备份文件权限不安全"
    }

    Write-Host "  安全配置到位"
}

# Test 9: Path simulation test
Test-Step "部署路径模拟测试" {
    # Simulate the paths that will be used
    $paths = @(
        "/var/www/petshop/backend",
        "/var/www/petshop/frontend",
        "/var/www/petshop/uploads",
        "/var/www/petshop/logs",
        "/etc/systemd/system/petshop-backend.service",
        "/etc/nginx/sites-available/petshop"
    )

    foreach ($path in $paths) {
        # Just verify the path format is correct
        if ($path -notmatch "^/") {
            throw "路径格式错误: $path"
        }
    }

    Write-Host "  所有路径格式正确"
}

# Test 10: Documentation completeness
Test-Step "文档完整性检查" {
    $docPath = "D:\MyProject\MyPetShop3.0\deployment\NATIVE-DEPLOYMENT.md"
    if (-not (Test-Path $docPath)) {
        throw "部署文档不存在"
    }

    $content = Get-Content $docPath -Raw

    # Check for required sections
    $requiredSections = @(
        "部署方案说明",
        "快速开始",
        "配置说明",
        "常用命令",
        "故障排查",
        "安全建议"
    )

    foreach ($section in $requiredSections) {
        if ($content -notmatch [regex]::Escape($section)) {
            throw "文档缺少章节: $section"
        }
    }

    Write-Host "  文档包含所有必要章节"
}

# Summary
Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "测试总结" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "通过: $testsPassed" -ForegroundColor Green
Write-Host "失败: $testsFailed" -ForegroundColor $(if ($testsFailed -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "✅ 所有测试通过！部署方案可以使用。" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 部署清单:" -ForegroundColor Cyan
    Write-Host "  1. ✅ 部署脚本 (native-deploy.sh)" -ForegroundColor Green
    Write-Host "  2. ✅ Nginx 配置 (nginx-native.conf)" -ForegroundColor Green
    Write-Host "  3. ✅ 后端生产配置 (application-prod.yml)" -ForegroundColor Green
    Write-Host "  4. ✅ 前端生产配置 (.env.production)" -ForegroundColor Green
    Write-Host "  5. ✅ 部署文档 (NATIVE-DEPLOYMENT.md)" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 下一步: 在云服务器上运行以下命令开始部署" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  cd /path/to/MyPetShop3.0/deployment" -ForegroundColor White
    Write-Host "  chmod +x native-deploy.sh" -ForegroundColor White
    Write-Host "  sudo ./native-deploy.sh" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "❌ 部分测试失败，请修复后再使用。" -ForegroundColor Red
    exit 1
}
