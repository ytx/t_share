#!/bin/bash

# T-SHARE Local Production Environment Stop Script

set -e

echo "🛑 Stopping T-SHARE Production Environment"
echo "=============================================="

# Stop and remove containers
echo "📦 Stopping containers..."
docker-compose -f docker-compose.prod.yml down

echo "🧹 Cleaning up..."

# Optional: Remove volumes (uncomment if you want to reset data)
# echo "🗑️  Removing volumes..."
# docker-compose -f docker-compose.prod.yml down -v

# Optional: Remove images (uncomment if you want to remove built images)
# echo "🗑️  Removing images..."
# docker rmi t-share-backend-prod t-share-frontend-prod 2>/dev/null || true

echo "=============================================="
echo "✅ T-SHARE Production Environment Stopped"
echo "=============================================="