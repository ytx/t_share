-- Template Share Database Initialization Script
-- This script will be run when the PostgreSQL container starts

-- Create database (if not exists)
-- This is handled by the POSTGRES_DB environment variable in docker-compose

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create full-text search configuration for Japanese
-- (This will be used later for template search)
-- For now, we'll use the default English configuration

-- Initial setup complete
SELECT 'Template Share database initialized successfully' as status;