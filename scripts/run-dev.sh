#!/bin/bash

# Move to docker directory and start PostgreSQL
cd "$(dirname "$0")/.."
cd docker
docker-compose up -d postgres
cd ..

# Initialize database if --init flag is provided
if [ "$1" = "--init" ]; then
  echo "Initializing database..."
  cd backend
  npm install
  npx prisma migrate dev
  npx prisma db seed
  cd ../frontend
  npm install --legacy-peer-deps
  cd ..
fi

# Start development servers
npm run dev

# Cleanup: stop PostgreSQL container
cd docker
docker-compose down
