-- Add role column to users table
-- Run this after COMPLETE_SETUP.sql

USE fragranza_db;

-- Add role column
ALTER TABLE users 
ADD COLUMN role ENUM('customer', 'sales', 'admin') DEFAULT 'customer' AFTER email;

-- Update existing users with roles based on their emails
UPDATE users SET role = 'admin' WHERE email = 'admin@fragranza.com';
UPDATE users SET role = 'sales' WHERE email = 'vendor0qw@gmail.com';
UPDATE users SET role = 'customer' WHERE email IN ('maria.santos@email.com', 'juan.delacruz@email.com');

-- Verify changes
SELECT id, email, role, status FROM users;
