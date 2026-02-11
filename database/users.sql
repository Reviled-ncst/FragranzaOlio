-- Fragranza Olio - Users Table Schema
-- Version: 1.1
-- Created: February 1, 2026
-- Updated: February 1, 2026

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS fragranza_db 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE fragranza_db;

-- Users table for customer registration
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Personal Information
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    birth_date DATE,
    gender ENUM('male', 'female', 'other') DEFAULT NULL,
    
    -- Contact Information
    phone VARCHAR(20),
    address VARCHAR(255),
    city VARCHAR(100),
    province VARCHAR(100),
    zip_code VARCHAR(10),
    
    -- Account Information
    password_hash VARCHAR(255) NOT NULL,
    
    -- Preferences
    subscribe_newsletter BOOLEAN DEFAULT FALSE,
    
    -- Account Status
    status ENUM('active', 'inactive', 'suspended', 'pending_verification') DEFAULT 'pending_verification',
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(100),
    email_verification_expires DATETIME,
    
    -- Password Reset
    password_reset_token VARCHAR(100),
    password_reset_expires DATETIME,
    
    -- Social Login (optional)
    google_id VARCHAR(100),
    facebook_id VARCHAR(100),
    
    -- Metadata
    last_login DATETIME,
    login_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_users_email (email),
    INDEX idx_users_status (status),
    INDEX idx_users_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User sessions table for token-based authentication
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_token (session_token),
    INDEX idx_session_user (user_id),
    INDEX idx_session_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User activity log for analytics
CREATE TABLE IF NOT EXISTS user_activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    activity_type ENUM('login', 'logout', 'register', 'password_change', 'profile_update', 'password_reset') NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_activity_user (user_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_activity_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SAMPLE DATA (Pre-filled for testing/development)
-- =====================================================

-- Clear existing data (optional - comment out in production)
-- TRUNCATE TABLE user_activity_log;
-- TRUNCATE TABLE user_sessions;
-- TRUNCATE TABLE users;

-- Insert sample users
-- Password for all test users: "Test@1234" (bcrypt hashed with cost=12)
-- Hash generated from: password_hash('Test@1234', PASSWORD_BCRYPT, ['cost' => 12])

INSERT INTO users (
    first_name, last_name, email, birth_date, gender,
    phone, address, city, province, zip_code,
    password_hash, subscribe_newsletter, status, email_verified,
    last_login, login_count, created_at
) VALUES 
-- Admin/Test User
(
    'Admin', 'User', 'admin@fragranza.com', '1990-01-15', 'male',
    '09171234567', '123 Admin Street', 'Makati City', 'Metro Manila', '1200',
    '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4S3p0K6aDmJa5.Gq', TRUE, 'active', TRUE,
    NOW(), 15, '2025-01-01 08:00:00'
),
-- Female Customer
(
    'Maria', 'Santos', 'maria.santos@email.com', '1995-06-20', 'female',
    '09281234567', '456 Jasmine Avenue', 'Quezon City', 'Metro Manila', '1100',
    '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4S3p0K6aDmJa5.Gq', TRUE, 'active', TRUE,
    NOW(), 8, '2025-03-15 10:30:00'
),
-- Male Customer
(
    'Juan', 'Dela Cruz', 'juan.delacruz@email.com', '1988-11-08', 'male',
    '09351234567', '789 Sampaguita Lane', 'Cebu City', 'Cebu', '6000',
    '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4S3p0K6aDmJa5.Gq', FALSE, 'active', TRUE,
    NOW(), 3, '2025-06-22 14:15:00'
),
-- New Unverified User
(
    'Ana', 'Reyes', 'ana.reyes@email.com', '2000-03-25', 'female',
    '09451234567', '321 Orchid Street', 'Davao City', 'Davao del Sur', '8000',
    '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4S3p0K6aDmJa5.Gq', TRUE, 'pending_verification', FALSE,
    NULL, 0, '2026-01-28 09:45:00'
),
-- Newsletter Subscriber
(
    'Carlo', 'Mendoza', 'carlo.mendoza@email.com', '1992-08-12', 'male',
    '09551234567', '654 Rose Boulevard', 'Pasig City', 'Metro Manila', '1600',
    '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4S3p0K6aDmJa5.Gq', TRUE, 'active', TRUE,
    NOW(), 12, '2025-04-10 16:20:00'
),
-- Inactive User
(
    'Sofia', 'Garcia', 'sofia.garcia@email.com', '1998-12-03', 'female',
    '09651234567', '987 Tulip Road', 'Taguig City', 'Metro Manila', '1630',
    '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4S3p0K6aDmJa5.Gq', FALSE, 'inactive', TRUE,
    '2025-08-15 11:00:00', 2, '2025-05-20 13:10:00'
),
-- Young Customer
(
    'Miguel', 'Torres', 'miguel.torres@email.com', '2005-07-18', 'male',
    '09751234567', '147 Daisy Court', 'Mandaluyong City', 'Metro Manila', '1550',
    '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4S3p0K6aDmJa5.Gq', TRUE, 'active', TRUE,
    NOW(), 5, '2025-09-05 18:30:00'
),
-- Premium Customer (high login count)
(
    'Isabella', 'Villanueva', 'isabella.villanueva@email.com', '1985-04-30', 'female',
    '09851234567', '258 Lily Lane', 'San Juan City', 'Metro Manila', '1500',
    '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4S3p0K6aDmJa5.Gq', TRUE, 'active', TRUE,
    NOW(), 45, '2024-11-01 07:00:00'
)
ON DUPLICATE KEY UPDATE 
    first_name = VALUES(first_name),
    last_name = VALUES(last_name);

-- Insert sample activity logs
INSERT INTO user_activity_log (user_id, activity_type, ip_address, user_agent, details, created_at) VALUES
(1, 'register', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', '{"source": "website"}', '2025-01-01 08:00:00'),
(1, 'login', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', '{"method": "password"}', '2025-01-01 08:05:00'),
(2, 'register', '192.168.1.101', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604.1', '{"source": "mobile"}', '2025-03-15 10:30:00'),
(2, 'login', '192.168.1.101', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604.1', '{"method": "password"}', '2025-03-15 10:35:00'),
(3, 'register', '192.168.1.102', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15', '{"source": "website"}', '2025-06-22 14:15:00'),
(5, 'register', '192.168.1.104', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/121.0', '{"source": "website"}', '2025-04-10 16:20:00'),
(5, 'profile_update', '192.168.1.104', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/121.0', '{"fields": ["phone", "address"]}', '2025-04-15 09:00:00'),
(8, 'register', '192.168.1.107', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0', '{"source": "website"}', '2024-11-01 07:00:00'),
(8, 'login', '192.168.1.107', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0', '{"method": "password"}', '2026-01-31 10:00:00'),
(8, 'password_change', '192.168.1.107', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0', '{"reason": "user_initiated"}', '2025-12-01 15:30:00');

-- =====================================================
-- Verification Query (Run to check data)
-- =====================================================
-- SELECT id, first_name, last_name, email, gender, city, status, email_verified, login_count 
-- FROM users ORDER BY created_at;
