-- Update existing users with proper roles
-- Run this AFTER running add_user_roles.sql

USE fragranza_db;

-- Update the sales user (vendor0qw@gmail.com)
UPDATE users 
SET role = 'sales' 
WHERE email = 'vendor0qw@gmail.com';

-- Update any admin users (if you have an admin email)
-- UPDATE users 
-- SET role = 'admin' 
-- WHERE email = 'admin@fragranza.com';

-- Verify the update
SELECT id, first_name, last_name, email, role, created_at 
FROM users 
ORDER BY created_at;
