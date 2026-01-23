#!/bin/bash

echo "===================================="
echo " Pet Shop 3.0 - Stop MySQL"
echo "===================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "[ERROR] Docker is not running"
    read -p "Press Enter to exit..."
    exit 1
fi

# Stop container
echo "[INFO] Stopping container..."
docker-compose stop

if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to stop container"
    read -p "Press Enter to exit..."
    exit 1
fi

echo ""
echo "===================================="
echo " Container Stopped!"
echo "===================================="
echo ""
echo "To restart: ./docker-start.sh"
echo ""
