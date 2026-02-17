-- =====================================================
-- COMPLETE ORDER SYSTEM MIGRATION
-- Fragranza Order Management System Updates
-- Run this file to apply all order-related changes
-- =====================================================

USE fragranza_db;

-- =====================================================
-- 1. ORDER TABLE UPDATES
-- =====================================================

-- Add new columns for enhanced tracking
ALTER TABLE orders 
    ADD COLUMN IF NOT EXISTS tracking_url VARCHAR(500) AFTER tracking_number,
    ADD COLUMN IF NOT EXISTS courier_name VARCHAR(100) AFTER tracking_url,
    ADD COLUMN IF NOT EXISTS estimated_delivery DATETIME AFTER courier_name;

-- Ensure shipping_method and vehicle_type columns exist
ALTER TABLE orders 
    ADD COLUMN IF NOT EXISTS shipping_method ENUM('delivery', 'store_pickup') DEFAULT 'delivery',
    ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50);

-- Update status ENUM to include all new statuses
-- Order Flow: ordered → paid_waiting_approval/cod_waiting_approval → processing/paid_ready_pickup 
--          → in_transit/waiting_client → delivered/picked_up → completed → return_requested → returned/refunded
ALTER TABLE orders 
    MODIFY COLUMN status ENUM(
        'ordered',              -- Initial state after checkout
        'paid_waiting_approval', -- Paid (GCash/Maya/Bank) waiting admin verification
        'cod_waiting_approval',  -- COD/COP waiting admin confirmation
        'paid_ready_pickup',     -- Paid and ready for store pickup
        'processing',            -- Being prepared for delivery
        'in_transit',           -- Out for delivery (with Lalamove/courier)
        'waiting_client',       -- At delivery point, waiting for client
        'delivered',            -- Successfully delivered (customer can mark completed)
        'picked_up',            -- Successfully picked up at store (customer can mark completed)
        'completed',            -- Order finalized (customer confirmed or auto-completed after 7 days)
        'cancelled',            -- Order cancelled
        'return_requested',     -- Customer requested return
        'return_approved',      -- Return approved by admin
        'returned',             -- Item returned
        'refund_requested',     -- Customer requested refund
        'refunded',             -- Refund completed
        -- Legacy values for backwards compatibility
        'pending',
        'confirmed'
    ) DEFAULT 'ordered';

-- Update payment_method ENUM to include COP (Cash on Pickup)
ALTER TABLE orders 
    MODIFY COLUMN payment_method ENUM(
        'cod',           -- Cash on Delivery
        'cop',           -- Cash on Pickup
        'gcash',         -- GCash
        'maya',          -- Maya/PayMaya
        'bank_transfer', -- Bank Transfer
        'credit_card',   -- Credit Card
        'card',          -- Generic Card
        'store_payment'  -- Pay at Store
    ) DEFAULT 'cod';

-- Add indexes for better performance
ALTER TABLE orders 
    ADD INDEX IF NOT EXISTS idx_orders_shipping_method (shipping_method),
    ADD INDEX IF NOT EXISTS idx_orders_status (status),
    ADD INDEX IF NOT EXISTS idx_orders_updated (updated_at);

-- =====================================================
-- 2. ORDER STATUS HISTORY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS order_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    note TEXT,
    changed_by VARCHAR(100), -- Can be user_id, admin name, or 'system' for auto-complete
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_status_history_order (order_id),
    INDEX idx_status_history_created (created_at),
    INDEX idx_status_history_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. PRODUCT REVIEWS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS product_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    order_id INT,
    order_item_id INT,
    user_id INT,
    customer_name VARCHAR(100),
    customer_email VARCHAR(100),
    
    -- Rating (1-5 stars)
    rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    
    -- Review content
    title VARCHAR(200),
    review TEXT,
    
    -- Media
    images JSON, -- Array of image URLs
    
    -- Moderation
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_count INT DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_reviews_product (product_id),
    INDEX idx_reviews_order (order_id),
    INDEX idx_reviews_user (user_id),
    INDEX idx_reviews_rating (rating),
    INDEX idx_reviews_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. ORDER ITEMS UPDATES (for review tracking)
-- =====================================================

ALTER TABLE order_items 
    ADD COLUMN IF NOT EXISTS reviewed BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS review_id INT;

-- Add foreign key only if it doesn't exist
-- (Run this manually if needed, as MySQL doesn't support IF NOT EXISTS for constraints)
-- ALTER TABLE order_items ADD CONSTRAINT fk_order_items_review 
--     FOREIGN KEY (review_id) REFERENCES product_reviews(id) ON DELETE SET NULL;

-- =====================================================
-- 5. PRODUCTS TABLE UPDATES (for rating cache)
-- =====================================================

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2,1) DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;

-- =====================================================
-- 6. MIGRATE EXISTING DATA
-- =====================================================

-- Migrate existing 'pending' orders to 'ordered'
UPDATE orders SET status = 'ordered' WHERE status = 'pending';

-- Migrate existing 'confirmed' orders to 'processing'
UPDATE orders SET status = 'processing' WHERE status = 'confirmed';

-- Auto-complete orders that were delivered/picked_up more than 7 days ago
UPDATE orders 
SET status = 'completed', 
    notes = CONCAT(COALESCE(notes, ''), ' [Auto-completed by migration]')
WHERE status IN ('delivered', 'picked_up') 
AND updated_at < DATE_SUB(NOW(), INTERVAL 7 DAY);

-- =====================================================
-- 7. AUTO-COMPLETE EVENT (runs daily)
-- =====================================================

-- Enable event scheduler (must be done by admin)
-- SET GLOBAL event_scheduler = ON;

-- Create event to auto-complete delivered/picked_up orders after 7 days
DROP EVENT IF EXISTS auto_complete_delivered_orders;

DELIMITER //
CREATE EVENT IF NOT EXISTS auto_complete_delivered_orders
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    -- Find and complete orders
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_order_id INT;
    
    DECLARE order_cursor CURSOR FOR 
        SELECT id FROM orders 
        WHERE status IN ('delivered', 'picked_up') 
        AND updated_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN order_cursor;
    
    read_loop: LOOP
        FETCH order_cursor INTO v_order_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Update order status
        UPDATE orders 
        SET status = 'completed', 
            updated_at = NOW(),
            notes = CONCAT(COALESCE(notes, ''), ' [Auto-completed after 7 days]')
        WHERE id = v_order_id;
        
        -- Add to status history
        INSERT INTO order_status_history (order_id, status, note, changed_by)
        VALUES (v_order_id, 'completed', 'Auto-completed after 7 days', 'system');
    END LOOP;
    
    CLOSE order_cursor;
END//
DELIMITER ;

-- =====================================================
-- 8. TRIGGERS FOR PRODUCT RATINGS
-- =====================================================

DROP TRIGGER IF EXISTS update_product_rating_after_insert;
DROP TRIGGER IF EXISTS update_product_rating_after_update;
DROP TRIGGER IF EXISTS update_product_rating_after_delete;

DELIMITER //

CREATE TRIGGER update_product_rating_after_insert
AFTER INSERT ON product_reviews
FOR EACH ROW
BEGIN
    IF NEW.status = 'approved' THEN
        UPDATE products 
        SET 
            average_rating = (SELECT AVG(rating) FROM product_reviews WHERE product_id = NEW.product_id AND status = 'approved'),
            review_count = (SELECT COUNT(*) FROM product_reviews WHERE product_id = NEW.product_id AND status = 'approved')
        WHERE id = NEW.product_id;
    END IF;
END//

CREATE TRIGGER update_product_rating_after_update
AFTER UPDATE ON product_reviews
FOR EACH ROW
BEGIN
    UPDATE products 
    SET 
        average_rating = (SELECT AVG(rating) FROM product_reviews WHERE product_id = NEW.product_id AND status = 'approved'),
        review_count = (SELECT COUNT(*) FROM product_reviews WHERE product_id = NEW.product_id AND status = 'approved')
    WHERE id = NEW.product_id;
END//

CREATE TRIGGER update_product_rating_after_delete
AFTER DELETE ON product_reviews
FOR EACH ROW
BEGIN
    UPDATE products 
    SET 
        average_rating = COALESCE((SELECT AVG(rating) FROM product_reviews WHERE product_id = OLD.product_id AND status = 'approved'), 0),
        review_count = (SELECT COUNT(*) FROM product_reviews WHERE product_id = OLD.product_id AND status = 'approved')
    WHERE id = OLD.product_id;
END//

DELIMITER ;

-- =====================================================
-- MIGRATION COMPLETE!
-- =====================================================

SELECT 'Complete Order Migration executed successfully!' as message;
SELECT 'Order statuses updated, review tables created, auto-complete event scheduled.' as details;
