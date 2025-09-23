#!/bin/bash

# T-SHARE Local Production Environment Startup Script

set -e

# Parse command line arguments
INIT_DB=false
if [ "$1" = "--init" ]; then
    INIT_DB=true
    echo "🚀 Starting T-SHARE in Production Mode with Database Initialization"
    echo "=================================================="
else
    echo "🚀 Starting T-SHARE in Production Mode"
    echo "=================================================="
fi

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
if [ "$INIT_DB" = true ]; then
    echo "🗑️  Removing volumes for fresh database..."
    docker-compose -f docker-compose.prod.yml down -v
else
    docker-compose -f docker-compose.prod.yml down
fi

# Build and start services
echo "🔨 Building and starting services..."
if [ "$INIT_DB" = true ]; then
    echo "🔄 Force recreating all containers for fresh start..."
    docker-compose -f docker-compose.prod.yml up --build --force-recreate -d
else
    docker-compose -f docker-compose.prod.yml up --build -d
fi

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

# Initialize database if requested
if [ "$INIT_DB" = true ]; then
    echo "🗄️  Initializing database..."

    # Run database migrations
    echo "   📋 Running database migrations..."
    docker-compose -f docker-compose.prod.yml exec --user root backend npx prisma migrate deploy

    # Try to install ts-node with proper permissions
    echo "   🌱 Installing seed dependencies..."
    docker-compose -f docker-compose.prod.yml exec --user root backend npm install -g ts-node 2>/dev/null || \
    docker-compose -f docker-compose.prod.yml exec backend npm install ts-node 2>/dev/null || true

    # Run database seeding
    echo "   🌱 Seeding initial data..."
    if docker-compose -f docker-compose.prod.yml exec --user root backend npx prisma db seed 2>/dev/null; then
        echo "   ✅ Database seeded successfully"
    else
        echo "   ⚠️  Seed script failed, creating admin user manually..."
        # Generate password hash using bcrypt
        ADMIN_HASH=$(docker-compose -f docker-compose.prod.yml exec --user root backend node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10).then(hash => console.log(hash));" 2>/dev/null)
        docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d templateshare -c "
        INSERT INTO users (username, email, password_hash, display_name, is_admin, approval_status, applied_at, created_at, updated_at)
        VALUES (
          'admin@template-share.com',
          'admin@template-share.com',
          '$ADMIN_HASH',
          'Administrator',
          true,
          'approved',
          NOW(),
          NOW(),
          NOW()
        ) ON CONFLICT (email) DO NOTHING;
        " > /dev/null 2>&1
        echo "   ✅ Admin user created (username: admin@template-share.com, password: admin123)"
    fi

    # Verify database initialization
    echo "   🔍 Verifying database setup..."
    USER_COUNT=$(docker-compose -f docker-compose.prod.yml exec --user root backend node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    prisma.user.count().then(count => {
        console.log(count);
        process.exit(0);
    }).catch(() => {
        console.log(0);
        process.exit(1);
    });
    " 2>/dev/null)

    if [ "$USER_COUNT" -gt 0 ]; then
        echo "   ✅ Database initialized with $USER_COUNT users"
    else
        echo "   ❌ Database initialization may have failed"
    fi
fi

echo "=================================================="
echo "🎉 T-SHARE Production Environment is Ready!"
echo ""
echo "📱 Frontend: http://localhost:3200"
echo "🔧 Backend:  http://localhost:4200"
echo "📊 Database: localhost:5200"
echo ""
if [ "$INIT_DB" = true ]; then
    echo "🔑 Default Login:"
    echo "   Username: admin@template-share.com"
    echo "   Password: admin123"
    echo ""
fi
echo "📋 To view logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "🛑 To stop:     docker-compose -f docker-compose.prod.yml down"
echo "=================================================="