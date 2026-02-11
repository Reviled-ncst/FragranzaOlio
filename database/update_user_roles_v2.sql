-- Fragranza Olio - Update User Roles Schema v2
-- Adds OJT and OJT Supervisor roles
-- Run this after add_user_roles.sql

USE fragranza_db;

-- Modify role column to include new roles
ALTER TABLE users 
MODIFY COLUMN role ENUM('customer', 'sales', 'ojt', 'ojt_supervisor', 'admin') DEFAULT 'customer';

-- Add additional fields for employee management
ALTER TABLE users
ADD COLUMN IF NOT EXISTS department VARCHAR(100) AFTER zip_code,
ADD COLUMN IF NOT EXISTS position VARCHAR(100) AFTER department,
ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50) AFTER position,
ADD COLUMN IF NOT EXISTS supervisor_id INT AFTER employee_id,
ADD COLUMN IF NOT EXISTS hire_date DATE AFTER supervisor_id,
ADD COLUMN IF NOT EXISTS notes TEXT AFTER hire_date,
ADD COLUMN IF NOT EXISTS created_by INT AFTER notes;

-- Add OJT-specific fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS university VARCHAR(200) AFTER notes,
ADD COLUMN IF NOT EXISTS course VARCHAR(200) AFTER university,
ADD COLUMN IF NOT EXISTS required_hours INT DEFAULT 500 AFTER course,
ADD COLUMN IF NOT EXISTS render_hours INT DEFAULT 24 AFTER required_hours,
ADD COLUMN IF NOT EXISTS hours_completed DECIMAL(10,2) DEFAULT 0 AFTER render_hours,
ADD COLUMN IF NOT EXISTS ojt_start_date DATE AFTER hours_completed,
ADD COLUMN IF NOT EXISTS ojt_end_date DATE AFTER ojt_start_date;

-- Add foreign key for supervisor relationship
-- ALTER TABLE users ADD CONSTRAINT fk_supervisor FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE SET NULL;
-- ALTER TABLE users ADD CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_supervisor ON users(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
CREATE INDEX IF NOT EXISTS idx_users_university ON users(university);

-- Verify schema update
DESCRIBE users;

-- =====================================================
-- DEFAULT ACCOUNTS FOR TESTING
-- Password for all accounts: Test@1234
-- =====================================================

-- Password hash for 'Test@1234'
SET @test_password = '$2y$10$8K1p/bGZQyOQzMJBdVqeXeT1Y1qvJG0qJBwX0vYjK5TfDzMTqL1Oe';

-- Admin Account (already exists, but ensure it's there)
INSERT INTO users (email, password, first_name, last_name, role, status, department, position, employee_id, hire_date)
SELECT 'admin@fragranza.com', '$2y$10$YourHashedPasswordHere', 'System', 'Administrator', 'admin', 'active', 'Management', 'System Administrator', 'ADMIN-2024-0001', '2024-01-01'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@fragranza.com');

-- OJT Supervisor Account
INSERT INTO users (email, password, first_name, last_name, role, status, department, position, employee_id, hire_date, phone)
SELECT 'supervisor@fragranza.com', @test_password, 'Maria', 'Santos', 'ojt_supervisor', 'active', 'Operations', 'OJT Supervisor', 'SUP-2025-0001', '2025-01-15', '09171234567'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'supervisor@fragranza.com');

-- Sales Account
INSERT INTO users (email, password, first_name, last_name, role, status, department, position, employee_id, hire_date, phone)
SELECT 'sales@fragranza.com', @test_password, 'Juan', 'Dela Cruz', 'sales', 'active', 'Sales', 'Sales Representative', 'SALES-2025-0001', '2025-02-01', '09181234567'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'sales@fragranza.com');

-- OJT Account 1
INSERT INTO users (email, password, first_name, last_name, role, status, department, position, employee_id, supervisor_id, hire_date, phone, notes)
SELECT 'ojt1@fragranza.com', @test_password, 'Ana', 'Reyes', 'ojt', 'active', 'Operations', 'OJT Trainee', 'OJT-2026-0001', 
    (SELECT id FROM users WHERE email = 'supervisor@fragranza.com' LIMIT 1), 
    '2026-01-10', '09191234567', 'Computer Science student from PLM'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'ojt1@fragranza.com');

-- OJT Account 2
INSERT INTO users (email, password, first_name, last_name, role, status, department, position, employee_id, supervisor_id, hire_date, phone, notes)
SELECT 'ojt2@fragranza.com', @test_password, 'Mark', 'Garcia', 'ojt', 'active', 'Sales', 'OJT Trainee', 'OJT-2026-0002', 
    (SELECT id FROM users WHERE email = 'supervisor@fragranza.com' LIMIT 1), 
    '2026-01-15', '09201234567', 'Business Administration student from UST'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'ojt2@fragranza.com');

-- Customer Account (for testing)
INSERT INTO users (email, password, first_name, last_name, role, status, phone)
SELECT 'customer@fragranza.com', @test_password, 'Test', 'Customer', 'customer', 'active', '09211234567'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'customer@fragranza.com');

-- Verify inserted accounts
SELECT id, email, CONCAT(first_name, ' ', last_name) AS name, role, status, employee_id, department 
FROM users 
ORDER BY FIELD(role, 'admin', 'ojt_supervisor', 'sales', 'ojt', 'customer'), id;
