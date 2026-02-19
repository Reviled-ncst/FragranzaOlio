-- =====================================================
-- SHOP/SERVICE RATINGS SCHEMA
-- Run this to add shop/service rating functionality
-- =====================================================

CREATE TABLE IF NOT EXISTS shop_ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    user_id INT,
    customer_name VARCHAR(100),
    customer_email VARCHAR(100),
    
    -- Overall shop/service rating (1-5 stars)
    rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    
    -- Specific ratings (optional)
    service_rating TINYINT CHECK (service_rating >= 1 AND service_rating <= 5),
    delivery_rating TINYINT CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
    packaging_rating TINYINT CHECK (packaging_rating >= 1 AND packaging_rating <= 5),
    
    -- Feedback content
    feedback TEXT,
    
    -- Would recommend
    would_recommend BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- One rating per order
    UNIQUE KEY unique_order_rating (order_id),
    
    INDEX idx_shop_rating (rating),
    INDEX idx_shop_user (user_id),
    INDEX idx_shop_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Track if an order has a shop rating
ALTER TABLE orders 
    ADD COLUMN IF NOT EXISTS shop_rated BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS shop_rating_id INT,
    ADD CONSTRAINT fk_orders_shop_rating FOREIGN KEY (shop_rating_id) REFERENCES shop_ratings(id) ON DELETE SET NULL;

-- Create aggregate stats table to avoid recalculating
CREATE TABLE IF NOT EXISTS shop_rating_stats (
    id INT PRIMARY KEY DEFAULT 1,
    total_ratings INT DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    average_service DECIMAL(3,2) DEFAULT 0.00,
    average_delivery DECIMAL(3,2) DEFAULT 0.00,
    average_packaging DECIMAL(3,2) DEFAULT 0.00,
    recommend_percentage DECIMAL(5,2) DEFAULT 0.00,
    rating_5_count INT DEFAULT 0,
    rating_4_count INT DEFAULT 0,
    rating_3_count INT DEFAULT 0,
    rating_2_count INT DEFAULT 0,
    rating_1_count INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initialize stats row
INSERT IGNORE INTO shop_rating_stats (id) VALUES (1);

-- Trigger to update stats after insert
DELIMITER //
CREATE TRIGGER IF NOT EXISTS update_shop_stats_after_insert
AFTER INSERT ON shop_ratings
FOR EACH ROW
BEGIN
    UPDATE shop_rating_stats SET
        total_ratings = (SELECT COUNT(*) FROM shop_ratings),
        average_rating = (SELECT AVG(rating) FROM shop_ratings),
        average_service = (SELECT AVG(service_rating) FROM shop_ratings WHERE service_rating IS NOT NULL),
        average_delivery = (SELECT AVG(delivery_rating) FROM shop_ratings WHERE delivery_rating IS NOT NULL),
        average_packaging = (SELECT AVG(packaging_rating) FROM shop_ratings WHERE packaging_rating IS NOT NULL),
        recommend_percentage = (SELECT (SUM(would_recommend) / COUNT(*)) * 100 FROM shop_ratings),
        rating_5_count = (SELECT COUNT(*) FROM shop_ratings WHERE rating = 5),
        rating_4_count = (SELECT COUNT(*) FROM shop_ratings WHERE rating = 4),
        rating_3_count = (SELECT COUNT(*) FROM shop_ratings WHERE rating = 3),
        rating_2_count = (SELECT COUNT(*) FROM shop_ratings WHERE rating = 2),
        rating_1_count = (SELECT COUNT(*) FROM shop_ratings WHERE rating = 1)
    WHERE id = 1;
    
    -- Update order shop_rated flag
    IF NEW.order_id IS NOT NULL THEN
        UPDATE orders SET shop_rated = TRUE, shop_rating_id = NEW.id WHERE id = NEW.order_id;
    END IF;
END//

CREATE TRIGGER IF NOT EXISTS update_shop_stats_after_update
AFTER UPDATE ON shop_ratings
FOR EACH ROW
BEGIN
    UPDATE shop_rating_stats SET
        total_ratings = (SELECT COUNT(*) FROM shop_ratings),
        average_rating = (SELECT AVG(rating) FROM shop_ratings),
        average_service = (SELECT AVG(service_rating) FROM shop_ratings WHERE service_rating IS NOT NULL),
        average_delivery = (SELECT AVG(delivery_rating) FROM shop_ratings WHERE delivery_rating IS NOT NULL),
        average_packaging = (SELECT AVG(packaging_rating) FROM shop_ratings WHERE packaging_rating IS NOT NULL),
        recommend_percentage = (SELECT (SUM(would_recommend) / COUNT(*)) * 100 FROM shop_ratings),
        rating_5_count = (SELECT COUNT(*) FROM shop_ratings WHERE rating = 5),
        rating_4_count = (SELECT COUNT(*) FROM shop_ratings WHERE rating = 4),
        rating_3_count = (SELECT COUNT(*) FROM shop_ratings WHERE rating = 3),
        rating_2_count = (SELECT COUNT(*) FROM shop_ratings WHERE rating = 2),
        rating_1_count = (SELECT COUNT(*) FROM shop_ratings WHERE rating = 1)
    WHERE id = 1;
END//

CREATE TRIGGER IF NOT EXISTS update_shop_stats_after_delete
AFTER DELETE ON shop_ratings
FOR EACH ROW
BEGIN
    UPDATE shop_rating_stats SET
        total_ratings = (SELECT COUNT(*) FROM shop_ratings),
        average_rating = COALESCE((SELECT AVG(rating) FROM shop_ratings), 0),
        average_service = COALESCE((SELECT AVG(service_rating) FROM shop_ratings WHERE service_rating IS NOT NULL), 0),
        average_delivery = COALESCE((SELECT AVG(delivery_rating) FROM shop_ratings WHERE delivery_rating IS NOT NULL), 0),
        average_packaging = COALESCE((SELECT AVG(packaging_rating) FROM shop_ratings WHERE packaging_rating IS NOT NULL), 0),
        recommend_percentage = COALESCE((SELECT (SUM(would_recommend) / COUNT(*)) * 100 FROM shop_ratings), 0),
        rating_5_count = (SELECT COUNT(*) FROM shop_ratings WHERE rating = 5),
        rating_4_count = (SELECT COUNT(*) FROM shop_ratings WHERE rating = 4),
        rating_3_count = (SELECT COUNT(*) FROM shop_ratings WHERE rating = 3),
        rating_2_count = (SELECT COUNT(*) FROM shop_ratings WHERE rating = 2),
        rating_1_count = (SELECT COUNT(*) FROM shop_ratings WHERE rating = 1)
    WHERE id = 1;
    
    -- Update order shop_rated flag
    IF OLD.order_id IS NOT NULL THEN
        UPDATE orders SET shop_rated = FALSE, shop_rating_id = NULL WHERE id = OLD.order_id;
    END IF;
END//
DELIMITER ;

SELECT 'Shop ratings schema created successfully!' as message;
