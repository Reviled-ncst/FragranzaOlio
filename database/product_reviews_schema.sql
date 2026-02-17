-- =====================================================
-- PRODUCT REVIEWS & RATINGS SCHEMA
-- Run this to add product rating functionality
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

-- Track which order items have been reviewed
ALTER TABLE order_items 
    ADD COLUMN IF NOT EXISTS reviewed BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS review_id INT,
    ADD CONSTRAINT fk_order_items_review FOREIGN KEY (review_id) REFERENCES product_reviews(id) ON DELETE SET NULL;

-- Add average rating cache to products table
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2,1) DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;

-- Create trigger to update product rating stats
DELIMITER //
CREATE TRIGGER IF NOT EXISTS update_product_rating_after_insert
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

CREATE TRIGGER IF NOT EXISTS update_product_rating_after_update
AFTER UPDATE ON product_reviews
FOR EACH ROW
BEGIN
    UPDATE products 
    SET 
        average_rating = (SELECT AVG(rating) FROM product_reviews WHERE product_id = NEW.product_id AND status = 'approved'),
        review_count = (SELECT COUNT(*) FROM product_reviews WHERE product_id = NEW.product_id AND status = 'approved')
    WHERE id = NEW.product_id;
END//

CREATE TRIGGER IF NOT EXISTS update_product_rating_after_delete
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

SELECT 'Product reviews schema created successfully!' as message;
