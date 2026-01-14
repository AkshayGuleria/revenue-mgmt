-- PostgreSQL initialization script for Revenue Management System
-- This script runs once when the database is first created

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for additional cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schema if not exists (Prisma uses 'public' by default)
CREATE SCHEMA IF NOT EXISTS public;

-- Grant privileges to revenue_user
GRANT ALL PRIVILEGES ON SCHEMA public TO revenue_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO revenue_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO revenue_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO revenue_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO revenue_user;

-- Log successful initialization
DO $$
BEGIN
  RAISE NOTICE 'Revenue Management Database initialized successfully';
END $$;
