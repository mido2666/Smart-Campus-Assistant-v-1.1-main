-- Migration: Add refresh_tokens table and tokenVersion to users
-- Date: 2025-11-22
-- Purpose: Fix 401 Unauthorized errors in notifications

-- Step 1: Add tokenVersion column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'tokenVersion'
    ) THEN
        ALTER TABLE users ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 1;
    END IF;
END $$;

-- Step 2: Create refresh_tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Step 3: Create index on userId for better performance
CREATE INDEX IF NOT EXISTS "refresh_tokens_userId_idx" ON refresh_tokens("userId");

-- Step 4: Create index on token for faster lookups
CREATE INDEX IF NOT EXISTS "refresh_tokens_token_idx" ON refresh_tokens(token);

-- Step 5: Create index on expiresAt for cleanup queries
CREATE INDEX IF NOT EXISTS "refresh_tokens_expiresAt_idx" ON refresh_tokens("expiresAt");

-- Verification: Show the created table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'refresh_tokens'
ORDER BY ordinal_position;
