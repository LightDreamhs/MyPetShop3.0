#!/bin/bash

echo "===================================="
echo " Pet Shop 3.0 - Start MySQL"
echo "===================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "[ERROR] Docker is not running"
    read -p "Press Enter to exit..."
    exit 1
fi

# Start MySQL container
echo "[1/2] Starting MySQL container..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to start container"
    read -p "Press Enter to exit..."
    exit 1
fi

# Wait for MySQL to be ready
echo "[2/2] Waiting for MySQL to be ready..."
sleep 10

# Database initialization skipped to preserve existing data
# To reset database, run: docker-reset.sh then docker-start.sh
echo "[2/2] Database ready (existing data preserved)"

echo ""
echo "===================================="
echo " MySQL Started Successfully!"
echo "===================================="
echo ""
echo "Connection Info:"
echo "   Host: localhost"
echo "   Port: 3307"
echo "   Database: pet_shop_3_0"
echo "   Username: root"
echo "   Password: root"
echo ""
echo "Default Admin Account:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "Commands:"
echo "   Logs: docker logs pet-shop-mysql"
echo "   Stop: ./docker-stop.sh"
echo ""
