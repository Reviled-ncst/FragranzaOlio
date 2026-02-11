-- Add variations column to products table
-- Run this in phpMyAdmin or MySQL command line

-- Add variations JSON column to store product size/volume variations
-- Each variation has: id, volume, price, comparePrice, stock, sku

ALTER TABLE products 
ADD COLUMN variations JSON DEFAULT NULL 
COMMENT 'JSON array of product variations [{id, volume, price, comparePrice, stock, sku}]';

-- Example variation data:
-- [
--   {"id": "var-1", "volume": "30ml", "price": 280, "comparePrice": 350, "stock": 25, "sku": "MP-MEN-001-30ML"},
--   {"id": "var-2", "volume": "100ml", "price": 650, "comparePrice": 800, "stock": 15, "sku": "MP-MEN-001-100ML"}
-- ]

-- Verify the column was added
DESCRIBE products;
