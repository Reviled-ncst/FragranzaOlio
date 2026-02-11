-- Fragranza Olio - Schema Update for ERP
-- Run this in Supabase SQL Editor to add missing columns

-- Add user_role enum if not exists
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'admin', 'sales', 'inventory', 'finance', 'supplier');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'customer' NOT NULL,
ADD COLUMN IF NOT EXISTS company_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS company_position VARCHAR(100),
ADD COLUMN IF NOT EXISTS department VARCHAR(50),
ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
