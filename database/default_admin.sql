-- Fragranza Olio - Default Admin Account
-- Run this after COMPLETE_SETUP.sql and add_user_roles.sql
-- Default Admin Credentials:
--   Email: admin@fragranza.com
--   Password: Admin@1234

USE fragranza_db;

-- Insert default admin account (skip if already exists)
INSERT INTO users (
    first_name,
    last_name,
    email,
    role,
    birth_date,
    gender,
    phone,
    address,
    city,
    province,
    zip_code,
    password_hash,
    subscribe_newsletter,
    status,
    email_verified,
    created_at,
    updated_at
) VALUES (
    'System',
    'Administrator',
    'admin@fragranza.com',
    'admin',
    '1990-01-01',
    'other',
    '09170000000',
    'Fragranza Headquarters',
    'Makati City',
    'Metro Manila',
    '1200',
    '$2y$12$fwEhwVFe4pbFb.xJEkQ5tepOf8EF6vdsq02JhpwQ3nAkFVsIMEU3C',
    TRUE,
    'active',
    TRUE,
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE
    role = 'admin',
    status = 'active',
    email_verified = TRUE;

-- Verify the admin account was created
SELECT id, first_name, last_name, email, role, status, email_verified 
FROM users 
WHERE email = 'admin@fragranza.com';
