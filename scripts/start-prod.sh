#!/bin/bash

# T-SHARE Local Production Environment Startup Script

set -e

echo "🚀 Starting T-SHARE in Production Mode"
echo "=================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Load environment variables
if [ -f .env.prod.local ]; then
    echo "📄 Loading environment variables from .env.prod.local"
    export $(cat .env.prod.local | grep -v '^#' | xargs)
else
    echo "📄 Using default environment variables from .env.prod"
    export $(cat .env.prod | grep -v '^#' | xargs)
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.prod.yml up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."

# Wait for database
echo "   📊 Waiting for database..."
for i in {1..30}; do
    if docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo "   ✅ Database is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "   ❌ Database failed to start"
        exit 1
    fi
    sleep 2
done

# Wait for backend
echo "   🔧 Waiting for backend..."
for i in {1..60}; do
    if curl -f http://localhost:4200/api/health > /dev/null 2>&1; then
        echo "   ✅ Backend is ready"
        break
    fi
    if [ $i -eq 60 ]; then
        echo "   ❌ Backend failed to start"
        exit 1
    fi
    sleep 2
done

# Wait for frontend
echo "   🎨 Waiting for frontend..."
for i in {1..30}; do
    if curl -f http://localhost:3200/health > /dev/null 2>&1; then
        echo "   ✅ Frontend is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "   ❌ Frontend failed to start"
        exit 1
    fi
    sleep 2
done

echo "=================================================="
echo "🎉 T-SHARE Production Environment is Ready!"
echo ""
echo "📱 Frontend: http://localhost:3200"
echo "🔧 Backend:  http://localhost:4200"
echo "📊 Database: localhost:5200"
echo ""
echo "📋 To view logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "🛑 To stop:     docker-compose -f docker-compose.prod.yml down"
echo "=================================================="