#!/bin/bash

# ==========================================
# Native Deployment Test Script
# ==========================================

echo "================================"
echo "Native Deployment - Test Suite"
echo "================================"
echo ""

PASSED=0
FAILED=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

test_step() {
    local name="$1"
    local test_cmd="$2"

    echo "Testing: $name"

    if eval "$test_cmd"; then
        echo -e "  ${GREEN}PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "  ${RED}FAIL${NC}"
        ((FAILED++))
        return 1
    fi
}

# Test 1: Deployment script exists
test_step "Deployment script exists" \
    "test -f deployment/native-deploy.sh && test -s deployment/native-deploy.sh"

# Test 2: Nginx config exists
test_step "Nginx config exists" \
    "test -f deployment/nginx-native.conf"

# Test 3: Backend prod config exists
test_step "Backend prod config exists" \
    "test -f backend/src/main/resources/application-prod.yml"

# Test 4: Frontend prod config exists
test_step "Frontend prod config exists" \
    "test -f frontend/.env.production"

# Test 5: Documentation exists
test_step "Documentation exists" \
    "test -f deployment/NATIVE-DEPLOYMENT.md"

# Test 6: Nginx config has upstream proxy
test_step "Nginx has upstream proxy" \
    "grep -q 'proxy_pass http://127.0.0.1:8080' deployment/nginx-native.conf"

# Test 7: Nginx serves uploads directly
test_step "Nginx serves uploads directly" \
    "grep -q 'location /uploads/images/' deployment/nginx-native.conf"

# Test 8: Backend config doesn't include context-path in server-domain
test_step "Backend server-domain doesn't include /api/v1" \
    "! grep -q 'server-domain:.*api/v1' backend/src/main/resources/application-prod.yml"

# Test 9: Backend uses environment variable for server-domain
test_step "Backend uses env var for server-domain" \
    "grep -q 'server-domain: \${FILE_SERVERDOMAIN:' backend/src/main/resources/application-prod.yml"

# Test 10: Frontend uses relative API path
test_step "Frontend uses relative API path" \
    "grep -q 'VITE_API_BASE_URL=/api/v1' frontend/.env.production"

# Test 11: Deployment script installs required software
test_step "Deployment script installs JDK" \
    "grep -q 'install_jdk' deployment/native-deploy.sh"

# Test 12: Deployment script builds backend
test_step "Deployment script builds backend" \
    "grep -q 'build_backend' deployment/native-deploy.sh"

# Test 13: Deployment script builds frontend
test_step "Deployment script builds frontend" \
    "grep -q 'build_frontend' deployment/native-deploy.sh"

# Test 14: Deployment script creates systemd service
test_step "Deployment script creates systemd service" \
    "grep -q 'petshop-backend.service' deployment/native-deploy.sh"

# Test 15: Deployment script generates secure passwords
test_step "Deployment script generates secure passwords" \
    "grep -q 'openssl rand' deployment/native-deploy.sh"

# Test 16: Systemd service has required env vars
test_step "Systemd service has JWT_SECRET" \
    "grep -q 'JWT_SECRET' deployment/native-deploy.sh"

# Test 17: Systemd service has database config
test_step "Systemd service has database config" \
    "grep -q 'SPRING_DATASOURCE_URL' deployment/native-deploy.sh"

# Test 18: MySQL container uses correct image
test_step "MySQL container uses correct image" \
    "grep -q 'mysql:8.0' deployment/native-deploy.sh"

# Test 19: MySQL container has volume mount
test_step "MySQL container has volume mount" \
    "grep -q 'mysql-data:' deployment/native-deploy.sh"

# Test 20: Documentation has troubleshooting section
test_step "Documentation has troubleshooting" \
    "grep -q '故障排查' deployment/NATIVE-DEPLOYMENT.md"

echo ""
echo "================================"
echo "Test Summary"
echo "================================"
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    echo ""
    echo "Deployment files ready:"
    echo "  1. deployment/native-deploy.sh"
    echo "  2. deployment/nginx-native.conf"
    echo "  3. backend/src/main/resources/application-prod.yml"
    echo "  4. frontend/.env.production"
    echo "  5. deployment/NATIVE-DEPLOYMENT.md"
    echo ""
    echo "To deploy on cloud server:"
    echo "  cd deployment"
    echo "  chmod +x native-deploy.sh"
    echo "  sudo ./native-deploy.sh"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi
