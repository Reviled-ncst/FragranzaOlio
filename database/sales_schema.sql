-- Fragranza Olio - Sales System Schema
-- Version: 1.0
-- Created: February 10, 2026

USE fragranza_db;

-- =====================================================
-- USER SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    
    -- Notification Preferences
    email_order_updates BOOLEAN DEFAULT TRUE,
    email_promotions BOOLEAN DEFAULT TRUE,
    email_newsletter BOOLEAN DEFAULT TRUE,
    push_order_updates BOOLEAN DEFAULT TRUE,
    push_promotions BOOLEAN DEFAULT FALSE,
    sms_order_updates BOOLEAN DEFAULT FALSE,
    
    -- Display Preferences
    theme VARCHAR(20) DEFAULT 'dark',
    language VARCHAR(10) DEFAULT 'en',
    currency VARCHAR(10) DEFAULT 'PHP',
    timezone VARCHAR(50) DEFAULT 'Asia/Manila',
    
    -- Privacy Settings
    profile_visibility ENUM('public', 'private', 'contacts') DEFAULT 'private',
    show_online_status BOOLEAN DEFAULT TRUE,
    allow_marketing_emails BOOLEAN DEFAULT TRUE,
    
    -- Security Settings
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_method ENUM('sms', 'email', 'app') DEFAULT 'email',
    login_notifications BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_settings_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- CUSTOMERS TABLE (for sales tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    
    -- Customer Info
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    
    -- Address
    address VARCHAR(255),
    city VARCHAR(100),
    province VARCHAR(100),
    zip_code VARCHAR(10),
    country VARCHAR(50) DEFAULT 'Philippines',
    
    -- Customer Status
    status ENUM('active', 'inactive', 'vip') DEFAULT 'active',
    customer_type ENUM('retail', 'wholesale', 'distributor') DEFAULT 'retail',
    
    -- Stats
    total_orders INT DEFAULT 0,
    total_spent DECIMAL(12, 2) DEFAULT 0.00,
    average_order_value DECIMAL(10, 2) DEFAULT 0.00,
    last_order_date DATE,
    
    -- Notes
    notes TEXT,
    tags JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_customers_email (email),
    INDEX idx_customers_status (status),
    INDEX idx_customers_type (customer_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(20) NOT NULL UNIQUE,
    customer_id INT,
    user_id INT,
    
    -- Order Details
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    discount_code VARCHAR(50),
    shipping_fee DECIMAL(10, 2) DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL,
    
    -- Status
    status ENUM('pending', 'confirmed', 'processing', 'in_transit', 'delivered', 'completed', 'cancelled', 'return_requested', 'return_approved', 'returned', 'refunded') DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded', 'partial') DEFAULT 'pending',
    payment_method ENUM('cod', 'gcash', 'maya', 'bank_transfer', 'credit_card') DEFAULT 'cod',
    
    -- Shipping Info
    shipping_first_name VARCHAR(50),
    shipping_last_name VARCHAR(50),
    shipping_email VARCHAR(100),
    shipping_phone VARCHAR(20),
    shipping_address VARCHAR(255),
    shipping_city VARCHAR(100),
    shipping_province VARCHAR(100),
    shipping_zip_code VARCHAR(10),
    shipping_notes TEXT,
    
    -- Tracking
    tracking_number VARCHAR(100),
    courier VARCHAR(50),
    shipped_at DATETIME,
    delivered_at DATETIME,
    
    -- Metadata
    ip_address VARCHAR(45),
    user_agent TEXT,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_orders_number (order_number),
    INDEX idx_orders_customer (customer_id),
    INDEX idx_orders_status (status),
    INDEX idx_orders_payment (payment_status),
    INDEX idx_orders_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ORDER ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT,
    
    -- Item Details
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(50),
    variation VARCHAR(100),
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    
    -- Metadata
    product_snapshot JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_order_items_order (order_id),
    INDEX idx_order_items_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INVOICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(20) NOT NULL UNIQUE,
    order_id INT,
    customer_id INT,
    
    -- Invoice Details
    subtotal DECIMAL(12, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL,
    
    -- Payment
    status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded') DEFAULT 'draft',
    payment_method VARCHAR(50),
    paid_at DATETIME,
    paid_amount DECIMAL(12, 2) DEFAULT 0.00,
    
    -- Dates
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    
    -- Billing Info
    billing_name VARCHAR(100),
    billing_email VARCHAR(100),
    billing_phone VARCHAR(20),
    billing_address TEXT,
    
    -- Notes
    notes TEXT,
    terms TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    INDEX idx_invoices_number (invoice_number),
    INDEX idx_invoices_order (order_id),
    INDEX idx_invoices_status (status),
    INDEX idx_invoices_due (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- COMPLAINTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(20) NOT NULL UNIQUE,
    customer_id INT,
    order_id INT,
    user_id INT,
    
    -- Complaint Details
    subject VARCHAR(255) NOT NULL,
    category ENUM('product_quality', 'shipping', 'wrong_item', 'damaged', 'refund', 'service', 'other') NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('new', 'open', 'in_progress', 'resolved', 'closed') DEFAULT 'new',
    
    -- Description
    description TEXT NOT NULL,
    attachments JSON,
    
    -- Resolution
    resolution TEXT,
    resolved_by INT,
    resolved_at DATETIME,
    
    -- Assignment
    assigned_to INT,
    assigned_at DATETIME,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_complaints_ticket (ticket_number),
    INDEX idx_complaints_status (status),
    INDEX idx_complaints_priority (priority),
    INDEX idx_complaints_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- COMPLAINT MESSAGES TABLE (for conversation thread)
-- =====================================================
CREATE TABLE IF NOT EXISTS complaint_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    user_id INT,
    
    message TEXT NOT NULL,
    is_staff_reply BOOLEAN DEFAULT FALSE,
    attachments JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_complaint_messages_complaint (complaint_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Sample Customers
INSERT INTO customers (first_name, last_name, email, phone, address, city, province, zip_code, status, customer_type, total_orders, total_spent) VALUES
('Maria', 'Santos', 'maria.santos@email.com', '09281234567', '456 Jasmine Avenue', 'Quezon City', 'Metro Manila', '1100', 'vip', 'retail', 15, 52500.00),
('Juan', 'Dela Cruz', 'juan.delacruz@email.com', '09351234567', '789 Sampaguita Lane', 'Cebu City', 'Cebu', '6000', 'active', 'retail', 5, 12500.00),
('Isabella', 'Villanueva', 'isabella.villanueva@email.com', '09851234567', '258 Lily Lane', 'San Juan City', 'Metro Manila', '1500', 'vip', 'wholesale', 28, 185000.00),
('Carlo', 'Mendoza', 'carlo.mendoza@email.com', '09551234567', '654 Rose Boulevard', 'Pasig City', 'Metro Manila', '1600', 'active', 'retail', 8, 24000.00),
('Ana', 'Reyes', 'ana.reyes@email.com', '09451234567', '321 Orchid Street', 'Davao City', 'Davao del Sur', '8000', 'active', 'retail', 3, 8500.00),
('Miguel', 'Torres', 'miguel.torres@email.com', '09751234567', '147 Daisy Court', 'Mandaluyong City', 'Metro Manila', '1550', 'inactive', 'retail', 1, 2800.00),
('Sofia', 'Garcia', 'sofia.garcia@email.com', '09651234567', '987 Tulip Road', 'Taguig City', 'Metro Manila', '1630', 'active', 'distributor', 42, 320000.00),
('Pedro', 'Gonzales', 'pedro.gonzales@email.com', '09151234567', '123 Dahlia Street', 'Makati City', 'Metro Manila', '1200', 'active', 'retail', 6, 18500.00)
ON DUPLICATE KEY UPDATE first_name = VALUES(first_name);

-- Sample Orders
INSERT INTO orders (order_number, customer_id, subtotal, shipping_fee, tax_amount, total_amount, status, payment_status, payment_method, shipping_first_name, shipping_last_name, shipping_phone, shipping_address, shipping_city, shipping_province, shipping_zip_code, created_at) VALUES
('ORD-20260210-001', 1, 7000.00, 150.00, 840.00, 7990.00, 'delivered', 'paid', 'gcash', 'Maria', 'Santos', '09281234567', '456 Jasmine Avenue', 'Quezon City', 'Metro Manila', '1100', DATE_SUB(NOW(), INTERVAL 5 DAY)),
('ORD-20260210-002', 2, 3500.00, 200.00, 420.00, 4120.00, 'shipped', 'paid', 'bank_transfer', 'Juan', 'Dela Cruz', '09351234567', '789 Sampaguita Lane', 'Cebu City', 'Cebu', '6000', DATE_SUB(NOW(), INTERVAL 3 DAY)),
('ORD-20260210-003', 3, 12000.00, 0.00, 1440.00, 13440.00, 'processing', 'paid', 'credit_card', 'Isabella', 'Villanueva', '09851234567', '258 Lily Lane', 'San Juan City', 'Metro Manila', '1500', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('ORD-20260210-004', 4, 5200.00, 150.00, 624.00, 5974.00, 'pending', 'pending', 'cod', 'Carlo', 'Mendoza', '09551234567', '654 Rose Boulevard', 'Pasig City', 'Metro Manila', '1600', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('ORD-20260210-005', 5, 2800.00, 250.00, 336.00, 3386.00, 'confirmed', 'paid', 'maya', 'Ana', 'Reyes', '09451234567', '321 Orchid Street', 'Davao City', 'Davao del Sur', '8000', NOW()),
('ORD-20260210-006', 1, 4500.00, 150.00, 540.00, 5190.00, 'delivered', 'paid', 'gcash', 'Maria', 'Santos', '09281234567', '456 Jasmine Avenue', 'Quezon City', 'Metro Manila', '1100', DATE_SUB(NOW(), INTERVAL 10 DAY)),
('ORD-20260210-007', 3, 8500.00, 0.00, 1020.00, 9520.00, 'shipped', 'paid', 'bank_transfer', 'Isabella', 'Villanueva', '09851234567', '258 Lily Lane', 'San Juan City', 'Metro Manila', '1500', DATE_SUB(NOW(), INTERVAL 4 DAY)),
('ORD-20260210-008', 7, 25000.00, 0.00, 3000.00, 28000.00, 'processing', 'paid', 'bank_transfer', 'Sofia', 'Garcia', '09651234567', '987 Tulip Road', 'Taguig City', 'Metro Manila', '1630', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('ORD-20260210-009', 8, 3200.00, 150.00, 384.00, 3734.00, 'cancelled', 'refunded', 'gcash', 'Pedro', 'Gonzales', '09151234567', '123 Dahlia Street', 'Makati City', 'Metro Manila', '1200', DATE_SUB(NOW(), INTERVAL 7 DAY)),
('ORD-20260210-010', 4, 6800.00, 150.00, 816.00, 7766.00, 'pending', 'pending', 'cod', 'Carlo', 'Mendoza', '09551234567', '654 Rose Boulevard', 'Pasig City', 'Metro Manila', '1600', NOW())
ON DUPLICATE KEY UPDATE order_number = VALUES(order_number);

-- Sample Order Items
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price) VALUES
(1, 1, 'Midnight Rose Eau de Parfum', 2, 3500.00, 7000.00),
(2, 1, 'Midnight Rose Eau de Parfum', 1, 3500.00, 3500.00),
(3, 11, 'Sandalwood Oud Intense', 2, 5500.00, 11000.00),
(3, 6, 'Lavender Dreams Oil', 1, 1800.00, 1000.00),
(4, 8, 'Citrus Burst Parfum', 1, 3200.00, 3200.00),
(4, 4, 'Pure Radiance Serum', 1, 1950.00, 2000.00),
(5, 3, 'Velvet Orchid Collection', 1, 2800.00, 2800.00),
(6, 2, 'Golden Amber Essence', 1, 4200.00, 4500.00),
(7, 11, 'Sandalwood Oud Intense', 1, 5500.00, 5500.00),
(7, 8, 'Citrus Burst Parfum', 1, 3200.00, 3000.00),
(8, 11, 'Sandalwood Oud Intense', 4, 5500.00, 22000.00),
(8, 6, 'Lavender Dreams Oil', 2, 1800.00, 3000.00),
(9, 8, 'Citrus Burst Parfum', 1, 3200.00, 3200.00),
(10, 2, 'Golden Amber Essence', 1, 4200.00, 4200.00),
(10, 3, 'Velvet Orchid Collection', 1, 2800.00, 2600.00);

-- Sample Invoices
INSERT INTO invoices (invoice_number, order_id, customer_id, subtotal, tax_amount, total_amount, status, issue_date, due_date, billing_name, billing_email, billing_phone, billing_address) VALUES
('INV-20260210-001', 1, 1, 7000.00, 840.00, 7990.00, 'paid', DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_SUB(CURDATE(), INTERVAL 0 DAY), 'Maria Santos', 'maria.santos@email.com', '09281234567', '456 Jasmine Avenue, Quezon City'),
('INV-20260210-002', 2, 2, 3500.00, 420.00, 4120.00, 'paid', DATE_SUB(CURDATE(), INTERVAL 3 DAY), DATE_ADD(CURDATE(), INTERVAL 4 DAY), 'Juan Dela Cruz', 'juan.delacruz@email.com', '09351234567', '789 Sampaguita Lane, Cebu City'),
('INV-20260210-003', 3, 3, 12000.00, 1440.00, 13440.00, 'sent', DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_ADD(CURDATE(), INTERVAL 5 DAY), 'Isabella Villanueva', 'isabella.villanueva@email.com', '09851234567', '258 Lily Lane, San Juan City'),
('INV-20260210-004', 4, 4, 5200.00, 624.00, 5974.00, 'draft', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'Carlo Mendoza', 'carlo.mendoza@email.com', '09551234567', '654 Rose Boulevard, Pasig City'),
('INV-20260210-005', 6, 1, 4500.00, 540.00, 5190.00, 'paid', DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'Maria Santos', 'maria.santos@email.com', '09281234567', '456 Jasmine Avenue, Quezon City'),
('INV-20260210-006', 7, 3, 8500.00, 1020.00, 9520.00, 'sent', DATE_SUB(CURDATE(), INTERVAL 4 DAY), DATE_ADD(CURDATE(), INTERVAL 3 DAY), 'Isabella Villanueva', 'isabella.villanueva@email.com', '09851234567', '258 Lily Lane, San Juan City'),
('INV-20260210-007', 8, 7, 25000.00, 3000.00, 28000.00, 'sent', DATE_SUB(CURDATE(), INTERVAL 1 DAY), DATE_ADD(CURDATE(), INTERVAL 6 DAY), 'Sofia Garcia', 'sofia.garcia@email.com', '09651234567', '987 Tulip Road, Taguig City'),
('INV-20260210-008', 9, 8, 3200.00, 384.00, 3584.00, 'cancelled', DATE_SUB(CURDATE(), INTERVAL 7 DAY), CURDATE(), 'Pedro Gonzales', 'pedro.gonzales@email.com', '09151234567', '123 Dahlia Street, Makati City'),
('INV-20260210-009', NULL, 3, 15000.00, 1800.00, 16800.00, 'overdue', DATE_SUB(CURDATE(), INTERVAL 14 DAY), DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'Isabella Villanueva', 'isabella.villanueva@email.com', '09851234567', '258 Lily Lane, San Juan City')
ON DUPLICATE KEY UPDATE invoice_number = VALUES(invoice_number);

-- Sample Complaints
INSERT INTO complaints (ticket_number, customer_id, order_id, subject, category, priority, status, description, created_at) VALUES
('TKT-20260210-001', 2, 2, 'Package arrived damaged', 'damaged', 'high', 'open', 'The package arrived with visible damage. The outer box was crushed and the perfume bottle inside was cracked. Please advise on how to proceed with a replacement.', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('TKT-20260210-002', 4, 4, 'Wrong item received', 'wrong_item', 'medium', 'in_progress', 'I ordered Citrus Burst Parfum but received Midnight Rose instead. Please send the correct item.', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('TKT-20260210-003', 8, 9, 'Refund not yet received', 'refund', 'high', 'new', 'My order was cancelled 7 days ago but I still have not received my refund. The payment was made via GCash.', NOW()),
('TKT-20260210-004', 1, 1, 'Product quality concern', 'product_quality', 'low', 'resolved', 'The scent seems different from my previous purchase. Is there a new formulation?', DATE_SUB(NOW(), INTERVAL 10 DAY)),
('TKT-20260210-005', 5, 5, 'Delayed shipping', 'shipping', 'medium', 'open', 'My order was confirmed 3 days ago but the tracking still shows pending. When will it be shipped?', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('TKT-20260210-006', 3, 7, 'Request for invoice', 'service', 'low', 'closed', 'Can you please send me a copy of the invoice for my recent order? I need it for business purposes.', DATE_SUB(NOW(), INTERVAL 5 DAY))
ON DUPLICATE KEY UPDATE ticket_number = VALUES(ticket_number);

-- Sample Complaint Messages
INSERT INTO complaint_messages (complaint_id, user_id, message, is_staff_reply) VALUES
(1, NULL, 'The package arrived with visible damage. The outer box was crushed and the perfume bottle inside was cracked.', FALSE),
(1, 1, 'We apologize for the inconvenience. We will send a replacement immediately. Please keep the damaged item for our courier to pick up.', TRUE),
(2, NULL, 'I ordered Citrus Burst Parfum but received Midnight Rose instead.', FALSE),
(2, 1, 'We are sorry for the mix-up. We have dispatched the correct item and it should arrive within 2-3 business days.', TRUE),
(4, NULL, 'The scent seems different from my previous purchase.', FALSE),
(4, 1, 'Thank you for reaching out. Our formulation has not changed. Sometimes environmental factors can affect perception. However, we would be happy to offer you a 10% discount on your next purchase as a gesture of goodwill.', TRUE),
(4, NULL, 'Thank you for the explanation and the discount offer. I appreciate it!', FALSE),
(6, NULL, 'Can you please send me a copy of the invoice?', FALSE),
(6, 1, 'The invoice has been sent to your registered email address. Please check your inbox and spam folder.', TRUE);

-- Update resolved complaint
UPDATE complaints SET resolution = 'Offered 10% discount on next purchase. Customer satisfied.', resolved_by = 1, resolved_at = DATE_SUB(NOW(), INTERVAL 8 DAY) WHERE ticket_number = 'TKT-20260210-004';
UPDATE complaints SET resolution = 'Invoice sent via email.', resolved_by = 1, resolved_at = DATE_SUB(NOW(), INTERVAL 4 DAY) WHERE ticket_number = 'TKT-20260210-006';
