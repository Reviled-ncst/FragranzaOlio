-- Inventory Management System Schema
-- Run this in phpMyAdmin for fragranza_db

-- Branches/Locations Table
CREATE TABLE IF NOT EXISTS branches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    address TEXT,
    city VARCHAR(100),
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    is_warehouse BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default branches (IGNORE duplicates if already exists)
INSERT IGNORE INTO branches (name, code, address, city, contact_person, contact_phone, is_warehouse, is_active) VALUES
('Main Warehouse', 'WH-MAIN', '123 Industrial Ave, Warehouse District', 'Manila', 'Juan Dela Cruz', '09171234567', TRUE, TRUE),
('SM Mall of Asia Branch', 'BR-MOA', 'SM Mall of Asia, Ground Floor', 'Pasay City', 'Maria Santos', '09181234567', FALSE, TRUE),
('Greenbelt Branch', 'BR-GB', 'Greenbelt 5, 2nd Floor', 'Makati City', 'Pedro Garcia', '09191234567', FALSE, TRUE),
('Trinoma Branch', 'BR-TRI', 'Trinoma Mall, North Wing', 'Quezon City', 'Ana Reyes', '09201234567', FALSE, TRUE);

-- Inventory Stock per Branch (tracks current stock levels at each location)
CREATE TABLE IF NOT EXISTS branch_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    product_id INT NOT NULL,
    variation_id VARCHAR(50) DEFAULT NULL,
    quantity INT NOT NULL DEFAULT 0,
    min_stock_level INT DEFAULT 5,
    max_stock_level INT DEFAULT 100,
    last_restocked TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_branch_product_variation (branch_id, product_id, variation_id)
);

-- Inventory Transactions Table (tracks all stock movements)
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_code VARCHAR(50) NOT NULL UNIQUE,
    transaction_type ENUM('stock_in', 'stock_out', 'transfer', 'adjustment', 'return', 'damaged') NOT NULL,
    product_id INT NOT NULL,
    variation_id VARCHAR(50) DEFAULT NULL,
    quantity INT NOT NULL,
    
    -- Source and destination for transfers
    source_branch_id INT DEFAULT NULL,
    destination_branch_id INT DEFAULT NULL,
    
    -- For single branch operations (stock_in, stock_out)
    branch_id INT DEFAULT NULL,
    
    -- Reference information
    reference_type ENUM('purchase_order', 'sales_order', 'transfer_order', 'adjustment', 'return', 'other') DEFAULT 'other',
    reference_number VARCHAR(100) DEFAULT NULL,
    
    -- Cost tracking
    unit_cost DECIMAL(10,2) DEFAULT NULL,
    total_cost DECIMAL(10,2) DEFAULT NULL,
    
    -- Additional details
    supplier VARCHAR(200) DEFAULT NULL,
    remarks TEXT,
    reason TEXT,
    
    -- Status
    status ENUM('pending', 'in_transit', 'completed', 'cancelled') DEFAULT 'completed',
    
    -- Audit
    created_by INT DEFAULT NULL,
    approved_by INT DEFAULT NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (source_branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    FOREIGN KEY (destination_branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- Stock Alerts Table
CREATE TABLE IF NOT EXISTS stock_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    product_id INT NOT NULL,
    variation_id VARCHAR(50) DEFAULT NULL,
    alert_type ENUM('low_stock', 'out_of_stock', 'overstock', 'expiring') NOT NULL,
    current_quantity INT NOT NULL,
    threshold_quantity INT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP NULL,
    resolved_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX idx_transactions_date ON inventory_transactions(created_at);
CREATE INDEX idx_transactions_product ON inventory_transactions(product_id);
CREATE INDEX idx_transactions_branch ON inventory_transactions(branch_id);
CREATE INDEX idx_branch_inventory_product ON branch_inventory(product_id);
CREATE INDEX idx_branch_inventory_branch ON branch_inventory(branch_id);
