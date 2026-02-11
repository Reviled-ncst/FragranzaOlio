-- =====================================================
-- Fragranza Olio - Complete Database Setup
-- XAMPP/MySQL - All-in-One Installation Script
-- Version: 2.0
-- Date: February 5, 2026
-- =====================================================

-- Create database
CREATE DATABASE IF NOT EXISTS fragranza_db 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE fragranza_db;

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Personal Information
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role ENUM('customer', 'sales', 'admin') NOT NULL DEFAULT 'customer',
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
    
    -- Social Login
    google_id VARCHAR(100),
    facebook_id VARCHAR(100),
    
    -- Metadata
    last_login DATETIME,
    login_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_users_email (email),
    INDEX idx_users_status (status),
    INDEX idx_users_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- USER SESSIONS TABLE
-- =====================================================
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

-- =====================================================
-- USER ACTIVITY LOG
-- =====================================================
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
-- CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    parent_id INT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_slug (slug),
    INDEX idx_active (is_active),
    INDEX idx_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    short_description VARCHAR(500),
    category_id INT,
    
    -- Pricing
    price DECIMAL(10,2) NOT NULL,
    compare_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    
    -- Identification
    sku VARCHAR(50) UNIQUE,
    barcode VARCHAR(50),
    
    -- Images
    image_main TEXT,
    image_gallery JSON,
    
    -- Product Details
    volume VARCHAR(50),
    concentration VARCHAR(50),
    ingredients TEXT,
    notes_top TEXT,
    notes_middle TEXT,
    notes_base TEXT,
    
    -- Inventory
    stock_quantity INT DEFAULT 0,
    stock_status VARCHAR(20) DEFAULT 'in_stock',
    low_stock_threshold INT DEFAULT 10,
    
    -- Flags
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_new BOOLEAN DEFAULT FALSE,
    is_on_sale BOOLEAN DEFAULT FALSE,
    
    -- SEO
    meta_title VARCHAR(200),
    meta_description VARCHAR(500),
    
    -- Stats
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    sold_count INT DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_category (category_id),
    INDEX idx_slug (slug),
    INDEX idx_sku (sku),
    INDEX idx_featured (is_featured),
    INDEX idx_new (is_new),
    INDEX idx_price (price),
    INDEX idx_active (is_active),
    INDEX idx_stock_status (stock_status),
    CONSTRAINT chk_stock_status CHECK (stock_status IN ('in_stock', 'out_of_stock', 'low_stock', 'coming_soon'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- CONTACT INQUIRIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS contact_inquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    company VARCHAR(100),
    inquiry_type ENUM('product', 'wholesale', 'manufacturing', 'private-label', 'general') DEFAULT 'general',
    message TEXT NOT NULL,
    status ENUM('new', 'read', 'replied', 'closed') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_type (inquiry_type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- NEWSLETTER SUBSCRIBERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    status ENUM('active', 'unsubscribed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INSERT SAMPLE USERS
-- =====================================================
-- Password for all test users: "Test@1234" (bcrypt hashed)
INSERT INTO users (first_name, last_name, email, role, birth_date, gender, phone, address, city, province, zip_code, password_hash, subscribe_newsletter, status, email_verified, last_login, login_count, created_at) VALUES 
('Admin', 'User', 'admin@fragranza.com', 'admin', '1990-01-15', 'male', '09171234567', '123 Admin Street', 'Makati City', 'Metro Manila', '1200', '$2y$10$HS1N7AJ9YsIS2yL7D2K/CeG7U3UvVuKeROVZ3JDWWT3XxQJcQq5re', TRUE, 'active', TRUE, NOW(), 15, '2025-01-01 08:00:00'),
('Sales', 'Representative', 'vendor0qw@gmail.com', 'sales', '1992-05-10', 'male', '09181234567', '456 Sales Ave', 'Quezon City', 'Metro Manila', '1100', '$2y$10$HS1N7AJ9YsIS2yL7D2K/CeG7U3UvVuKeROVZ3JDWWT3XxQJcQq5re', TRUE, 'active', TRUE, NOW(), 20, '2025-02-01 09:00:00'),
('Maria', 'Santos', 'maria.santos@email.com', 'customer', '1995-06-20', 'female', '09281234567', '456 Jasmine Avenue', 'Quezon City', 'Metro Manila', '1100', '$2y$10$HS1N7AJ9YsIS2yL7D2K/CeG7U3UvVuKeROVZ3JDWWT3XxQJcQq5re', TRUE, 'active', TRUE, NOW(), 8, '2025-03-15 10:30:00'),
('Juan', 'Dela Cruz', 'juan.delacruz@email.com', 'customer', '1988-11-08', 'male', '09351234567', '789 Sampaguita Lane', 'Cebu City', 'Cebu', '6000', '$2y$10$HS1N7AJ9YsIS2yL7D2K/CeG7U3UvVuKeROVZ3JDWWT3XxQJcQq5re', FALSE, 'active', TRUE, NOW(), 3, '2025-06-22 14:15:00')
ON DUPLICATE KEY UPDATE first_name = VALUES(first_name);

-- =====================================================
-- INSERT CATEGORIES
-- =====================================================
INSERT INTO categories (name, slug, description, sort_order) VALUES
    ('Women''s Perfume', 'womens-perfume', 'Elegant fragrances for women', 1),
    ('Men''s Perfume', 'mens-perfume', 'Sophisticated scents for men', 2),
    ('Car Diffuser', 'car-diffuser', 'Premium car air fresheners', 3),
    ('Dish Washing', 'dish-washing', 'Scented dish washing liquids', 4),
    ('Soap', 'soap', 'Luxurious scented soaps', 5),
    ('Alcohol', 'alcohol', 'Scented sanitizing alcohol', 6),
    ('Helmet Spray', 'helmet-spray', 'Fresh helmet deodorizers', 7),
    ('Disinfectants', 'disinfectants', 'Scented disinfectant products', 8)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =====================================================
-- INSERT SAMPLE PRODUCTS
-- =====================================================
INSERT INTO products (name, slug, category_id, price, image_main, volume, concentration, stock_quantity, is_featured, is_new, short_description, sku) VALUES
    -- Women's Perfumes (category_id = 1)
    ('Blossom', 'blossom', 1, 380.00, '/assets/images/Women''s Perfume/G1 Blossom.png', '50ml', 'Eau de Parfum', 100, TRUE, TRUE, 'A delicate floral fragrance with notes of rose and jasmine', 'WP-001'),
    ('Aurora', 'aurora', 1, 420.00, '/assets/images/Women''s Perfume/G3 Aurora.png', '50ml', 'Eau de Parfum', 85, TRUE, FALSE, 'Radiant and uplifting with citrus and vanilla notes', 'WP-002'),
    ('Beatrice', 'beatrice', 1, 395.00, '/assets/images/Women''s Perfume/G4 Beatrice.png', '50ml', 'Eau de Parfum', 92, FALSE, TRUE, 'Elegant and sophisticated with amber undertones', 'WP-003'),
    ('Behind Scent', 'behind-scent', 1, 350.00, '/assets/images/Women''s Perfume/G5 Behind Scent.png', '50ml', 'Eau de Parfum', 120, FALSE, FALSE, 'Mysterious and alluring evening fragrance', 'WP-004'),
    ('Bella', 'bella', 1, 365.00, '/assets/images/Women''s Perfume/G6 Bella.png', '50ml', 'Eau de Parfum', 78, TRUE, FALSE, 'Sweet and feminine with fruity notes', 'WP-005'),
    ('Berry Wine', 'berry-wine', 1, 340.00, '/assets/images/Women''s Perfume/G7 Berry Wine.png', '50ml', 'Eau de Parfum', 95, FALSE, FALSE, 'Rich and warm with berry and wine accords', 'WP-006'),
    ('Blue Heart', 'blue-heart', 1, 385.00, '/assets/images/Women''s Perfume/G8 Blue Heart.png', '50ml', 'Eau de Parfum', 88, FALSE, TRUE, 'Fresh and aquatic with ocean-inspired notes', 'WP-007'),
    ('Choco Tart', 'choco-tart', 1, 355.00, '/assets/images/Women''s Perfume/G9 Choco Tart.png', '50ml', 'Eau de Parfum', 65, FALSE, FALSE, 'Gourmand fragrance with chocolate and caramel', 'WP-008'),
    ('Chloe', 'chloe', 1, 410.00, '/assets/images/Women''s Perfume/G10 Chloe.png', '50ml', 'Eau de Parfum', 72, TRUE, FALSE, 'Classic and timeless floral bouquet', 'WP-009'),
    ('Cotton Love', 'cotton-love', 1, 360.00, '/assets/images/Women''s Perfume/G11 Cotton Love.png', '50ml', 'Eau de Parfum', 110, FALSE, FALSE, 'Clean and fresh like fresh laundry', 'WP-010'),
    ('Crescent Euphoria', 'crescent-euphoria', 1, 450.00, '/assets/images/Women''s Perfume/G12 Crescent Europhia.png', '50ml', 'Eau de Parfum', 60, TRUE, TRUE, 'Luxurious and intoxicating night fragrance', 'WP-011'),
    ('Decent Moon', 'decent-moon', 1, 390.00, '/assets/images/Women''s Perfume/G13 Decent Moon.png', '50ml', 'Eau de Parfum', 88, FALSE, FALSE, 'Soft and romantic moonlit essence', 'WP-012'),
    ('Eternal Splash', 'eternal-splash', 1, 375.00, '/assets/images/Women''s Perfume/G14 Eternal Splash.png', '50ml', 'Eau de Parfum', 95, TRUE, FALSE, 'Refreshing aquatic floral blend', 'WP-013'),
    ('Fairy Princess', 'fairy-princess', 1, 425.00, '/assets/images/Women''s Perfume/G15 Fairy Princess.png', '50ml', 'Eau de Parfum', 55, FALSE, TRUE, 'Magical and whimsical sweet fragrance', 'WP-014'),
    ('Felicity', 'felicity', 1, 380.00, '/assets/images/Women''s Perfume/G16 Felicity.png', '50ml', 'Eau de Parfum', 100, FALSE, TRUE, 'Joyful and uplifting fruity floral', 'WP-015'),
    
    -- Men's Perfumes (category_id = 2)
    ('Bleu Royale', 'bleu-royale', 2, 450.00, '/assets/images/Men''s Perfume/B1 Bleu Royale.png', '50ml', 'Eau de Parfum', 80, TRUE, TRUE, 'Regal and commanding masculine scent', 'MP-001'),
    ('Dark Knight', 'dark-knight', 2, 420.00, '/assets/images/Men''s Perfume/B2 Dark Knight.png', '50ml', 'Eau de Parfum', 90, TRUE, FALSE, 'Bold and mysterious with leather notes', 'MP-002'),
    ('Ocean Breeze', 'ocean-breeze', 2, 380.00, '/assets/images/Men''s Perfume/B3 Ocean Breeze.png', '50ml', 'Eau de Toilette', 115, FALSE, TRUE, 'Fresh aquatic scent for everyday wear', 'MP-003'),
    ('Gentleman', 'gentleman', 2, 400.00, '/assets/images/Men''s Perfume/B4 Gentleman.png', '50ml', 'Eau de Parfum', 75, TRUE, FALSE, 'Sophisticated and refined for the modern man', 'MP-004'),
    ('Noir Intense', 'noir-intense', 2, 440.00, '/assets/images/Men''s Perfume/B5 Noir Intense.png', '50ml', 'Eau de Parfum', 68, TRUE, TRUE, 'Deep and intense woody oriental', 'MP-005'),
    ('Sport Active', 'sport-active', 2, 350.00, '/assets/images/Men''s Perfume/B6 Sport Active.png', '50ml', 'Eau de Toilette', 130, FALSE, FALSE, 'Energizing fresh scent for active lifestyle', 'MP-006'),
    
    -- Car Diffusers (category_id = 3)
    ('Fresh Pine', 'fresh-pine', 3, 180.00, '/assets/images/Car Diffuser/CD1 Fresh Pine.png', '10ml', 'Essential Oil', 200, TRUE, FALSE, 'Refreshing pine forest scent', 'CD-001'),
    ('Ocean Mist', 'ocean-mist-car', 3, 180.00, '/assets/images/Car Diffuser/CD2 Ocean Mist.png', '10ml', 'Essential Oil', 185, FALSE, TRUE, 'Cool ocean breeze fragrance', 'CD-002'),
    ('Vanilla Dream', 'vanilla-dream-car', 3, 180.00, '/assets/images/Car Diffuser/CD3 Vanilla Dream.png', '10ml', 'Essential Oil', 175, TRUE, FALSE, 'Sweet vanilla comfort', 'CD-003'),
    
    -- Soaps (category_id = 5)
    ('Lavender Dream', 'lavender-dream', 5, 95.00, '/assets/images/Soap/S1 Lavender Dream.png', '100g', 'Bar Soap', 300, TRUE, FALSE, 'Calming lavender scented soap', 'SP-001'),
    ('Citrus Burst', 'citrus-burst', 5, 95.00, '/assets/images/Soap/S2 Citrus Burst.png', '100g', 'Bar Soap', 280, FALSE, TRUE, 'Energizing citrus soap', 'SP-002'),
    ('Rose Garden', 'rose-garden', 5, 110.00, '/assets/images/Soap/S3 Rose Garden.png', '100g', 'Bar Soap', 250, TRUE, FALSE, 'Luxurious rose petal soap', 'SP-003'),
    
    -- Alcohol (category_id = 6)
    ('Fresh Clean', 'fresh-clean-alcohol', 6, 150.00, '/assets/images/Alcohol/A1 Fresh Clean.png', '500ml', 'Sanitizer', 400, TRUE, TRUE, '70% alcohol with fresh clean scent', 'AL-001'),
    ('Lavender Sanitizer', 'lavender-sanitizer', 6, 150.00, '/assets/images/Alcohol/A2 Lavender.png', '500ml', 'Sanitizer', 350, FALSE, FALSE, 'Calming lavender sanitizing alcohol', 'AL-002')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =====================================================
-- VERIFICATION & SUMMARY
-- =====================================================
SELECT '✅ Database setup complete!' as status;
SELECT CONCAT('📊 Total users: ', COUNT(*)) as result FROM users;
SELECT CONCAT('📦 Total categories: ', COUNT(*)) as result FROM categories;
SELECT CONCAT('🛍️ Total products: ', COUNT(*)) as result FROM products;
SELECT '🚀 Ready to use!' as message;
