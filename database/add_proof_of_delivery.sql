-- Add proof_of_delivery_url column to orders table
-- This stores the Cloudinary URL of the delivery proof photo

ALTER TABLE orders ADD COLUMN IF NOT EXISTS proof_of_delivery_url TEXT DEFAULT NULL AFTER tracking_url;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method VARCHAR(50) DEFAULT NULL AFTER shipping_notes;

-- Verify columns exist
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'orders' 
AND COLUMN_NAME IN ('proof_of_delivery_url', 'shipping_method');
