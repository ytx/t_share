#!/bin/sh

cd docker
docker-compose up -d postgres
cd ..
npm run dev
cd docker
docker-compose down

