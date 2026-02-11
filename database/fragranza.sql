-- Fragranza Olio Database Schema
-- Version: 1.0
-- Created: January 29, 2026

-- Create database
CREATE DATABASE IF NOT EXISTS fragranza_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fragranza_db;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INT,
    price DECIMAL(10, 2) NOT NULL,
    image_main VARCHAR(255),
    image_gallery JSON,
    ingredients TEXT,
    volume VARCHAR(50),
    concentration VARCHAR(100),
    stock_status ENUM('in_stock', 'out_of_stock', 'coming_soon') DEFAULT 'in_stock',
    featured BOOLEAN DEFAULT FALSE,
    is_new BOOLEAN DEFAULT FALSE,
    rating DECIMAL(2, 1) DEFAULT 0,
    review_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contact inquiries table
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Newsletter subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    status ENUM('active', 'unsubscribed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample categories
INSERT INTO categories (name, slug, description, image) VALUES
('Perfumes', 'perfumes', 'Luxury eau de parfum and eau de toilette collections', 'categories/perfumes.jpg'),
('Cosmetics', 'cosmetics', 'Premium makeup and beauty products', 'categories/cosmetics.jpg'),
('Essential Oils', 'oils', 'Pure and therapeutic grade essential oils', 'categories/oils.jpg'),
('Skincare', 'skincare', 'Advanced skincare solutions for all skin types', 'categories/skincare.jpg');

-- Insert sample products
INSERT INTO products (name, description, category_id, price, image_main, image_gallery, ingredients, volume, concentration, stock_status, featured, is_new, rating, review_count) VALUES
(
    'Midnight Rose Eau de Parfum',
    'An enchanting blend of Bulgarian rose, midnight jasmine, and warm amber. This luxurious eau de parfum captures the essence of a moonlit garden, where roses bloom under the stars. Perfect for evening occasions and romantic moments.',
    1,
    3500.00,
    'products/midnight-rose.jpg',
    '["products/midnight-rose-1.jpg", "products/midnight-rose-2.jpg", "products/midnight-rose-3.jpg"]',
    'Bulgarian Rose, Jasmine Sambac, Amber, Sandalwood, Musk, Bergamot, Pink Pepper',
    '100ml',
    'Eau de Parfum',
    'in_stock',
    TRUE,
    TRUE,
    4.8,
    124
),
(
    'Golden Amber Essence',
    'A warm and sophisticated fragrance featuring rich amber, golden honey, and vanilla. This essence creates an aura of elegance and confidence.',
    3,
    4200.00,
    'products/golden-amber.jpg',
    '["products/golden-amber-1.jpg", "products/golden-amber-2.jpg"]',
    'Amber, Honey, Vanilla, Sandalwood, Benzoin',
    '50ml',
    'Essential Oil Blend',
    'in_stock',
    TRUE,
    FALSE,
    4.6,
    89
),
(
    'Velvet Orchid Collection',
    'An opulent blend of black orchid, dark chocolate, and rich spices. This sultry fragrance is perfect for those who dare to stand out.',
    1,
    2800.00,
    'products/velvet-orchid.jpg',
    '["products/velvet-orchid-1.jpg", "products/velvet-orchid-2.jpg"]',
    'Black Orchid, Dark Chocolate, Cardamom, Saffron, Vanilla',
    '75ml',
    'Eau de Parfum',
    'in_stock',
    FALSE,
    TRUE,
    4.7,
    67
),
(
    'Pure Radiance Serum',
    'A lightweight yet powerful serum that delivers intense hydration and brightening effects. Formulated with vitamin C and hyaluronic acid.',
    4,
    1950.00,
    'products/pure-radiance.jpg',
    '["products/pure-radiance-1.jpg"]',
    'Vitamin C, Hyaluronic Acid, Niacinamide, Green Tea Extract',
    '30ml',
    'Serum',
    'in_stock',
    FALSE,
    FALSE,
    4.5,
    156
),
(
    'Ocean Breeze Cologne',
    'A fresh and invigorating cologne that captures the essence of a seaside morning. Light, crisp, and perfect for everyday wear.',
    1,
    2500.00,
    'products/ocean-breeze.jpg',
    '["products/ocean-breeze-1.jpg", "products/ocean-breeze-2.jpg"]',
    'Sea Salt, Bergamot, Cucumber, White Musk, Driftwood',
    '100ml',
    'Eau de Cologne',
    'in_stock',
    FALSE,
    FALSE,
    4.4,
    98
),
(
    'Lavender Dreams Oil',
    'Pure lavender essential oil sourced from Provence. Known for its calming properties and soothing aroma.',
    3,
    1800.00,
    'products/lavender-dreams.jpg',
    '["products/lavender-dreams-1.jpg"]',
    '100% Pure Lavender Essential Oil (Lavandula angustifolia)',
    '15ml',
    'Pure Essential Oil',
    'in_stock',
    FALSE,
    TRUE,
    4.9,
    203
),
(
    'Matte Velvet Lipstick Set',
    'A collection of 6 long-lasting matte lipsticks in versatile shades. Enriched with vitamin E for comfortable wear.',
    2,
    2200.00,
    'products/matte-lipstick.jpg',
    '["products/matte-lipstick-1.jpg", "products/matte-lipstick-2.jpg"]',
    'Vitamin E, Jojoba Oil, Candelilla Wax, Natural Pigments',
    '6 x 3.5g',
    'Matte Lipstick',
    'in_stock',
    FALSE,
    FALSE,
    4.6,
    178
),
(
    'Citrus Burst Parfum',
    'An energizing blend of Italian lemon, grapefruit, and orange blossom. This vibrant fragrance awakens the senses.',
    1,
    3200.00,
    'products/citrus-burst.jpg',
    '["products/citrus-burst-1.jpg", "products/citrus-burst-2.jpg"]',
    'Italian Lemon, Pink Grapefruit, Orange Blossom, White Tea, Cedar',
    '100ml',
    'Eau de Parfum',
    'in_stock',
    TRUE,
    FALSE,
    4.7,
    145
),
(
    'Anti-Aging Night Cream',
    'A rich night cream that works while you sleep. Formulated with retinol and peptides to reduce fine lines and wrinkles.',
    4,
    2800.00,
    'products/night-cream.jpg',
    '["products/night-cream-1.jpg"]',
    'Retinol, Peptides, Shea Butter, Vitamin E, Hyaluronic Acid',
    '50ml',
    'Night Cream',
    'in_stock',
    FALSE,
    FALSE,
    4.5,
    112
),
(
    'Rose Gold Highlighter Palette',
    'A stunning palette of 4 rose gold highlighters for a luminous glow. Buildable formula for subtle to dramatic effects.',
    2,
    1650.00,
    'products/highlighter.jpg',
    '["products/highlighter-1.jpg", "products/highlighter-2.jpg"]',
    'Mica, Silica, Vitamin E, Jojoba Oil',
    '4 x 3g',
    'Highlighter',
    'in_stock',
    FALSE,
    TRUE,
    4.8,
    89
),
(
    'Sandalwood Oud Intense',
    'A luxurious blend of Indian sandalwood and rare oud. This intense fragrance is for the true connoisseur.',
    1,
    5500.00,
    'products/sandalwood-oud.jpg',
    '["products/sandalwood-oud-1.jpg", "products/sandalwood-oud-2.jpg"]',
    'Indian Sandalwood, Cambodian Oud, Rose Absolute, Saffron, Musk',
    '50ml',
    'Parfum Intense',
    'in_stock',
    TRUE,
    FALSE,
    4.9,
    56
),
(
    'Tea Tree Essential Oil',
    'Pure Australian tea tree oil known for its antibacterial and healing properties. Perfect for skincare routines.',
    3,
    1200.00,
    'products/tea-tree.jpg',
    '["products/tea-tree-1.jpg"]',
    '100% Pure Tea Tree Essential Oil (Melaleuca alternifolia)',
    '15ml',
    'Pure Essential Oil',
    'in_stock',
    FALSE,
    FALSE,
    4.7,
    234
);

-- Create indexes for better performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_products_status ON products(stock_status);
CREATE INDEX idx_inquiries_status ON contact_inquiries(status);
CREATE INDEX idx_inquiries_type ON contact_inquiries(inquiry_type);
