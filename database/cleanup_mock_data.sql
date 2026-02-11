-- Cleanup Mock/Sample Data from Sales Tables
-- Run this to remove test data and keep only real orders

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Delete mock complaint messages
DELETE FROM complaint_messages WHERE complaint_id IN (
    SELECT id FROM complaints WHERE ticket_number LIKE 'TKT-20260210-%'
);

-- Delete mock complaints
DELETE FROM complaints WHERE ticket_number LIKE 'TKT-20260210-%';

-- Delete mock invoices (sample invoices with pattern INV-20260210-XXX)
DELETE FROM invoices WHERE invoice_number LIKE 'INV-20260210-%';

-- Delete mock order items (those linked to mock orders)
DELETE FROM order_items WHERE order_id IN (
    SELECT id FROM orders WHERE order_number LIKE 'ORD-20260210-%'
);

-- Delete mock orders (sample orders with pattern ORD-20260210-XXX)
DELETE FROM orders WHERE order_number LIKE 'ORD-20260210-%';

-- Delete mock customers (sample customers with @email.com pattern)
DELETE FROM customers WHERE email LIKE '%@email.com';

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Show remaining real data
SELECT 'Remaining Orders:' as info;
SELECT id, order_number, total_amount, status, created_at FROM orders ORDER BY created_at DESC;

SELECT 'Remaining Customers:' as info;
SELECT id, first_name, last_name, email FROM customers;

SELECT 'Remaining Invoices:' as info;
SELECT id, invoice_number, order_id, total_amount, status FROM invoices;
