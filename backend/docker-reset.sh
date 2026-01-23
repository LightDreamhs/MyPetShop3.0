#!/bin/bash

echo "===================================="
echo " Pet Shop 3.0 - Reset MySQL"
echo "===================================="
echo ""
echo "WARNING: This will delete all containers and data!"
echo ""

# Confirm deletion
read -p "Confirm deletion? (type YES to continue): " confirm
if [ "$confirm" != "YES" ]; then
    echo "[CANCELLED] Operation cancelled"
    read -p "Press Enter to exit..."
    exit 0
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "[ERROR] Docker is not running"
    read -p "Press Enter to exit..."
    exit 1
fi

# Remove containers and data
echo "[INFO] Removing containers and data..."
docker-compose down -v

if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to remove containers"
    read -p "Press Enter to exit..."
    exit 1
fi

echo ""
echo "===================================="
echo " Containers and Data Deleted!"
echo "===================================="
echo ""
echo "To restart: ./docker-start.sh"
echo ""
