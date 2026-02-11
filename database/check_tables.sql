-- Quick check if products/categories tables exist
-- Run this in Supabase SQL Editor first

SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('products', 'categories') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('products', 'categories')
ORDER BY table_name;

-- If this returns 0 rows, you need to run quick_products_setup.sql
