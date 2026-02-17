-- =====================================================
-- ORDER STATUS MIGRATION
-- Run this to update the orders table for new order flow
-- =====================================================

-- Add new columns for enhanced tracking
ALTER TABLE orders 
    ADD COLUMN IF NOT EXISTS tracking_url VARCHAR(500) AFTER tracking_number,
    ADD COLUMN IF NOT EXISTS courier_name VARCHAR(100) AFTER tracking_url,
    ADD COLUMN IF NOT EXISTS estimated_delivery DATETIME AFTER courier_name,
    ADD COLUMN IF NOT EXISTS shipping_method ENUM('delivery', 'store_pickup') DEFAULT 'delivery' AFTER shipping_notes,
    ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50) AFTER shipping_method;

-- Update status ENUM to include new statuses
-- Note: MySQL requires recreating the ENUM. This is a safe way to do it.
ALTER TABLE orders 
    MODIFY COLUMN status ENUM(
        'ordered',
        'paid_waiting_approval',
        'cod_waiting_approval', 
        'paid_ready_pickup',
        'processing',
        'in_transit',
        'waiting_client',
        'delivered',
        'picked_up',
        'completed',
        'cancelled',
        'return_requested',
        'return_approved',
        'returned',
        'refund_requested',
        'refunded',
        -- Keep old values for backwards compatibility
        'pending',
        'confirmed'
    ) DEFAULT 'ordered';

-- Update payment_method ENUM to include COP (Cash on Pickup)
ALTER TABLE orders 
    MODIFY COLUMN payment_method ENUM(
        'cod',
        'cop',
        'gcash',
        'maya',
        'bank_transfer',
        'credit_card',
        'card',
        'store_payment'
    ) DEFAULT 'cod';

-- Create order_status_history table for tracking timeline
CREATE TABLE IF NOT EXISTS order_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    note TEXT,
    changed_by VARCHAR(100), -- Can be user_id or 'system' for auto-complete
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_status_history_order (order_id),
    INDEX idx_status_history_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrate existing 'pending' orders to 'ordered'
UPDATE orders SET status = 'ordered' WHERE status = 'pending';
UPDATE orders SET status = 'processing' WHERE status = 'confirmed';

-- Add index for better performance
ALTER TABLE orders ADD INDEX IF NOT EXISTS idx_orders_shipping_method (shipping_method);

SELECT 'Order status migration completed!' as message;
