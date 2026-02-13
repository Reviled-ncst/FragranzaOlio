-- Password Reset Schema
-- Adds password reset token columns to users table

-- Add password reset columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(64) NULL,
ADD COLUMN IF NOT EXISTS password_reset_expires DATETIME NULL;

-- Create index for faster token lookup
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON users(password_reset_token);
