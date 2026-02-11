-- Fragranza Olio - Admin Activity Logs Schema
-- Tracks all admin actions for audit trail

USE fragranza_db;

-- Create admin activity logs table
CREATE TABLE IF NOT EXISTS admin_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    admin_name VARCHAR(200) NOT NULL,
    admin_email VARCHAR(255) NOT NULL,
    action_type ENUM('create', 'update', 'delete', 'login', 'logout', 'view', 'export', 'import', 'other') NOT NULL,
    target_type ENUM('user', 'product', 'inventory', 'order', 'category', 'settings', 'system') NOT NULL,
    target_id INT NULL,
    target_name VARCHAR(255) NULL,
    description TEXT NOT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_admin_id (admin_id),
    INDEX idx_action_type (action_type),
    INDEX idx_target_type (target_type),
    INDEX idx_target_id (target_id),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add index for date range queries
CREATE INDEX idx_admin_logs_date_range ON admin_logs (created_at, action_type);

-- Verify table creation
DESCRIBE admin_logs;

-- Sample query to get recent admin activities
-- SELECT al.*, u.first_name, u.last_name 
-- FROM admin_logs al 
-- JOIN users u ON al.admin_id = u.id 
-- ORDER BY al.created_at DESC 
-- LIMIT 50;
