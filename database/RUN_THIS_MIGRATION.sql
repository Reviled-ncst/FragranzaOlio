-- ========================================
-- FRAGRANZA OLIO - ROLE FIELD MIGRATION
-- ========================================
-- This script adds the role column to users table
-- and updates existing users with appropriate roles
--
-- RUN THIS IN phpMyAdmin AFTER running COMPLETE_SETUP.sql
-- ========================================

USE fragranza_db;

-- Step 1: Add role column to users table
ALTER TABLE users 
ADD COLUMN role ENUM('customer', 'sales', 'admin') NOT NULL DEFAULT 'customer'
AFTER email;

-- Step 2: Update existing users with appropriate roles
UPDATE users 
SET role = 'sales' 
WHERE email = 'vendor0qw@gmail.com';

-- You can add more role updates here if needed:
-- UPDATE users SET role = 'admin' WHERE email = 'admin@fragranza.com';

-- Step 3: Verify the changes
SELECT 
    id,
    first_name,
    last_name,
    email,
    role,
    status,
    created_at
FROM users
ORDER BY created_at;

-- ========================================
-- MIGRATION COMPLETE
-- ========================================
-- ✅ Role column added successfully
-- ✅ Existing users updated with roles
-- ✅ Ready to test authentication
-- ========================================
